import { api } from '@reins/core'
import type { ETree, Namespace, PackageManifest } from '@reins/core'

// Literal typed translations of the canonical digest formulas in SPEC.
declare const ns: Namespace
declare const tree: ETree
declare const manifest: PackageManifest
declare const files: { readonly [path: string]: string }

// SPEC 4.2: namespace ID.
api.digestJson(api.toJson({ mounts: ns.mounts, ...(ns.parent ? { parent: ns.parent } : {}) }))
// SPEC 6.2 step 5: ETree digest, with logSeq excluded.
api.digestJson(api.toJson({ package: tree.package, lock: tree.lock, namespace: tree.namespace, external: tree.external, root: tree.root }))
// SPEC 12.1: package digest. Files are already byte-digested in this fixture.
api.digestJson(api.toJson({ manifest, files }))
