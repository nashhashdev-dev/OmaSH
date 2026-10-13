# M0 runtime spikes

Status: in progress. No core, host, or session implementation has started.

## Method and safety boundary

Run real, pinned upstream runtimes with lifecycle scripts disabled, disposable homes, and a deterministic local protocol fixture. Fixture credentials are invented; no production key is supplied. Fixture observations do not establish live-provider authentication, billing, or server compatibility. UID changes and filesystem namespaces are unavailable in this execution environment (D-093).

Official downloaded archives are integrity-checked. After extraction, executable sizes and contents must also be checked: the first Node extraction was incomplete, and the corrected binary reports `v22.23.3`. tmux reports `tmux 3.7c`.

The six spikes are S-1 (generic instructions), S-2 (Claude configuration), S-3 (Codex configuration), S-4 (tmux UI states), S-5 (DSH extension APIs), and S-6 (DSH child providers). Conclusions and limitations will be recorded after the probes finish. No incomplete probe is reported as passing.

## Acceptance before implementation

The evidence-completeness test is written first. It fails while `spikes/m0/evidence.json` is absent; this is an expected initial failure, not a waived acceptance criterion.
