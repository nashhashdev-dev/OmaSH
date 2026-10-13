import { use, useFile, useTaskState, h, api, type ReinsNode, type Projection, type TaskState, type LoadedPackage, type Element, type CapSet, type Json } from '@reins/core'

function lastFailure(ts: TaskState): string { return ts.phase }

export default function Root() {
  const ts = useTaskState()
  return (
    <>
      {useFile('content/overview.md')}
      <scope at="workspace://app/src/auth/**">
        {useFile('content/auth/session-store.md')}
        <rule id="no-raw-sql" enforcement="enforced" onUnsupported="downgrade"
              guard={{ kind: 'deny-command', argvPrefix: ['psql'] }}
              body={{ format: 'md', text: 'DB へは ORM 経由でのみ。' }} />
      </scope>
      <scope when={{ op: 'event', kind: 'reins/test-failed', within: 'turn' }}>
        <context id="last-failure" body={{ format: 'md', text: lastFailure(ts) }} priority={90} />
      </scope>
      {use('@acme/verify', { strict: true })}
      <Child label="x" />
      <session key="worker" runtime={{ kind: 'codex' }} workspace={{ from: 'workspace://app', mode: 'fork-worktree', as: 'app' }}
               caps={{ grants: [{ on: 'workspace://app/**', rights: ['read', 'write'] }], budget: { maxDepth: 0 } }}>
        <instruction body={{ format: 'md', text: 'child rule' }} />
        child plain text
      </session>
      plain string instruction
    </>
  )
}

function Child(props: { label: string }) { return props.label === 'x' ? 'yes' : null }

// h() equivalence
const a: ReinsNode = h('knowledge', { id: 'k', claim: 'fact', body: { format: 'md', text: 't' } })
const b: ReinsNode = h(Child, { label: 'x' })
const c: ReinsNode = api.use('@acme/verify', { strict: true })
const d: ReinsNode = h('scope', { at: 'workspace://app/**' }, a, b, c, 'text', null)
// projection of TaskState
declare const tsProj: Projection<TaskState>
const s: TaskState = api.project(tsProj, [], -1)
// entry from a no-prop component
declare const files: { [p: string]: string }
declare const m: LoadedPackage['manifest']
const pkg: LoadedPackage = { manifest: m, digest: 'sha256:00', entry: Root, exports: { Child: (p: Json) => null }, files }
// frontmatter-style literal element
const fm: Element = { kind: 'knowledge', id: 'auth.store', claim: 'fact', body: { format: 'md', text: 'x' },
  anchors: [{ kind: 'path', pattern: 'workspace://app/src/auth/store.ts', expect: 'exists' }] }
// attenuate strict
declare const p: CapSet
const att: CapSet = api.attenuate(p, p, { strict: true })
void d; void s; void pkg; void fm; void att

// ── batch 4 probes ─────────────────────────────────────────────
import type { CommitReceipt, LogEventMap, Mount, ENode, PackageManifest, Digest, SessionResult, HostConfig } from '@reins/core'
declare const mounts: readonly Mount[]
declare const enode: ENode
declare const manifest: PackageManifest
const d1: Digest = api.digestJson(api.toJson({ mounts, parent: null }))
const d2: Digest = api.digestJson(api.toJson(enode))
const d3: Digest = api.digestJson(api.toJson(manifest))
const dyn: CommitReceipt = { kind: 'dynamic', plan: d1, changed: false }
const del: LogEventMap['drift/detected'] = { host: 'claude-code@0.1.0', target: 'CLAUDE.md', expected: d2, observed: null }
const res: SessionResult = { status: 'completed', output: '', checks: [{ check: { kind: 'human', question: 'Accept?' }, status: 'pending', evidence: '' }], accepted: null, artifacts: [] }
const hc: HostConfig = { id: 'codex@0.1.0', settings: { instructions: 'via-agents-md' } }
const profiles: PackageManifest['sessionProfiles'] = {
  reviewer: { export: 'Reviewer', runtimes: { codex: { kind: 'codex', tool: 'npm:@openai/codex@0.50.0' } }, defaultRuntime: 'codex',
    caps: { grants: [], budget: {} }, env: { GITHUB_TOKEN: 'secret://env/GITHUB_TOKEN' } } }
const hello = <rule id="no-raw-sql" enforcement="enforced" onUnsupported="downgrade"
  guard={{ kind: 'deny-command', argvPrefix: ['psql'] }} body={{ format: 'md', text: 'x' }} />
void d3; void dyn; void del; void res; void hc; void profiles; void hello
