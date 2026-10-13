# Specification type checks

Run `tsc -p docs/spec/checks` with TypeScript 5.9.3. The project uses strict,
exactOptionalPropertyTypes, and noUncheckedIndexedAccess. The core stubs expose
the normative declarations; they do not implement the software.

- `spec-examples.tsx` and `negative.tsx`: the supplied batch-3 checks.
- `spec-fenced.tsx`: exact SPEC 6.1 TSX with its local helper supplied.
- `spec-contracts.tsx`: typed frontmatter, template inputs, refs, hooks, profiles,
  event payloads, and remaining inline kernel/resolver calls.
- `digest-examples.tsx`: literal namespace/tree/package digest formulas.
- `host-reconcile-example.tsx`: typed SPEC 7.2 pseudocode data flow and deleted-file drift.
- `dsh-examples.tsx`: documented registrations, local memo helper, config examples,
  event-map extension, and a dynamic no-record receipt.

The full check currently reports five diagnostics for three unresolved contract
issues, listed in `../audit/FULL_AUDIT.md` (A-002/A-003/A-021). Positive failing
cases have no ts-expect-error. The four intended negative examples retain their
expected diagnostics.

`tsc -p docs/spec/checks/tsconfig.baseline.json` checks only the exact supplied
suite. Its PASS is reported separately; it does not waive the full project's FAIL.

`../audit/example-coverage.json` maps every SPEC/DSH fence and the inline example
groups. Non-TypeScript text and shell examples are not executable TS. YAML/TOML
syntax is checked separately. DSH signatures here are documented seam stubs;
M0 and contract tests must verify the installed upstream APIs and lifecycle.
