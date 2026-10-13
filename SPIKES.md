# M0 runtime spikes

Status: **BLOCKED**. Core, host, and session implementation has not started. The user gate before M1 remains in force.

## Conclusions and acceptance

| Spike | Conclusion | Verified evidence | Remaining verification |
|---|---|---|---|
| S-1 | Partial | Real Codex attempts fail during config loading; the real OpenCode payload aborts at startup. | Root/nested instruction loading and file-touch behavior in Codex, OpenCode, and Pi. Pi was not launched. |
| S-2 | Partial / blocked | The verified Claude Code native payload aborts for both version and help. | Nested CLAUDE.md, rules frontmatter, skills, MCP, deny patterns, imports, and environment references. |
| S-3 | Partial / blocked | Codex reports 0.162.1; both isolated root/nested headless attempts stop before a provider request. | Hierarchy, skills, MCP references, and native guard/sandbox behavior. |
| S-4 | Partial / blocked | tmux reports 3.7c; its dedicated socket is denied. Python independently confirms AF_UNIX creation is denied. | Bracketed paste, Enter, and actual idle/working/approval screen fixtures. |
| S-5 | Partial | Real DSH services pass ordered scoped registration, shadowing/disposal, asynchronous assembly replacement, restriction/guard behavior, and the scope boundary observation. | Full profile/bundle installation, dump-config, changed-only logged snapshots, and disabling the existing instruction provider. |
| S-6 | Reject pinned DSH product providers | Both real providers register, declare agentOptions:false, and reject prepareContinuable with UNSUPPORTED_CAPABILITY before launch. Disposal unregisters them. | No live native child was launched; no child usage or live authentication claim is made. Reins uses the existing structured-adapter fallback. |

All six conclusions are recorded. All eight tools in mise.toml have exact versions and a generated mise.lock. Complete real-runtime verification is **not** satisfied, so M0 is not DONE. AGENT_BRIEF section 7 classifies technically unverifiable acceptance criteria as BLOCKED. No law, invariant, or exported type was changed or found to require a user decision.

## Versions and installation

| Tool | Pin | Executed here |
|---|---|---|
| Node | 22.23.3 | Version and service/fixture tests |
| pnpm | 10.34.7 | Version and dependency-install attempts |
| mise | 2026.10.8 | Link, lock, lint, and test tasks |
| tmux | 3.7c | Version and dedicated-socket attempt |
| DSH | 0.2.0-rc.2 | Actual published service and provider packages |
| Claude Code | 2.1.296 | Native version/help attempts, both abort |
| Codex | 0.162.1 | Version/help and headless configuration attempts |
| OpenCode | 1.19.0 | Native version/help attempts, both abort |
| Pi | 0.73.1 | Not launched; dependency installation interrupted |

Public archive integrity receipts are in spikes/m0/integrity.json. Downloads were checked against official SHA-256/SRI metadata; executable contents were checked after extraction. The first Node extraction was incomplete. Rewriting its exact verified contents restored normal startup; this is not recorded as a Node compatibility failure.

Native executables were fetched from official npm platform packages with install scripts disabled. The small DSH registry/service dependency closure was fetched with SRI checks and evaluated directly. The native Codex version probe is separate from the older 0.153.4 wrapper required by the DSH provider package; the provider test never launches that wrapper.

The full DSH/Pi/workspace dependency installation did not complete. Its final unauthenticated registry-relay attempt was interrupted by the execution environment with: `network approval was cancelled before a decision was returned`. This is an installation limitation, not evidence about Pi's instruction behavior. No complete pnpm dependency lock or successfully installed full DSH CLI is claimed.

mise's embedded aube failed to parse the DSH dependency graph. The documented pnpm installer setting generated the eight-tool version lock with mise itself. This npm lock pins tool versions; it does not contain transitive dependency graphs. The root workspace dependency lock remains pending. No dependency graph was hand-written. Linux x64 and macOS x64/arm64 artifact metadata was locked; macOS execution was not tested here.

The cached DSH publish metadata contains neither gitHead nor provenance tying this npm release to a source commit. upstream/dsh.json was not fabricated from the moving master HEAD. Its matching source-commit pin remains pending before upstream-update automation is introduced.

## Safety boundary and reproduction

Use real, pinned upstream runtimes, disposable homes, and dummy local-protocol credentials (D-093). Production keys were not supplied to runtime or install processes. The local transport fixture is not a fake CLI and does not prove live-provider authentication, billing, or server compatibility. UID switching and filesystem namespaces are unavailable here; a clean environment is not a filesystem security sandbox.

On a normal Linux/macOS host, install the pinned development toolchain and run `pnpm install --ignore-scripts`. Review native runtime installers before enabling any build script. Keep API keys out of this install environment. M0 helpers and tests are disposable, not the Reins implementation.

Commands already executed or to reproduce their narrowly scoped probes:

```sh
mise run lint
mise run test
node --test spikes/m0/dsh.test.mjs
python3 spikes/m0/probe.py --codex-bin /path/to/verified/codex --work-dir /path/to/disposable/m0 --output /path/to/disposable/codex-observations.json
mise lock --platform linux-x64,macos-arm64,macos-x64
```

The Codex helper clears inherited environment entries, creates an isolated fixture Git repository with empty templates and no personal/system configuration, starts an unauthenticated local Responses fixture, and uses an invented env credential. The server does not read authorization headers. Public observations retain only marker presence, coarse error categories, exit codes, and request counts. Runtime diagnostics remain outside Git.

## S-1 and S-3: generic instructions and Codex

The helper creates root and nested AGENTS.md markers plus .agents/skills/fixture-skill/SKILL.md. It starts the real CLI with --no-daemon, read-only sandbox, and a disposable home from both cwd values. Root/nested observations are in spikes/m0/codex-observations.json.

Observed excerpts:

```text
codex --version: codex-cli 0.162.1
root-cwd: exitCode=1, requestCount=0
nested-cwd: exitCode=1, requestCount=0
Error loading config.toml: no /proc/self/exe available. Is /proc mounted?
opencode --version: signal 6
opencode --help: signal 6
```

Zero visible markers after zero requests does not mean instructions were ignored. Configuration never loaded. Pi was not started after dependency installation was interrupted. No nested-loading, touch-loading, skill-directory, reference-expansion, or sandbox-enforcement fact is inferred from these failed startups.

Impact: SPEC section 7.5 retains its provisional targets with explicit M0 limitations. OQ-02 stays open. Official Codex documentation is corroborating material only:
- https://developers.openai.com/codex/guides/agents-md
- https://developers.openai.com/codex/config-reference

## S-2: Claude Code configuration

Procedure: verify the official Linux x64 package, execute native --version and --help with a disposable home and no real key, then continue configuration probes only if startup works.

Observed excerpt:

```text
claude --version: signal 6
claude --help: signal 6
panic(main thread): abort() called
```

The native Bun runtime aborts before configuration. No crash-report link or encoded crash payload is published. The requested nested files, imports, rules, skills, MCP, permission, and reference-expansion probes are not run. OQ-01 stays open; import-based deduplication remains conditional on successful runtime evidence.

Corroborating official documentation, without claiming an executed test: https://code.claude.com/docs/en/memory

## S-4: tmux interaction

Procedure: execute tmux -V; create a detached disposable session through an explicit dedicated socket; capture a pane only after creation succeeds.

Observed excerpts:

```text
tmux -V: tmux 3.7c
error connecting to <M0_TMP>/tmux.sock (Operation not permitted)
socket(AF_UNIX, SOCK_STREAM): errno 1
```

No pane exists, so paste/Enter and UI-state observations are not run. No fake screen fixture is substituted. OQ-09 remains open. On a host permitting AF_UNIX and PTYs, rerun both real TUIs and save sanitized idle, working, and approval-wait panes before implementing state detectors.

## S-5: DSH extension points

spikes/m0/dsh.test.mjs executes published 0.2.0-rc.2 services using the real Cordis context, injection grants, createScope, and effect disposal. The direct tool-registry probe uses an opaque scope identity; it is not a complete running Agent or agent-loop test.

Verified:
- Identity order is -1000 and Bash guidance starts at 1000; Reins 10/20 still fits between persona and tool guidance.
- Scoped same-name sections shadow globals; sibling scopes stay separate; disposing removes sections and contexts.
- An awaited scoped system-prompt/assemble waterfall replaces existing same-name sections/contexts in place. The test preserves unrelated sections/contexts, expanded variables, and tool schemas, and confirms sibling-scope isolation.
- Restrict removes a global tool from both schemas and dispatch in the selected scope. A sibling remains unaffected.
- A guard denies after a permissive pre-execute waterfall. The denied body never runs.
- Execution outside the selected scope succeeds, demonstrating that scope is not a security boundary; Reins must preserve its own capability checks.

Observed TAP excerpt:

```text
ok - S-5 real SystemPrompt orders, isolates, shadows, and disposes scoped sections
ok - S-5 real asynchronous assembly returns replacement sections and contexts in one scope
ok - S-5 real tool restrictions remove visibility and execution; guards cannot be overridden
```

Profile/bundle installation, CLI dump-config, logged context snapshot changes, and instruction-provider disablement are not proved by direct registry tests. Those probes remain blocked by the interrupted full dependency install. OQ-04 stays open.

Impact: DSH_INTEGRATION section 3 corrects observed ordering numbers. Its required async replacement is supported by the executed service probe, so no D-055 protected-contract issue was found. Section 7 matches the actual M0 toolchain. Source: https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/system-prompt.md

## S-6: product child providers

Procedure: register the real published SubagentRuntime/SubprocessRuntime and both product-provider plugins in Cordis. Inspect registered capabilities; request continuation; dispose and confirm deregistration. No native child is launched.

Observed excerpt:

```text
ok - S-6 real product providers register but reject continuable children before any launch
codex: agentOptions=false; prepareContinuable absent; UNSUPPORTED_CAPABILITY
claude-code: agentOptions=false; prepareContinuable absent; UNSUPPORTED_CAPABILITY
```

Published provider source also derives cwd from the parent Session and retains product usage outside the parent result. These are source observations, not live child tests. Unsupported continuation alone rejects the provider under the existing adoption conditions. D-097 resolves OQ-03 and selects the existing structured headless fallback; no public type or invariant changes.

Sources:
- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/core/subagent-codex
- https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/core/subagent-claude-code

## Validation and next gate

The evidence-completeness test was written before probes and initially failed with ENOENT. It now checks that incomplete verification cannot be represented as DONE. The four real DSH service/provider tests are executed, not replaced by evidence-file assertions. Both specification type-check commands remain required and passed at this checkpoint.

Next environment requirement: use ordinary Linux/macOS with /proc available on Linux, AF_UNIX/PTY support, working native Bun CLIs, and permitted public package downloads. Then finish the remaining real probes and their evidence. If that environment cannot be provided, explicitly revise M0's acceptance scope with the user; do not silently skip it. Stop before M1.
