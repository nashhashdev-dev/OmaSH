"""Check the supplied batch-4 contract and the previous finding resolutions.

These checks locate reviewed normative obligations; they do not claim the
future implementation's runtime acceptance tests have already passed.
"""
from pathlib import Path
import hashlib,json,re

S=Path(__file__).resolve().parent.parent
sources={p.name:p.read_text() for p in S.glob('*.md')}
CANONICAL_SOURCE_HASHES = {'types.ts': 'f6094706ab2681049e64bd7170898445bbed1cef4845fda28f89976173320754', 'DECISIONS-batch-4.md': 'fe6e61d66b443c74bd48e7daf118c608477a20f5444de88f78b5cd16176029c8'}
for name,expected in CANONICAL_SOURCE_HASHES.items():
    assert hashlib.sha256((S/name).read_bytes()).hexdigest()==expected
ids=set(re.findall(r'^\| (D-\d{3}) \|',sources['DECISIONS.md'],re.M))
assert all(f'D-{n:03}' in ids for n in range(1,93))
for n in [52,54,56]:
    assert re.search(rf'^\| D-{n:03} \|.*Reserved; do not use or reuse',sources['DECISIONS.md'],re.M)
assert len(re.findall(r'^\| I-[A-Z]+-\d+ \|',sources['INVARIANTS.md'],re.M))==45
inventory=json.loads((S/'audit/id-inventory.json').read_text())
for name in ['invariant','decision','open_question','error','event','package','cli']:
    assert not inventory[name]['undefined'],name
coverage=json.loads((S/'audit/must-coverage.json').read_text())
assert not any(item['status'] in {'GAP','PARTIAL'} for item in coverage)
resolutions=[
(1,69,'DECISIONS.md','Reserved; do not use or reuse.'),
(2,70,'SPEC.md','CommitReceipt distinguishes kind:static'),
(3,71,'SPEC.md','observed:null'),
(4,73,'SPEC.md','A workspace resolve returns its fixed Mount.base'),
(5,72,'SPEC.md','PlanContext.hostConfig is required'),
(6,87,'SPEC.md','onUnsupported="downgrade"'),
(7,75,'INVARIANTS.md','(package, session-portal domain)'),
(8,78,'SPEC.md','Every ENode has deps'),
(9,74,'INVARIANTS.md','only with the correlated session/op-result'),
(10,88,'AGENT_BRIEF.md','ETree goldens save only {package:{name},root}'),
(11,89,'INVARIANTS.md','Compare only equal TrialKeys'),
(12,76,'SPEC.md','move touchedThisTurn to touchedPrevTurn'),
(13,77,'SPEC.md','ENode.effective.onUnsupported is optional'),
(14,82,'SPEC.md','runtimes:{kind:RuntimeSpec}, defaultRuntime'),
(15,79,'INVARIANTS.md','Declared env credential refs require effective read grants'),
(16,80,'SPEC.md','Command checks default to timeoutMs:600000'),
(17,81,'SPEC.md','Only scope and session accept children'),
(18,91,'MILESTONES.md','I-HOST-6/7 pass atomic-failure/concurrent-lock tests'),
(19,84,'SPEC.md','before evaluating any harness module'),
(20,86,'SPEC.md','Only matching, lossless imports may be adopted'),
(21,85,'SPEC.md','All structured digest formulas use digestJson(toJson(value))'),
(22,90,'SPEC.md','Workspace snapshots exclude exactly .git/')]
for n,decision,file,text in resolutions:
    assert text in sources[file],(n,file,text)
assert len(resolutions)==22
json_out=[{'audit':f'A-{n:03}','decision':f'D-{decision:03}','status':'RESOLVED',
           'location':file,'evidence':text,'scope':'approved specification contract; runtime tests remain milestone work'}
          for n,decision,file,text in resolutions]
(S/'audit/batch4-resolutions.json').write_text(json.dumps(json_out,indent=2)+'\n')
print('Canonical batch-4 types and decision source exact; all 22 finding resolutions verified; all ID references defined; no MUST GAP/PARTIAL groups.')
