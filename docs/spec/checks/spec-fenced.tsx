// examples/hello/src/index.tsx
import { h, use, useFile, useTaskState } from '@reins/core'

export default function Root() {
  const ts = useTaskState()
  return (
    <>
      {useFile('content/overview.md')}
      <scope at="workspace://app/src/auth/**">
        {useFile('content/auth/session-store.md')}
        <rule id="no-raw-sql" enforcement="enforced"
              guard={{ kind: 'deny-command', argvPrefix: ['psql'] }}
              body={{ format: 'md', text: 'DB へは ORM 経由でのみアクセスする。' }} />
      </scope>
      <scope when={{ op: 'event', kind: 'reins/test-failed', within: 'turn' }}>
        <context id="last-failure" body={{ format: 'md', text: lastFailure(ts) }} priority={90} />
      </scope>
      {use('@acme/verify', { strict: true })}
    </>
  )
}

declare function lastFailure(state: import("@reins/core").TaskState): string
