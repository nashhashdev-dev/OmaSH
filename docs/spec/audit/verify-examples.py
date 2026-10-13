"""Validate non-TypeScript examples and build the complete example manifest."""
import json
import tomllib
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parent
blocks = json.loads((ROOT / 'code-examples.json').read_text())
assert len(blocks) == 7
checks = [
 ('SPEC.md', '5.7 relay template', 'spec-contracts.tsx', 'Typed ContextEl payload; template is prose, not TS.'),
 ('SPEC.md', '5.8 task template', 'spec-contracts.tsx', 'Typed TaskSpec exercises command/anchor/human criteria and deliverables/references. Rendering bytes remain implementation acceptance work.'),
 ('SPEC.md', '5.11 frontmatter', 'spec-contracts.tsx', 'Exact data transcribed as typed KnowledgeEl. YAML frontmatter parsed with PyYAML; runtime useFile validation remains M1.'),
 ('SPEC.md', '6.1 TSX', 'spec-fenced.tsx', 'Exact fenced TSX body; only its lastFailure helper is supplied as surrounding context.'),
 ('SPEC.md', '7.2 pseudocode', 'host-reconcile-example.tsx', 'Typed ownership/drift/write/delete/commit flow; deletion exposes the nullable observed-digest conflict.'),
 ('DSH_INTEGRATION.md', '1 architecture', None, 'Non-executable architecture text; no TypeScript meaning.'),
 ('DSH_INTEGRATION.md', '7 mise TOML', None, 'Parsed with Python tomllib; tool versions marked for M0 are placeholders, not verified runtime pins.'),
]
manifest = []
for block, (file, section, target, note) in zip(blocks, checks):
    assert block['file'] == file
    item = {key: block[key] for key in ['file', 'start', 'end', 'language']}
    item.update(section=section, check=target, review=note)
    if block['language'] == 'markdown':
        frontmatter = block['body'].split('---')[1]
        data = yaml.safe_load(frontmatter)
        assert data['kind'] == 'knowledge' and data['id'] == 'auth.session-store'
        assert data['anchors'][0]['pattern'] == 'workspace://app/src/auth/session-store.ts'
        item['syntax'] = 'PASS'
    if block['language'] == 'toml':
        parsed = tomllib.loads(block['body'])
        assert set(parsed['tasks']) == {'build','test','invariants','contracts','dsh:candidate','lint'}
        item['syntax'] = 'PASS'
    manifest.append(item)
inline = [
 ('SPEC.md', '4.2/6.2/12.1 digest formulas', 'digest-examples.tsx', 'Literal typed digest inputs; structured interfaces expose the Json boundary mismatch.'),
 ('SPEC.md', '4.1 references; 5 element props; 6 hooks; 9 strict attenuation; 10 event payloads; 11 profiles', 'spec-contracts.tsx / spec-examples.tsx', 'Typed literals and kernel calls; prose formulas are represented without executing effects.'),
 ('DSH_INTEGRATION.md', '2 settings / 4 event map / 8 upstream pin', 'dsh-examples.tsx', 'Typed configuration literals and event-map extension.'),
 ('DSH_INTEGRATION.md', '3 section/context/restrict/guard/register', 'dsh-examples.tsx', 'Exact inline registrations with a typed local memo view. DSH signatures are stubs for the documented seam; installed upstream behavior remains M0.'),
 ('DSH_INTEGRATION.md', '3 dynamic observe/commit', 'dsh-examples.tsx', 'D-062 no-record receipt conflicts with the mandatory CommitReceipt.record.'),
 ('SPEC.md / DSH_INTEGRATION.md', 'Shell commands, paths, table syntax and output templates', None, 'Commands are inventoried, not run as TypeScript. Running real runtimes belongs to gated M0.'),
]
manifest += [dict(file=file, section=section, check=check, review=note, kind='inline/prose') for file,section,check,note in inline]
(ROOT / 'example-coverage.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('All 7 fences classified; TOML/YAML PASS; executable and typed-data inline examples mapped.')
