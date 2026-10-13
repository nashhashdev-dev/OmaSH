# Specification type checks

Run `tsc -p docs/spec/checks` with TypeScript 5.9.3. Strict,
exactOptionalPropertyTypes, and noUncheckedIndexedAccess are enabled.
The stubs expose normative declarations; they do not implement Reins.

The complete project passes after batch 4. Previous positive failures are now
valid calls through toJson, a discriminated CommitReceipt, and nullable deleted
file observations. Six intended negative examples verify missing fields,
invalid kinds/claims, and forbidden leaf children; no positive test is suppressed.

- `spec-examples.tsx` / `negative.tsx`: merged supplied batch checks.
- `spec-fenced.tsx`: exact SPEC 6.1 TSX with its local helper supplied.
- `spec-contracts.tsx`: typed template/frontmatter inputs, hooks, profiles and events.
- `digest-examples.tsx`: namespace/tree/package digest formulas through toJson.
- `host-reconcile-example.tsx`: static receipts and deleted/removed target handling.
- `dsh-examples.tsx`: documented seam registrations, memo helper and dynamic receipt.
- `batch4-contracts.tsx`: deps, HostConfig, opId/outcomes, pending/timeout checks,
  credential refs, snapshot/plan/trial formulas, and portal-domain GIDs.

`tsconfig.baseline.json` selects the supplied baseline separately; it does not
replace the complete check. `../audit/example-coverage.json` maps all SPEC/DSH
fences and inline groups. Text/shell examples are not executable TypeScript;
YAML/TOML syntax is checked separately. DSH signatures are documented seam
stubs; M0 and contract tests verify the installed upstream APIs and lifecycle.
