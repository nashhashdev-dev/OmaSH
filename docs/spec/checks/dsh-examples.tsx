import type { CommitReceipt, LogEventMap, Observed, Output } from '@reins/core'

// Stub only the registration signatures stated in DSH_INTEGRATION 3.
// Real DSH API and lifecycle validation belongs to M0 and contract tests.
interface PromptRegistration {
  readonly name: string
  readonly order: number
  readonly text: string | ((ac: unknown) => string)
}
declare const ctx: {
  readonly systemPrompt: {
    section(spec: PromptRegistration): () => void
    context(spec: PromptRegistration): () => void
  }
  readonly tools: { restrict(): () => void; guard(): () => void; register(): () => void }
}
// Adapter-local view of the already completed, per-agent prompt output.
declare function completedPrompt(ac: unknown): Extract<Output, { readonly kind: 'prompt' }>
function plan(ac: unknown) {
  return {
    system(bucket: 'static' | 'session'): string {
      return completedPrompt(ac).system.find(part => part.volatility === bucket)?.text ?? ''
    },
  }
}
declare const text: string

// Exact inline registration example in DSH_INTEGRATION 3.
ctx.systemPrompt.section({ name: 'reins:static', order: 10, text: ac => plan(ac).system('static') })
ctx.systemPrompt.section({ name: 'reins:session', order: 20, text })
ctx.systemPrompt.context({ name: 'reins:turn', order: 10, text })
ctx.tools.restrict()
ctx.tools.guard()
ctx.tools.register()

// D-062 explicitly describes a dynamic host without a CommitRecord.
const observed: Observed = { host: 'dsh@1.0.0', targets: [] }
const dynamicReceipt: CommitReceipt = { kind: 'dynamic', plan: 'sha256:' + '0'.repeat(64), changed: false }

// DSH_INTEGRATION 4: augmentation and event payload examples.
declare module '../types.ts' {
  interface LogEventMap {
    'reins/test-failed': { readonly argv: readonly string[]; readonly exit: number; readonly excerpt: string }
  }
}
const failure: LogEventMap['reins/test-failed'] = { argv: ['pnpm', 'test'], exit: 1, excerpt: 'failed' }
const request: LogEventMap['model/request'] = {
  host: 'dsh@1.0.0', bytes: 'sha256:' + '0'.repeat(64),
  external: { system: 'dsh', session: 'example', seqFrom: 0, seqTo: 1 },
}

void observed; void dynamicReceipt; void failure; void request

// DSH_INTEGRATION 2 and 8: local configuration and upstream-pin examples.
interface PluginSettings {
  readonly harness: string
  readonly workspace: string
  readonly reinsHome?: string
  readonly testCommandPatterns?: readonly (readonly string[])[]
  readonly suspenseTimeoutMs?: number
}
const settings: PluginSettings = { harness: 'harness://@me/swe@^2', workspace: './fixtures/ws-ts', suspenseTimeoutMs: 10000 }
const upstream: { readonly package: '@deepseek-ai/dsh'; readonly version: string; readonly commit: string } = {
  package: '@deepseek-ai/dsh', version: 'x.y.z', commit: '<sha>',
}
void settings; void upstream
