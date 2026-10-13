# Changelog

## Unreleased

- Reflected specification decisions D-069 through D-092 and resolved all 22 findings from the batch-3 audit.
- Recorded M0 as BLOCKED on `spike/m0`: native CLI startup, Unix socket, and dependency-download restrictions prevent complete runtime verification.
- Passed real DSH scope/order/disposal, async assembly, restriction/guard, and product-provider capability probes; selected the existing structured session fallback.
- Added fixed tool versions, a generated mise tool-version lock, scoped probe helpers, integrity receipts, and explicit incomplete-evidence checks. M1 remains gated.
