import type { CommitRecord, Digest, LogEventMap, Observed, Principal, RenderPlan, RuntimeHost } from '@reins/core'

// Typed data flow for SPEC 7.2's language-neutral pseudocode. Helpers below
// represent driver I/O and lookup seams; no effects execute in this type check.
declare const host: RuntimeHost
declare const actor: Principal
declare const planned: RenderPlan
declare const last: CommitRecord | null
declare function recordIntent(data: LogEventMap['render/intent']): void
declare function digestFile(bytes: string): Digest

type TargetDecision =
  | { readonly kind: 'fail'; readonly code: 'TARGET_OCCUPIED' }
  | { readonly kind: 'skip-drift'; readonly expected: Digest; readonly observed: Digest | null }
  | { readonly kind: 'write'; readonly bytes: string }
  | { readonly kind: 'remove' }
  | { readonly kind: 'forget' }
  | { readonly kind: 'unchanged' }

function decision(target: string, plan: RenderPlan, observed: Observed, previous: CommitRecord | null): TargetDecision {
  const existing = observed.targets.find(item => item.target === target)?.digest ?? null
  const owned = previous?.targets.find(item => item.target === target)
  const desired = plan.outputs.find(output => output.kind === 'file' && output.target === target)
  if (owned && existing === null && !desired) return { kind: 'forget' }
  if (!owned && existing !== null) return { kind: 'fail', code: 'TARGET_OCCUPIED' }
  if (owned && existing !== owned.digest) return { kind: 'skip-drift', expected: owned.digest, observed: existing }
  if (desired?.kind === 'file') {
    return digestFile(desired.bytes) !== existing ? { kind: 'write', bytes: desired.bytes } : { kind: 'unchanged' }
  }
  if (owned) return { kind: 'remove' }
  return { kind: 'unchanged' }
}

async function checkReconcileFlow() {
  recordIntent({ host: host.id, plan: planned.digest })
  const observed = await host.observe(planned)
  const targets = new Set([
    ...planned.outputs.flatMap(output => output.kind === 'file' ? [output.target] : []),
    ...(last?.targets.map(item => item.target) ?? []),
  ])
  for (const target of targets) decision(target, planned, observed, last)
  const receipt = await host.commit(planned, observed, last, actor)
  if (receipt.kind !== 'static') throw new Error('Expected a static receipt in the file-host example')
  const record: CommitRecord = receipt.record
  return record
}
void checkReconcileFlow

// Deletion of a previously owned file is drift under SPEC 7.2 / I-HOST-2.
// Both observation and drift events preserve absence as null (D-071).
const deletedDrift: LogEventMap['drift/detected'] = {
  host: 'agents-md@1.0.0', target: 'AGENTS.md', expected: 'sha256:' + '0'.repeat(64), observed: null,
}
void deletedDrift
