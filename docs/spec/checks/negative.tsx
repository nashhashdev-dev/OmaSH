import { h } from '@reins/core'
// @ts-expect-error knowledge requires id
export const x1 = <knowledge claim="fact" body={{ format: 'md', text: 't' }} />
// @ts-expect-error bad claim
export const x2 = <knowledge id="a" claim="rumor" body={{ format: 'md', text: 't' }} />
// @ts-expect-error unknown intrinsic
export const x3 = <widget />
// @ts-expect-error rule needs enforcement
export const x4 = h('rule', { id: 'r', body: { format: 'md', text: 't' } })
