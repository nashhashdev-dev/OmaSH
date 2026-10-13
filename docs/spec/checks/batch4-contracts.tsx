import { api } from '@reins/core'
import type { CommitReceipt, ENode, HostConfig, LogEventMap, MountRequest, PlanContext, SessionResult } from '@reins/core'

declare const node: ENode
const unavailable = node.deps.filter(dep => dep.status === 'unavailable').map(dep => dep.ref)
const hostConfig: HostConfig = { id: 'codex@1.0.0', settings: {} }
declare const taskState: PlanContext['taskState']
const context: PlanContext = { hostConfig, taskState, workspaceAuthority: 'app' }
const configDigest = api.digestJson(api.toJson(context.hostConfig))
const intent: LogEventMap['session/intent'] = { key: 'worker', opId: '01JEXAMPLE', op: { op: 'send', text: 'task' } }
const payload: LogEventMap['session/sent'] = { key: intent.key, opId: intent.opId, text: 'task' }
const outcome: LogEventMap['session/op-result'] = { key: intent.key, opId: intent.opId, outcome: 'unknown' }
const human: LogEventMap['check/decided'] = { session: 'worker', index: 0, passed: true, by: 'human:test' }
const pending: SessionResult = { status: 'completed', output: '', artifacts: [], accepted: null,
  checks: [{ check: { kind: 'human', question: 'Accept?' }, status: 'pending', evidence: '' }] }
const timedOut: SessionResult = { status: 'completed', output: '', artifacts: [], accepted: false,
  checks: [{ check: { kind: 'command', argv: ['test'], cwd: 'workspace://app', expectExit: 0, timeoutMs: 1 }, status: 'timeout', evidence: 'deadline' }] }
declare const mount: MountRequest
const envRefs: MountRequest['env'] = { PROVIDER_KEY: 'secret://env/PROVIDER_KEY' }
const secretRead = api.permits(mount.caps, 'read', api.parseRef(envRefs.PROVIDER_KEY ?? 'secret://env/PROVIDER_KEY'))
function receiptIdentity(receipt: CommitReceipt): string {
  return receipt.kind === 'static' ? receipt.record.plan : receipt.plan
}
void unavailable; void configDigest; void payload; void outcome; void human; void pending; void timedOut;
void secretRead; void receiptIdentity

// New SPEC 4.2 / 7.1 / 13 digest formulas use the same validated boundary.
import type { ETree, GlobalNodeId, Lockfile, RunSpec } from '@reins/core'
declare const tree: ETree
declare const lock: Lockfile
declare const run: RunSpec
const gitSnapshot = api.digestJson(api.toJson({ kind: 'git', head: 'example-commit',
  diff: api.digestBytes('binary diff'), untracked: { 'example.ts': api.digestBytes('source') } }))
const planDigest = api.digestJson(api.toJson({ host: hostConfig.id, hostConfig, tree: tree.digest, taskState, outputs: [] }))
const trialKey = api.digestJson(api.toJson({ taskId: run.taskset?.taskId,
  workspaceBases: run.namespace.mounts.filter(item => item.scheme === 'workspace').map(item => ({ authority: item.authority, base: item.base })),
  model: run.model, seed: run.seed, toolchain: { miseLock: lock.mise?.lock, dshVersion: lock.dsh?.version, patches: lock.dsh?.patches },
  principalCaps: run.principal.caps, hosts: run.hosts }))
const gid: GlobalNodeId = '@me/swe#@worker/knowledge.id'
void gitSnapshot; void planDigest; void trialKey; void gid
