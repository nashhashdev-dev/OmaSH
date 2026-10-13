import type * as T from '../../types.ts'
export * from '../../types.ts'
export declare const api: T.KernelApi
export declare const hooks: T.Hooks
export declare function useTaskState(): T.TaskState
export declare function useFile(path: string): T.Element
export declare function use(pkg: string, props?: T.Json): T.ComponentCall
export declare const h: T.KernelApi['h']
