/**
 * Reins kernel types — NORMATIVE.
 *
 * This file is the single source of truth for the kernel data model.
 * - SPEC.md defines semantics; INVARIANTS.md defines laws (I-*) that tests must enforce.
 * - Copy this file verbatim into packages/core/src/types.ts. Changing any exported
 *   shape requires a decision record (DECISIONS.md, D-NNN) BEFORE the change.
 * - Persisted data types are JSON-serializable. Types documented as runtime-only may hold functions.
 *   No `any`. No class instances in persisted data.
 * - Merge-extensible maps (`...Map` interfaces) may be extended by plugins via
 *   declaration merging, with keys namespaced `<plugin>/<name>`.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* 0. Scalars                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

declare const __brand: unique symbol
/**
 * SOFT brand (D-042): documents intent, but plain `T` values are assignable, so authors can
 * write literals (`id="no-raw-sql"`, `at="workspace://app/src/**"`) in JSX and frontmatter.
 * Validity is enforced at runtime by the kernel's parse/validate functions, never by the type system.
 */
export type Brand<T, B extends string> = T & { readonly [__brand]?: B }

/** `sha256:<64 lowercase hex>`. Of RFC 8785 (JCS) canonical JSON for data, of raw bytes for files. */
export type Digest = Brand<string, 'Digest'>
/** Local node id. Regex: ^[a-z][a-z0-9-]*(\.[a-z0-9-]+)*$ . Unique within one package. */
export type NodeId = Brand<string, 'NodeId'>
/**
 * `<package-name>#<NodeId>` for nodes with an explicit id — stable across versions.
 * `<package-name>#~<via-path>/<sibling-index>` for anonymous nodes — NOT stable by design.
 * The package version is carried by ETree.package, not by the gid.
 */
export type GlobalNodeId = Brand<string, 'GlobalNodeId'>
/** ULID. */
export type RunId = Brand<string, 'RunId'>
/** Caller-chosen session key. Regex: ^[a-z][a-z0-9-]{0,62}$ . Unique among siblings. */
export type SessionKey = Brand<string, 'SessionKey'>
/** `<kind>:<opaque>` e.g. `human:alice`, `agent:run/01J…/root`. */
export type PrincipalId = Brand<string, 'PrincipalId'>
/** `<HostKind>@<semver>` e.g. `claude-code@0.1.0`. */
export type HostId = Brand<string, 'HostId'>
/** RFC 3339 UTC timestamp. */
export type Timestamp = Brand<string, 'Timestamp'>

export type Json = null | boolean | number | string | readonly Json[] | { readonly [k: string]: Json }

/* ────────────────────────────────────────────────────────────────────────── */
/* 1. References and namespaces  (SPEC §4)                                    */
/* ────────────────────────────────────────────────────────────────────────── */

/** Built-in schemes. Plugins add schemes by registering a Resolver. */
export type Scheme =
  | 'workspace' // the thing an agent operates on (repo, notes dir, …)
  | 'harness' // a harness package
  | 'context' // a context store (knowledge corpora, external docs)
  | 'session' // a live or durable agent session
  | 'run' // a run and its log
  | 'artifact' // produced outputs (reports, patches, eval results)
  | (string & {})

/**
 * Canonical string form: <scheme>://<authority>[/<path>][@<pin>][#<fragment>]
 * - authority: ^[a-z0-9][a-z0-9._-]*$ ; for scheme `harness` additionally an npm package name
 *   ^(@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$ (D-018), e.g. harness://@me/swe@^2#rule-id
 * - path: POSIX, normalized, no `.`/`..` segments, no trailing slash (root path is "")
 * - pin and fragment as in {@link Ref}.
 */
export type RefString = Brand<string, 'RefString'>

/** Same grammar as RefString but `path` may contain `*` (one segment) and `**` (any depth). Never pinned. */
export type RefPattern = Brand<string, 'RefPattern'>

export type Pin =
  | { readonly kind: 'digest'; readonly digest: Digest }
  | { readonly kind: 'git'; readonly commit: string; readonly dirty?: Digest }
  | { readonly kind: 'semver'; readonly range: string } // only valid for `harness:` refs, resolved through the Lock
  | { readonly kind: 'tag'; readonly tag: string } // resolved through the Lock

export interface Ref {
  readonly scheme: Scheme
  readonly authority: string
  readonly path: string
  readonly pin?: Pin
  readonly fragment?: string
}

export type WorkspaceMode =
  /** Harness source lives outside the workspace; host outputs are generated and git-excluded. Default. */
  | 'generated'
  /** Harness source lives inside the workspace (e.g. `.reins/`) and is committed with it. */
  | 'embedded'

/** One entry of a namespace: binds (scheme, authority) to a resolver + config. */
export interface Mount {
  readonly scheme: Scheme
  readonly authority: string
  /** Resolver plugin id, e.g. `fs`, `git-worktree`, `agentfs`, `harness-pkg`. */
  readonly resolver: string
  readonly config: Json
  /** Upper bound of rights obtainable through this mount (intersected with principal caps). */
  readonly ceiling: readonly Right[]
  /** Only meaningful for scheme `workspace`. */
  readonly mode?: WorkspaceMode
  /** Base version captured when the mount entered a Run (I-REF-2). */
  readonly base?: Digest
}

/**
 * Per-run (per-session) name space, Plan 9 style. Immutable value;
 * "changing" it produces a new Namespace whose `parent` is the old id.
 */
export interface Namespace {
  /** Digest of the canonical form of {mounts, parent}. */
  readonly id: Digest
  readonly mounts: readonly Mount[]
  readonly parent?: Digest
}

export type Locator =
  | { readonly kind: 'path'; readonly path: string } // absolute host path
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'agentfs'; readonly db: string; readonly path: string }

export interface Resolved {
  readonly ref: Ref
  readonly mount: Mount
  readonly locator: Locator
  /** Content version of the resolved object at resolution time. */
  readonly version: Digest
}

/** Runtime-only (holds functions). Registered by plugins. */
export interface RuntimeResolver {
  readonly id: string
  readonly schemes: readonly Scheme[]
  resolve(ref: Ref, mount: Mount, lock: Lockfile): Promise<Resolved>
  /** Content digest of the whole mount (for Mount.base and ws/snapshot). */
  snapshot(mount: Mount): Promise<Digest>
  /** Optional: produce an isolated copy (worktree, CoW overlay). */
  fork?(mount: Mount, opts: ForkOptions): Promise<Mount>
}

export interface ForkOptions {
  readonly mode: 'fork-worktree' | 'fork-cow' | 'new-repo'
  readonly authority: string // authority name in the child namespace
  readonly label?: string
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 2. Capabilities, budgets, principals  (SPEC §9)                            */
/* ────────────────────────────────────────────────────────────────────────── */

export type Right =
  | 'read'
  | 'write'
  | 'exec' // run processes with the resource as cwd/input
  | 'net'
  | 'spawn' // mount child sessions
  | 'harness:propose' // create Proposals against a harness package
  | 'harness:write' // apply changes to harness source (never held by kind 'agent', I-CAP-2)

export interface Grant {
  readonly on: RefPattern
  readonly rights: readonly Right[]
}

/** Absent field = no limit at this level (still bounded by ancestors). */
export interface Budget {
  readonly tokens?: number
  readonly usdMicros?: number
  readonly wallclockMs?: number
  /** Max session depth below the holder (0 = may not spawn). */
  readonly maxDepth?: number
  /** Max concurrently mounted direct children. */
  readonly maxChildren?: number
}

export interface CapSet {
  readonly grants: readonly Grant[]
  readonly budget: Budget
}

/** How a granted capability is actually enforced for a given session (I-CAP-3). */
export type Enforcement =
  | 'enforced' // checked on every operation by a guard Reins controls
  | 'launch-time' // enforced only by how the process was started (separate dir, env, sandbox)
  | 'advisory' // only stated in prose to the model

export type PrincipalKind = 'human' | 'agent' | 'reconciler' | 'evolver' | 'promoter' | 'system'

export interface Principal {
  readonly id: PrincipalId
  readonly kind: PrincipalKind
  readonly caps: CapSet
  readonly parent?: PrincipalId
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 3. Content, predicates, anchors  (SPEC §5)                                 */
/* ────────────────────────────────────────────────────────────────────────── */

/** Leaf prose. `ref` is resolved during elaboration; ETree only contains `md`. */
export type Content =
  | { readonly format: 'md'; readonly text: string }
  | { readonly format: 'ref'; readonly ref: RefString }

/**
 * Data-only conditions (serializable, so static hosts can render them as prose).
 * Evaluated against the LogProjection 'reins/task-state' (SPEC §6.4).
 */
export type Predicate =
  | { readonly op: 'touches'; readonly pattern: RefPattern } // task's touched/changed files intersect pattern
  | { readonly op: 'event'; readonly kind: string; readonly within: 'turn' | 'session' } // log has event of kind
  | { readonly op: 'phase'; readonly is: string } // task-state phase equals
  | { readonly op: 'and'; readonly of: readonly Predicate[] }
  | { readonly op: 'or'; readonly of: readonly Predicate[] }
  | { readonly op: 'not'; readonly of: Predicate }
  | { readonly op: 'custom'; readonly evaluator: string; readonly config: Json; readonly describe: string }

/** A machine-checkable ground for a statement (SPEC §8.3). */
export type Anchor =
  | { readonly kind: 'path'; readonly pattern: RefPattern; readonly expect: 'exists' | 'absent' }
  | {
      readonly kind: 'grep'
      readonly in: RefPattern
      readonly regex: string // ECMAScript, flags 'u'
      readonly expect: 'match' | 'no-match'
    }
  | {
      readonly kind: 'command'
      readonly argv: readonly string[]
      readonly cwd: RefString
      readonly expectExit: number
      readonly timeoutMs: number
    }
  | {
      readonly kind: 'import-boundary'
      readonly from: RefPattern
      readonly mustNotImport: RefPattern
    }
  | { readonly kind: 'custom'; readonly evaluator: string; readonly config: Json }

export type AnchorStatus = 'holds' | 'violated' | 'unverifiable' | 'error'

export interface AnchorResult {
  readonly node: GlobalNodeId
  readonly index: number // index into node.anchors
  readonly status: AnchorStatus
  readonly workspace: Digest // snapshot evaluated against
  readonly evidence: string // human-readable, ≤ 4 KiB
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 4. Elements — authoring tree  (SPEC §5, §6)                                */
/* ────────────────────────────────────────────────────────────────────────── */

export type ElementKind =
  | 'scope'
  | 'instruction'
  | 'knowledge'
  | 'rule'
  | 'skill'
  | 'tool'
  | 'context'
  | 'task'
  | 'session'
  | 'raw'
  | 'fragment'

/** How fast a node's rendered bytes may change. Hosts order output by this (I-RENDER-4). */
export type Volatility = 'static' | 'session' | 'turn'

/** What a host does when it cannot realize a node natively. */
export type OnUnsupported = 'error' | 'drop' | 'downgrade'

export type HostKind = 'agents-md' | 'claude-code' | 'codex' | 'dsh' | (string & {})

export interface Provenance {
  readonly source: RefString // file the content came from
  readonly lines?: { readonly start: number; readonly end: number }
  readonly importedFrom?: string // original path when created by `reins import`
}

interface BaseProps {
  readonly id?: NodeId
  /** Default: inherited from the nearest scope that sets it, else `turn` for context/task and `static` for all others (D-060). */
  readonly volatility?: Volatility
  /** Restrict to these host kinds. Absent = all. Components MUST NOT branch on host otherwise (I-ELAB-2). */
  readonly hosts?: readonly HostKind[]
  readonly onUnsupported?: OnUnsupported
  readonly provenance?: Provenance
}

/** Spatial (`at`), temporal (`when`) and authority (`caps`) scoping for a subtree. */
export interface ScopeEl extends BaseProps {
  readonly kind: 'scope'
  readonly at?: RefPattern // must be a `workspace:` pattern
  readonly when?: Predicate
  /** Attenuation for everything in the subtree (intersected, never widened — I-CAP-1). */
  readonly caps?: CapSet
  /** 'allowlist': only `tool` nodes inside this scope are visible. Default 'inherit'. */
  readonly tools?: 'inherit' | 'allowlist'
  readonly children: readonly ReinsNode[]
}

/** Guidance the agent should follow. */
export interface InstructionEl extends BaseProps {
  readonly kind: 'instruction'
  readonly body: Content
  /** 0–100. Used only for ordering within a volatility bucket; higher first. Default 50. */
  readonly priority?: number
}

/** A statement about the world with epistemic status. id REQUIRED. */
export interface KnowledgeEl extends BaseProps {
  readonly kind: 'knowledge'
  readonly id: NodeId
  readonly body: Content
  readonly claim: 'fact' | 'convention' | 'hypothesis' | 'rationale' | 'preference'
  readonly anchors?: readonly Anchor[]
}

/** A constraint. id REQUIRED. */
export interface RuleEl extends BaseProps {
  readonly kind: 'rule'
  readonly id: NodeId
  readonly body: Content
  readonly enforcement: 'advisory' | 'enforced'
  /** REQUIRED when enforcement = 'enforced'. Hosts translate to their guard mechanism. */
  readonly guard?: GuardSpec
  readonly anchors?: readonly Anchor[]
}

export type GuardSpec =
  | { readonly kind: 'deny-tool'; readonly tool: string; readonly when?: ArgMatcher }
  | { readonly kind: 'deny-write'; readonly pattern: RefPattern }
  | { readonly kind: 'deny-command'; readonly argvPrefix: readonly string[] }
  | { readonly kind: 'custom'; readonly evaluator: string; readonly config: Json }

export interface ArgMatcher {
  readonly path: string // JSON pointer into tool arguments
  readonly regex: string
}

/** A named procedure, rendered in Agent Skills format where supported. id REQUIRED. */
export interface SkillEl extends BaseProps {
  readonly kind: 'skill'
  readonly id: NodeId
  readonly name: string // ^[a-z0-9-]{1,64}$
  readonly description: string // ≤ 1024 chars, used for discovery
  readonly body: Content
  readonly resources?: readonly RefString[] // extra files copied next to SKILL.md
}

/** Exposes a capability to the agent. id REQUIRED. */
export interface ToolEl extends BaseProps {
  readonly kind: 'tool'
  readonly id: NodeId
  readonly source:
    | { readonly kind: 'mcp'; readonly server: McpServerSpec }
    | { readonly kind: 'native'; readonly name: string } // host-native tool name (e.g. DSH tool, Claude Code tool)
}

export interface McpServerSpec {
  readonly name: string
  readonly transport: 'stdio' | 'http'
  readonly command?: readonly string[] // stdio
  readonly url?: string // http
  readonly env?: { readonly [k: string]: string } // values may reference ${secret:NAME}; never literal secrets
}

/** Per-turn dynamic information. id REQUIRED. Default volatility 'turn', default onUnsupported 'drop'. */
export interface ContextEl extends BaseProps {
  readonly kind: 'context'
  readonly id: NodeId
  readonly body: Content
  /** Higher survives budget pressure. Default 50. */
  readonly priority?: number
  /** Max tokens for this node after rendering; the host truncates with an explicit marker. */
  readonly budgetTokens?: number
  /** 'relay' marks untrusted content originating outside the harness (child output, web). I-SESS-2. */
  readonly trust?: 'harness' | 'relay'
}

/** The per-request prompt: what to do now. id REQUIRED. */
export interface TaskEl extends BaseProps {
  readonly kind: 'task'
  readonly id: NodeId
  readonly spec: TaskSpec
}

export interface TaskSpec {
  readonly goal: string
  readonly acceptance: readonly Check[]
  readonly constraints?: readonly string[]
  readonly deliverables?: readonly Deliverable[]
  readonly references?: readonly RefString[]
}

export type Check =
  | { readonly kind: 'command'; readonly argv: readonly string[]; readonly cwd: RefString; readonly expectExit: number }
  | { readonly kind: 'anchor'; readonly anchor: Anchor }
  | { readonly kind: 'human'; readonly question: string }

export interface Deliverable {
  readonly name: string
  readonly at?: RefPattern
  readonly description: string
}

/** A child agent session — a Portal into another host root. key REQUIRED. */
export interface SessionEl extends BaseProps {
  readonly kind: 'session'
  readonly key: SessionKey
  readonly runtime: RuntimeSpec
  readonly workspace: WorkspaceBinding
  /** Requested caps; mount uses attenuate(parent, requested, { strict: true }) (I-CAP-1, D-022). */
  readonly caps: CapSet
  /** The child's harness tree; rendered by the child runtime's host. */
  readonly children: readonly ReinsNode[]
  readonly task?: TaskSpec
  /** Human may attach to observe/intervene. Forces transport 'pty'. Default false. */
  readonly interactive?: boolean
  /** What happens when this node leaves the tree. Default 'detach' (I-SESS-3). */
  readonly onRemove?: 'detach' | 'stop'
}

export interface RuntimeSpec {
  readonly kind: 'claude-code' | 'codex' | 'dsh' | 'opencode' | 'pi' | (string & {})
  /** mise tool spec, e.g. `npm:@openai/codex@0.50.0`. Absent = whatever the lock pins. */
  readonly tool?: string
  readonly model?: string
  readonly args?: readonly string[]
}

export interface WorkspaceBinding {
  readonly from: RefString // a workspace ref in the parent namespace
  readonly mode: 'share' | 'fork-worktree' | 'fork-cow' | 'new-repo'
  /** Authority under which the child sees it, e.g. `app` → workspace://app in child namespace. */
  readonly as: string
}

/** Imported, unstructured Markdown. id and provenance REQUIRED. Rendered verbatim. */
export interface RawEl extends BaseProps {
  readonly kind: 'raw'
  readonly id: NodeId
  readonly markdown: string
  readonly provenance: Provenance
}

export interface FragmentEl {
  readonly kind: 'fragment'
  readonly children: readonly ReinsNode[]
}

export type Element =
  | ScopeEl
  | InstructionEl
  | KnowledgeEl
  | RuleEl
  | SkillEl
  | ToolEl
  | ContextEl
  | TaskEl
  | SessionEl
  | RawEl
  | FragmentEl

/** Runtime-only. A pure function from props to nodes. MAY call hooks (§6.3). */
export type Component<P = Record<string, never>> = (props: P) => ReinsNode

/**
 * Runtime-only. A deferred, TYPE-ERASED component invocation (D-045).
 * Props are captured in the closure at creation (`h(C, props)` / `use(pkg, props)`), so the
 * call is not generic and every ComponentCall is assignable to ReinsNode.
 */
export interface ComponentCall {
  readonly kind: '$component'
  /** Name used in `via` paths and diagnostics (function name, or `use:<pkg>`). */
  readonly name: string
  /** Package the produced nodes are attributed to; set only by `use()`. */
  readonly pkg?: string
  /** Invoked by elaboration inside the hook context. MUST NOT be called elsewhere. */
  readonly render: () => ReinsNode
}

/** Authoring node. `string` becomes an InstructionEl with md body. null/false/undefined/true render nothing. */
export type ReinsNode = Element | ComponentCall | string | null | boolean | undefined | readonly ReinsNode[]

/* JSX typing (D-046) ------------------------------------------------------- */

export type IntrinsicKind = Exclude<ElementKind, 'fragment'>

/** Props accepted by an intrinsic in JSX / h(): the element minus `kind`, with optional single-or-many children. */
export type IntrinsicProps<K extends IntrinsicKind> = Omit<Extract<Element, { readonly kind: K }>, 'kind' | 'children'> & {
  readonly children?: ReinsNode
}

/**
 * Declared by packages/core/src/jsx-runtime.ts as `export namespace JSX { … }` with exactly these members.
 * NOTE: with `jsx: "react-jsx"`, TypeScript passes `key` as the 3rd argument of jsx()/jsxs();
 * the runtime MUST re-insert it into props for `session` (its SessionEl.key).
 */
export interface JsxNamespaceShape {
  Element: Element | ComponentCall
  ElementType: IntrinsicKind | ((props: never) => ReinsNode)
  IntrinsicElements: { [K in IntrinsicKind]: IntrinsicProps<K> & { readonly key?: string } }
  ElementChildrenAttribute: { children: unknown }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 5. Elaborated tree — the "Harness IR"  (SPEC §6)                           */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Result of elaboration: only intrinsic kinds (no components, no fragments, no `ref` content).
 * Canonical JSON; its digest identifies "what the harness says" at a log position.
 */
export interface ETree {
  readonly package: { readonly name: string; readonly digest: Digest }
  readonly lock: Digest
  readonly namespace: Digest
  /** Digest of the `{ref: contentDigest}` map of external content used (D-024). */
  readonly external: Digest
  /** Log seq the projections were computed at; -1 = static projection (SPEC §6.4). Metadata only: NOT part of `digest` (D-025). */
  readonly logSeq: number
  /** Synthetic root: kind 'scope', gid `<pkg>#~root`, no props, never accounted (D-043). */
  readonly root: ENode
  /** digestJson({package, lock, namespace, external, root}) */
  readonly digest: Digest
}

export interface ENode {
  readonly gid: GlobalNodeId
  /** Component path for diagnostics, e.g. ["Root","Backend","AuthRules"]. */
  readonly via: readonly string[]
  readonly kind: Exclude<ElementKind, 'fragment'>
  /** Effective (inherited) values after scoping. */
  readonly effective: {
    readonly at?: RefPattern
    readonly when?: Predicate
    readonly caps: CapSet
    readonly volatility: Volatility
    readonly hosts?: readonly HostKind[]
    readonly onUnsupported: OnUnsupported
    readonly toolsMode: 'inherit' | 'allowlist'
  }
  /** Element props with Content resolved to `md`, minus children. */
  readonly props: Json
  readonly children: readonly ENode[]
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 6. Log  (SPEC §10)                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

/** Merge-extensible. Plugin keys MUST be `<plugin>/<name>`. */
export interface LogEventMap {
  'run/start': { readonly spec: RunSpec }
  'run/end': { readonly outcome: 'completed' | 'failed' | 'aborted'; readonly summary?: string }
  'ws/snapshot': { readonly authority: string; readonly digest: Digest; readonly reason: 'mount' | 'turn' | 'commit' }
  'ws/touched': { readonly paths: readonly RefString[]; readonly op: 'read' | 'write' }
  'task/state': { readonly phase: string; readonly note?: string }
  /** Turn boundary; resets TaskState.eventsThisTurn. In DSH, bridged from DSH `turn/start`. */
  'turn/start': { readonly external?: ExternalLogRef }
  /** External content fetched; body stored at $REINS_HOME/cas/<digest> (D-024). */
  'content/fetched': { readonly ref: RefString; readonly digest: Digest }
  'content/unavailable': {
    readonly ref: RefString
    readonly reason: 'timeout' | 'not-found' | 'denied' | 'error'
    readonly detail?: string
  }
  /** Harness hot-switch (D-026). Elaboration uses the latest one, else run/start's harness. */
  'harness/switched': { readonly digest: Digest; readonly lock: Digest }
  'render/intent': { readonly host: HostId; readonly plan: Digest }
  'render/committed': {
    readonly host: HostId
    readonly plan: Digest
    readonly tree: Digest
    readonly outputs: readonly { readonly target: string; readonly digest: Digest }[]
    readonly accounting: AccountingSummary
    /** System (static+session) part differs from the previous commit of this host (D-032). */
    readonly cacheBreak: boolean
    /** Written by crash recovery (D-038). */
    readonly recovered?: boolean
  }
  'render/failed': { readonly host: HostId; readonly plan: Digest; readonly error: ReinsErrorData }
  'model/request': { readonly host: HostId; readonly bytes: Digest; readonly external?: ExternalLogRef }
  'drift/detected': { readonly host: HostId; readonly target: string; readonly expected: Digest; readonly observed: Digest }
  'anchor/evaluated': { readonly result: AnchorResult }
  'proposal/created': { readonly proposal: Proposal }
  'proposal/decided': {
    readonly id: string
    readonly decision: 'applied' | 'rejected'
    readonly newVersion?: Digest
    readonly reason?: string
  }
  'session/requested': { readonly key: SessionKey; readonly spec: Json /* SessionEl props */ }
  'session/intent': { readonly key: SessionKey; readonly op: SessionOp }
  'session/mounted': {
    readonly key: SessionKey
    readonly ref: RefString
    readonly transport: 'structured' | 'pty'
    readonly caps: CapSet
    readonly enforcement: readonly { readonly grant: Grant; readonly enforcement: Enforcement }[]
  }
  'session/sent': { readonly key: SessionKey; readonly text: string }
  'session/observed': { readonly key: SessionKey; readonly observation: SessionObservation }
  'session/status': { readonly key: SessionKey; readonly status: SessionStatus }
  'session/result': { readonly key: SessionKey; readonly result: SessionResult }
  'session/unmounted': { readonly key: SessionKey; readonly how: 'detached' | 'stopped' | 'exited' }
  'cap/denied': { readonly principal: PrincipalId; readonly right: Right; readonly on: RefString; readonly reason: string }
  'budget/charged': { readonly principal: PrincipalId; readonly delta: Budget }
}

export type LogKind = keyof LogEventMap

export interface LogEvent<K extends LogKind = LogKind> {
  readonly seq: number // 0-based, contiguous
  readonly prev: Digest | null // digest of previous event, null for seq 0
  readonly at: Timestamp
  readonly run: RunId
  readonly actor: PrincipalId
  readonly kind: K
  readonly data: LogEventMap[K]
  /** Digest of canonical {seq, prev, at, run, actor, kind, data}. */
  readonly digest: Digest
}

/** Pointer into a log Reins does not own (e.g. a DSH session log). */
export interface ExternalLogRef {
  readonly system: 'dsh' | (string & {})
  readonly session: string
  readonly seqFrom: number
  readonly seqTo: number
}

/** Pure fold over the log. Runtime-only (holds functions). */
/** T must be JSON-serializable in practice (checked at runtime in dev mode); not constrained in the type (D-044). */
export interface Projection<T> {
  readonly id: string // unique, namespaced
  readonly version: number // bump when reduce semantics change
  readonly init: T
  reduce(state: T, event: LogEvent): T
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 7. Hosts and rendering  (SPEC §7)                                          */
/* ────────────────────────────────────────────────────────────────────────── */

export type Realization =
  | 'native' // host has a first-class mechanism (file, section, tool registry…)
  | 'prose' // host can only state it in text
  | 'none'

export interface HostCapabilities {
  /** Static hosts render once per change; dynamic hosts render per model request. */
  readonly dynamic: boolean
  /** Can scope content to workspace subpaths (nested files or on-touch injection). */
  readonly pathScoping: 'nested-files' | 'on-touch' | 'none'
  readonly realizes: { readonly [K in Exclude<ElementKind, 'fragment' | 'scope'>]: Realization }
  /** Can enforce GuardSpec kinds natively. */
  readonly guards: readonly GuardSpec['kind'][]
}

export type Output =
  | { readonly kind: 'file'; readonly target: string /* workspace-relative POSIX path */; readonly bytes: string }
  | {
      readonly kind: 'prompt'
      readonly scope: string // host-specific scope key ('' = global)
      readonly system: readonly PromptPart[] // static+session volatility, ordered
      readonly context: readonly PromptPart[] // turn volatility, ordered
    }
  | { readonly kind: 'tool-set'; readonly scope: string; readonly allow: readonly string[] | 'all' }
  | { readonly kind: 'guard'; readonly scope: string; readonly guards: readonly { readonly node: GlobalNodeId; readonly spec: GuardSpec }[] }

export interface PromptPart {
  readonly name: string // stable: `reins:static` | `reins:session` | `reins:turn` (scoping is by the host's registration scope, D-061)
  readonly volatility: Volatility
  readonly text: string
}

export type AccountStatus =
  | 'rendered'
  | 'degraded' // fallback prose or a logged content-unavailable placeholder (D-024)
  | 'filtered' // scope/when/hosts excluded it — reason REQUIRED
  | 'dropped' // unsupported + onUnsupported 'drop'
  | 'error' // unsupported + onUnsupported 'error' → plan fails
  | 'delegated' // descendant of a `session` node; accounted by the child's host (D-028)

export interface AccountEntry {
  readonly node: GlobalNodeId
  readonly status: AccountStatus
  readonly reason?: string
  readonly outputs?: readonly string[] // output targets/names where it appears
}

export interface Accounting {
  /** Exactly one per accountable ENode of the plan's tree (I-RENDER-2): every ENode except the synthetic root and `scope` nodes. */
  readonly entries: readonly AccountEntry[]
}

export interface AccountingSummary {
  readonly rendered: number
  readonly degraded: number
  readonly filtered: number
  readonly dropped: number
  readonly delegated: number
}

/** UTF-16 code-unit ranges (JavaScript string indices, end exclusive) of an output → origin node. */
export interface SourceMap {
  readonly output: string // file target or prompt part name
  readonly mappings: readonly { readonly start: number; readonly end: number; readonly node: GlobalNodeId | 'host' }[]
}

export interface RenderPlan {
  readonly host: HostId
  readonly tree: Digest
  readonly outputs: readonly Output[]
  readonly accounting: Accounting
  readonly sourcemaps: readonly SourceMap[]
  /** Digest of canonical {host, tree, outputs}. */
  readonly digest: Digest
}

export interface PlanContext {
  /** Evaluated projection 'reins/task-state' (static hosts: the static projection). */
  readonly taskState: TaskState
  readonly workspaceAuthority: string
}

/** Observed current state of a host's targets (read back from disk / runtime). */
export interface Observed {
  readonly host: HostId
  readonly targets: readonly { readonly target: string; readonly digest: Digest | null /* null = absent */ }[]
}

/** Per (workspace, host) record of the last successful commit. Lives in REINS_HOME, never in the workspace. */
export interface CommitRecord {
  readonly host: HostId
  readonly workspace: string // workspace authority
  readonly plan: Digest
  readonly targets: readonly { readonly target: string; readonly digest: Digest }[]
  readonly sourcemaps: readonly SourceMap[]
  readonly at: Timestamp
}

export interface CommitReceipt {
  readonly record: CommitRecord
  readonly written: readonly string[]
  readonly removed: readonly string[]
  readonly skippedDrift: readonly string[] // targets left untouched because of drift (I-HOST-2)
}

/** Runtime-only. */
export interface RuntimeHost {
  readonly id: HostId
  readonly kind: HostKind
  readonly capabilities: HostCapabilities
  /** PURE and synchronous (I-RENDER-1). */
  plan(tree: ETree, ctx: PlanContext): RenderPlan
  observe(plan: RenderPlan): Promise<Observed>
  commit(plan: RenderPlan, observed: Observed, last: CommitRecord | null, actor: Principal): Promise<CommitReceipt>
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 8. Sessions  (SPEC §11)                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export type SessionStatus =
  | 'starting'
  | 'idle'
  | 'working'
  | 'awaiting-approval' // child runtime is blocked on its own UI approval
  | 'completed'
  | 'failed'
  | 'aborted'
  | 'detached'
  | 'unknown'

export type SessionOp =
  | { readonly op: 'mount' }
  | { readonly op: 'send'; readonly text: string }
  | { readonly op: 'interrupt' }
  | { readonly op: 'detach' }
  | { readonly op: 'stop' }

export type SessionObservation =
  | { readonly kind: 'text'; readonly text: string; readonly trust: 'relay' }
  | { readonly kind: 'screen'; readonly text: string; readonly trust: 'relay' } // PTY capture
  | { readonly kind: 'usage'; readonly tokens?: number; readonly usdMicros?: number }
  | { readonly kind: 'status'; readonly status: SessionStatus }

export interface SessionResult {
  readonly status: 'completed' | 'failed' | 'aborted'
  readonly output: string // untrusted (relay)
  readonly checks: readonly { readonly check: Check; readonly passed: boolean; readonly evidence: string }[]
  readonly artifacts: readonly RefString[]
}

export interface MountRequest {
  readonly key: SessionKey
  readonly parent: RefString | null
  readonly runtime: RuntimeSpec
  readonly namespace: Namespace // the child's namespace (already forked)
  readonly caps: CapSet // already attenuated
  readonly renderedFiles: readonly { readonly target: string; readonly bytes: string }[] // child harness via static host
  readonly initialTask?: string // compiled TaskSpec text
  readonly interactive: boolean
}

/** Runtime-only. The `send/observe/interrupt/status/result` contract. */
export interface RuntimeSessionHost {
  readonly id: string
  readonly runtimes: readonly RuntimeSpec['kind'][]
  readonly transport: 'structured' | 'pty'
  mount(req: MountRequest): Promise<RuntimeSessionHandle>
  /** Re-attach to a durable session after a parent restart. */
  reattach(ref: RefString): Promise<RuntimeSessionHandle | null>
}

export interface RuntimeSessionHandle {
  readonly ref: RefString // session://<host>/<id>
  readonly enforcement: readonly { readonly grant: Grant; readonly enforcement: Enforcement }[]
  send(text: string): Promise<void>
  observe(): AsyncIterable<SessionObservation>
  interrupt(): Promise<void>
  status(): Promise<SessionStatus>
  result(): Promise<SessionResult>
  detach(): Promise<void>
  stop(): Promise<void>
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 9. Task state (built-in projection 'reins/task-state')  (SPEC §6.4)        */
/* ────────────────────────────────────────────────────────────────────────── */

export interface TaskState {
  readonly phase: string // last task/state phase, '' initially
  readonly touched: readonly RefString[] // union of ws/touched (sorted, deduped)
  readonly written: readonly RefString[] // subset with op 'write'
  readonly eventsThisTurn: readonly LogKind[]
  readonly eventsThisSession: readonly LogKind[]
  readonly sessions: { readonly [key: string]: SessionStatus }
  /** session/requested entries whose key has no session/unmounted yet (D-047). */
  readonly requestedSessions: readonly { readonly key: SessionKey; readonly spec: Json }[]
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 10. Proposals  (SPEC §8.4)                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export type Change =
  | { readonly kind: 'content-patch'; readonly unifiedDiff: string } // data files under content/
  | { readonly kind: 'code-patch'; readonly unifiedDiff: string } // component source; requires tests to pass
  | { readonly kind: 'workspace-patch'; readonly workspace: string; readonly unifiedDiff: string }
  | { readonly kind: 'mark-unverifiable'; readonly node: GlobalNodeId; readonly anchorIndex: number; readonly reason: string }
  | { readonly kind: 'lift-drift'; readonly host: HostId; readonly target: string; readonly observed: Digest; readonly unifiedDiff: string }

export interface Proposal {
  readonly id: string // ULID
  readonly by: PrincipalId
  readonly against: { readonly package: string; readonly digest: Digest }
  readonly basis:
    | { readonly kind: 'anchor'; readonly result: AnchorResult }
    | { readonly kind: 'drift'; readonly host: HostId; readonly target: string }
    | { readonly kind: 'log-pattern'; readonly run: RunId; readonly seqFrom: number; readonly seqTo: number; readonly pattern: string }
    | { readonly kind: 'trial'; readonly trials: readonly string[] }
    | { readonly kind: 'manual' }
  readonly changes: readonly Change[]
  readonly rationale: string
  readonly risk: 'low' | 'medium' | 'high'
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 11. Packages, lock, runs  (SPEC §12)                                       */
/* ────────────────────────────────────────────────────────────────────────── */

/** `reins.json` at the package root. */
export interface PackageManifest {
  readonly name: string // npm-style, e.g. @me/swe
  readonly version: string // semver
  readonly entry: string // module path whose default export accepts Json props (D-045)
  /** Globs (relative) of files that affect rendering besides `entry` imports. Default ["content/**"]. */
  readonly content?: readonly string[]
  readonly dependencies?: { readonly [name: string]: string /* RefString with semver/tag/digest pin */ }
  readonly requires?: {
    readonly hosts?: readonly HostKind[]
    readonly dsh?: string // semver range
    readonly reins?: string // semver range
  }
  /** Upper bound of caps this harness will ever request for its root principal. */
  readonly caps?: CapSet
  /** The only child harnesses an agent may spawn via `session_spawn` (D-041). `export` names a Component exported by `entry`. */
  readonly sessionProfiles?: {
    readonly [name: string]: {
      readonly export: string
      readonly runtimes: readonly RuntimeSpec['kind'][]
      readonly caps: CapSet
    }
  }
}

/** `reins.lock` — JSON, keys sorted. */
export interface Lockfile {
  readonly lockVersion: 1
  readonly packages: {
    readonly [name: string]: { readonly version: string; readonly digest: Digest; readonly source: RefString }
  }
  readonly dsh?: { readonly version: string; readonly patches: Digest | null }
  readonly mise?: { readonly lock: Digest }
  readonly hosts: { readonly [kind: string]: string /* HostId */ }
}

export interface ModelSpec {
  readonly provider: string
  readonly model: string
  readonly params?: Json
}

/** Everything needed to reproduce a run (I-RUN-1). */
export interface RunSpec {
  readonly harness: { readonly name: string; readonly digest: Digest }
  readonly lock: Digest
  readonly namespace: Namespace
  readonly principal: Principal
  readonly hosts: readonly HostId[]
  readonly model?: ModelSpec
  readonly task?: TaskSpec
  readonly taskset?: { readonly ref: RefString; readonly taskId: string; readonly split: SplitRole }
  readonly seed?: number
  /** Set for a mounted child session's Run (D-036). */
  readonly parent?: { readonly run: RunId; readonly session: SessionKey }
  /** Set when the Run continues a forked DSH session (D-036). */
  readonly forkedFrom?: { readonly run: RunId; readonly seq: number }
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 12. Evaluation and evolution  (SPEC §13)                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export type SplitRole = 'propose' | 'select' | 'final'

export interface Taskset {
  readonly id: string
  readonly tasks: readonly (TaskSpec & { readonly id: string; readonly workspace: RefString })[]
  readonly splits: { readonly [R in SplitRole]: readonly string[] } // disjoint task id sets
}

export interface Trial {
  readonly id: string
  readonly run: RunId
  readonly spec: RunSpec
  readonly passed: boolean
  readonly scores: { readonly [metric: string]: number }
  readonly cost: Budget
}

export interface Candidate {
  readonly id: string
  readonly parent: Digest // harness digest it was derived from
  readonly proposal: Proposal
  readonly digest: Digest // resulting harness digest
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 13. Errors                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export type ReinsErrorCode =
  | 'REF_INVALID'
  | 'REF_UNRESOLVED'
  | 'REF_UNPINNED' // unpinned ref reached resolution without a Lock entry
  | 'ID_MISSING' // element kind requires id
  | 'ID_DUPLICATE'
  | 'ELAB_HOOK_OUTSIDE_RENDER'
  | 'ELAB_IMPURE' // a static purity-lint violation or double-elaboration nondeterminism (D-023)
  | 'ELAB_CYCLE'
  | 'UNSUPPORTED_NODE' // onUnsupported 'error'
  | 'ENFORCEMENT_UNAVAILABLE' // enforced rule with no guard realization and no downgrade allowed
  | 'TARGET_OCCUPIED' // host target exists and is not owned by Reins
  | 'DRIFT' // commit refused because of drift
  | 'CAP_DENIED'
  | 'CAP_WIDENING' // requested caps exceed parent
  | 'BUDGET_EXCEEDED'
  | 'DEPTH_EXCEEDED'
  | 'LOG_CORRUPT'
  | 'SPLIT_LEAK' // final split accessed by a selecting principal
  | 'LOCKED' // could not acquire the per-workspace commit lock within 30 s (D-037)
  | 'TARGET_CONFLICT' // two selected hosts plan the same target (D-064)
  | 'DIRTY_PACKAGE' // proposal apply on a git package with uncommitted changes (D-050)
  | 'KEY_REUSED' // a session key that was already unmounted in this Run was requested again (D-047)
  | 'INTERNAL'

export interface ReinsErrorData {
  readonly code: ReinsErrorCode
  readonly message: string
  readonly node?: GlobalNodeId
  readonly detail?: Json
}

/* ────────────────────────────────────────────────────────────────────────── */
/* 14. Kernel API surface (packages/core)                                     */
/* ────────────────────────────────────────────────────────────────────────── */

/** Runtime-only. A package fully loaded into memory (modules evaluated, content read). */
export interface LoadedPackage {
  readonly manifest: PackageManifest
  readonly digest: Digest
  /** Default export of `entry`. Cross-package props are JSON (D-045). */
  readonly entry: (props: Json) => ReinsNode
  /** Named exports of `entry` that are components (used by sessionProfiles, D-041). */
  readonly exports: { readonly [name: string]: (props: Json) => ReinsNode }
  /** Package-relative POSIX path → UTF-8 text, for every file matched by manifest.content. */
  readonly files: { readonly [path: string]: string }
}

/** Runtime-only. */
export interface ElaborateInput {
  readonly root: LoadedPackage
  /** Every package reachable through `use()`, keyed by package name, exactly as pinned by the lock. */
  readonly deps: { readonly [name: string]: LoadedPackage }
  readonly lock: Lockfile
  readonly lockDigest: Digest
  readonly namespace: Namespace
  readonly log: readonly LogEvent[]
  /** Events with seq ≤ logSeq are visible to hooks; -1 = static projection (empty log). */
  readonly logSeq: number
  /** Already-fetched external content (non-`harness://self` refs). Grows across suspensions. */
  readonly external: { readonly [ref: string]: string }
}

/**
 * Elaboration is synchronous and pure. When a hook needs content not present in
 * `input.external`, elaboration finishes the pass and returns `suspended` with every
 * missing ref; the driver fetches them and calls `elaborate` again (Suspense-style).
 */
export type ElaborateResult =
  | { readonly kind: 'done'; readonly tree: ETree }
  | { readonly kind: 'suspended'; readonly needs: readonly RefString[] }

/** Runtime-only. Signatures packages/core MUST export with exactly these names. */
export interface KernelApi {
  parseRef(s: string): Ref // throws REF_INVALID
  formatRef(r: Ref): RefString
  matchRef(p: RefPattern, r: Ref): boolean
  canonicalJson(v: Json): string // RFC 8785
  digestJson(v: Json): Digest
  digestBytes(b: Uint8Array | string): Digest
  elaborate(input: ElaborateInput): ElaborateResult
  /** Built-in component: mounts a dependency package's entry; nodes inside are attributed to it. Props cross a package boundary, so they are JSON. */
  use(pkg: string, props?: Json): ComponentCall
  /** Hyperscript, equivalent to JSX (D-003). Children given as rest args are appended to props.children. */
  h<K extends IntrinsicKind>(type: K, props: IntrinsicProps<K>, ...children: ReinsNode[]): Element
  h<P>(type: Component<P>, props: P): ComponentCall
  /** Fragment component for `<>…</>`. */
  Fragment(props: { readonly children?: ReinsNode }): ReinsNode
  /** Default strict=false silently narrows; strict=true throws CAP_WIDENING if anything was narrowed (D-022). Session mount always uses strict=true. */
  attenuate(parent: CapSet, requested: CapSet, opts?: { readonly strict?: boolean }): CapSet
  permits(caps: CapSet, right: Right, on: Ref): boolean
  evaluatePredicate(p: Predicate, s: TaskState): boolean
  project<T>(p: Projection<T>, log: readonly LogEvent[], uptoSeq: number): T
}

/** Hooks — valid only during elaboration (else ELAB_HOOK_OUTSIDE_RENDER). */
export interface Hooks {
  useLog<T>(p: Projection<T>): T
  useTaskState(): TaskState
  /** `harness://self/...` reads the current package's files; other refs may suspend. */
  useContent(ref: RefString): string
  /** Parse a content file of the current package (YAML frontmatter + Markdown body) into an Element (SPEC §5.11). */
  useFile(path: string): Element
  useNamespace(): Namespace
}
