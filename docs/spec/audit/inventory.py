"""Rebuild lexical audit inventories; classifications require human review.

Run from any directory with Python 3: python docs/spec/audit/inventory.py.
Only the specification's named source files are read. Generated audit reports
are excluded to avoid turning the audit's own quotations into normative references.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

SPEC = Path(__file__).resolve().parent.parent
OUT = SPEC / 'audit'
CANONICAL = ['AGENT_BRIEF.md', 'SPEC.md', 'DSH_INTEGRATION.md', 'INVARIANTS.md',
             'MILESTONES.md', 'DECISIONS.md', 'README.md', 'types.ts']
HISTORICAL = ['DECISIONS-batch-2.md', 'DECISIONS-batch-3.md']
sources = {name: (SPEC / name).read_text() for name in CANONICAL + HISTORICAL}

def emit(name: str, value):
    (OUT / name).write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n')

def ids(line: str, category: str):
    pattern = {'invariant': r'\bI-[A-Z]+-\d+\b', 'decision': r'\bD-\d{3}\b',
               'open_question': r'\bOQ-\d{2}\b'}[category]
    found = set(re.findall(pattern, line))
    for match in re.finditer(r'\b(I-[A-Z]+-|D-|OQ-)(\d+)(?:〜|–|—|~)(?:(I-[A-Z]+-|D-|OQ-))?(\d+)\b', line):
        prefix, first, other, last = match.groups()
        if other and prefix != other:
            continue
        width = len(first)
        found.update(prefix + str(n).zfill(width) for n in range(int(first), int(last)+1))
    for match in re.finditer(r'\b(I-[A-Z]+-|D-|OQ-)(\d+)((?:[・/]\d+)+)\b', line):
        prefix, first, tail = match.groups()
        found.update(prefix + number.zfill(len(first)) for number in re.split(r'[・/]', tail)[1:])
    return {identifier for identifier in found if re.fullmatch(pattern, identifier)}

defs = {
    'invariant': sorted(set(re.findall(r'^\| (I-[A-Z]+-\d+) \|', sources['INVARIANTS.md'], re.M))),
    'decision': sorted(set(re.findall(r'^\| (D-\d+) \|', sources['DECISIONS.md'], re.M))),
    'open_question': sorted(set(re.findall(r'^\| (OQ-\d+) \|', sources['DECISIONS.md'], re.M))),
}
error_part = sources['types.ts'].split('export type ReinsErrorCode =', 1)[1].split('export interface ReinsErrorData', 1)[0]
defs['error'] = re.findall(r"\| '([A-Z_]+)'", error_part)
event_part = sources['types.ts'].split('export interface LogEventMap {', 1)[1].split('export type LogKind', 1)[0]
defs['event'] = re.findall(r"^  '([^']+)':", event_part, re.M) + ['reins/test-failed']
external_events = {'session/event', 'tool/result', 'agent/request', 'assistant/message',
                   'tools/pre-execute', 'system-prompt/assemble', 'system-prompt/change',
                   'subagent-report', 'subagent-settled', 'fs/*'}
non_events = {
    'content/auth': 'content file path', 'content/overview': 'content file path',
    'harness/blob': 'upstream URL path', 'harness/lock': 'two input values',
    'reins/task-compile': 'core function', 'reins/task-state': 'projection ID',
    'render/check': 'CLI invocation shorthand', 'tool/rule': 'element-kind shorthand',
    'turn/task': 'volatility/element shorthand',
}
for package in re.findall(r'@reins/[a-z-]+', sources['AGENT_BRIEF.md']):
    non_events[package[1:]] = 'npm package'
non_errors = {'AGENT_BRIEF', 'DSH_INTEGRATION', 'FAKE_TOKEN', 'REINS_DEV', 'REINS_HOME', 'UPDATE_GOLDEN'}
defs['package'] = sorted(set(re.findall(r'@reins/[a-z-]+|dsh-plugin-reins', sources['AGENT_BRIEF.md'])))
package_roles = {
    '@acme/verify': 'illustrative harness dependency', '@me/swe': 'illustrative harness package',
    '@deepseek-ai/dsh': 'external DSH tool', '@anthropic-ai/claude-code': 'external runtime tool',
    '@openai/codex': 'external runtime tool', 'dsh-contracts': 'contract-test package selected by mise task',
}
patterns = {
    'error': r'\b[A-Z]{2,}(?:_[A-Z0-9]+)+\b|\b(?:' + '|'.join(defs['error']) + r')\b',
    'event': r'\b(?:run|ws|content|harness|task|turn|render|model|drift|anchor|proposal|session|cap|budget|reins|assistant|agent|tool|system-prompt|tools)/[a-z][a-z-]*\b',
    'package': r'@[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*|\bdsh-plugin-reins\b|\bdsh-contracts\b',
}
definition_files = {'invariant': 'INVARIANTS.md', 'decision': 'DECISIONS.md', 'open_question': 'DECISIONS.md', 'error': 'types.ts', 'event': 'types.ts', 'package': 'AGENT_BRIEF.md'}
inventory = {}
for category, known_list in defs.items():
    refs = {}
    excluded = {}
    for name, source in sources.items():
        for number, line in enumerate(source.splitlines(), 1):
            candidates = ids(line, category) if category in {'invariant', 'decision', 'open_question'} else set(re.findall(patterns[category], line))
            for identifier in candidates:
                role = non_events.get(identifier) if category == 'event' else ('non-error identifier' if category == 'error' and identifier in non_errors else None)
                if role:
                    excluded[identifier] = role
                    continue
                ref = {'file': name, 'line': number, 'historical': name in HISTORICAL}
                if category in {'invariant', 'decision', 'open_question'}:
                    ref['definition'] = name == definition_files[category] and line.startswith('| ' + identifier + ' |')
                else:
                    ref['definition'] = name == definition_files[category] and (category in {'error', 'event'} and re.match(r"^  (?:\| )?'" + re.escape(identifier) + "'", line) is not None or category == 'package')
                refs.setdefault(identifier, []).append(ref)
    known = set(known_list)
    external = external_events if category == 'event' else set(package_roles) if category == 'package' else set()
    unused = sorted(identifier for identifier in known if not any(not ref['historical'] and not ref['definition'] for ref in refs.get(identifier, [])))
    inventory[category] = {'definitions': known_list, 'references': refs,
        'undefined': sorted(set(refs) - known - external), 'external': sorted(set(refs) & external),
        'no_explicit_current_reference_outside_definition': unused, 'excluded_non_identifiers': excluded}
    if category == 'package':
        inventory[category]['external_roles'] = package_roles
cli_names = ['init', 'render', 'import', 'reload', 'run', 'status', 'why', 'explain', 'check', 'lock', 'add', 'replay',
             'propose list', 'propose show', 'propose apply', 'propose reject',
             'session ls', 'session attach', 'session send', 'session interrupt', 'session stop',
             'eval run', 'eval compare', 'eval promote']
cli_refs = {}
for name, source in sources.items():
    for number, line in enumerate(source.splitlines(), 1):
        for match in re.finditer(r'\breins ([a-z]+)(?: ([a-z]+))?', line):
            command, subcommand = match.groups()
            if command in {'from', 'parts'}:
                continue
            if command in {'propose', 'session', 'eval'} and subcommand:
                tail = line[match.start():].split('`', 1)[0].replace('\\|', '|')
                alternatives = re.match(r'reins (?:propose|session|eval) ([a-z]+(?:\|[a-z]+)*)', tail)
                commands = [command + ' ' + item for item in alternatives.group(1).split('|')] if alternatives else [command + ' ' + subcommand]
            else:
                commands = [command]
            for item in commands:
                cli_refs.setdefault(item, []).append({'file': name, 'line': number, 'historical': name in HISTORICAL})
inventory['cli'] = {'definitions': cli_names, 'references': cli_refs,
                    'undefined': sorted(set(cli_refs) - set(cli_names) - {'propose', 'session', 'eval'}),
                    'no_explicit_reference': sorted(set(cli_names) - set(cli_refs)),
                    'excluded': {'reins from': 'generated-header prose', 'reins parts': 'assembly prose'}}
inventory['scope'] = {'canonical': CANONICAL, 'historical': HISTORICAL,
    'notes': ['Ranges and same-prefix slash references are expanded.',
              'Unused means no explicit current reference; it does not prove an implementation is unused.',
              'External DSH events are documented seams, not claims verified against an installed DSH.',
              'Decision records retain historical alternatives superseded by later approved decisions.']}
inventory['missing_requested_decisions'] = sorted(set('D-' + str(n).zfill(3) for n in range(42,69)) - set(defs['decision']))
requirements = []
for name in CANONICAL:
    section = ''
    for number, line in enumerate(sources[name].splitlines(), 1):
        if line.startswith('#'):
            section = line
        if re.search(r'\bMUST(?: NOT)?\b', line):
            requirements.append({'id': 'MUST-' + str(len(requirements)+1).zfill(3),
                'file': name, 'line': number, 'section': section, 'text': line})
blocks = []
for name in ['SPEC.md', 'DSH_INTEGRATION.md']:
    active = None
    for number, line in enumerate(sources[name].splitlines(), 1):
        match = re.match(r'^ {0,3}(`{3,}|~{3,})(.*)$', line)
        if active is None and match:
            active = {'file': name, 'start': number, 'language': match.group(2).strip(), 'marker': match.group(1)[0], 'length': len(match.group(1)), 'body': []}
        elif active and re.match(r'^ {0,3}' + re.escape(active['marker']) + '{' + str(active['length']) + r',}\s*$', line):
            active['end'] = number
            active['body'] = '\n'.join(active['body'])
            del active['marker'], active['length']
            blocks.append(active)
            active = None
        elif active:
            active['body'].append(line)
assert active is None
emit('id-inventory.json', inventory)
emit('must-inventory.json', requirements)
emit('code-examples.json', blocks)
for category in defs:
    data = inventory[category]
    print(category + ': ' + str(len(data['definitions'])) + ' definitions; undefined=' + repr(data['undefined']) + '; no explicit current reference=' + repr(data['no_explicit_current_reference_outside_definition']))
print('cli: ' + str(len(cli_names)) + '; undefined=' + repr(inventory['cli']['undefined']))
print('MUST groups: ' + str(len(requirements)) + '; fenced examples: ' + str(len(blocks)))
