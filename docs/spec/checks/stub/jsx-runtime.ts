import type * as T from '../../types.ts'
export declare function jsx(type: unknown, props: unknown, key?: string): T.Element | T.ComponentCall
export declare const jsxs: typeof jsx
export declare function Fragment(props: { readonly children?: T.ReinsNode }): T.ReinsNode
export namespace JSX {
  export type Element = T.JsxNamespaceShape['Element']
  export type ElementType = T.JsxNamespaceShape['ElementType']
  export type IntrinsicElements = T.JsxNamespaceShape['IntrinsicElements']
  export type ElementChildrenAttribute = T.JsxNamespaceShape['ElementChildrenAttribute']
}
