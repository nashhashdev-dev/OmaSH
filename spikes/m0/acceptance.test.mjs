import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('M0 records real-runtime evidence and explicitly distinguishes incomplete probes', async () => {
  const evidence = JSON.parse(await readFile(new URL('./evidence.json', import.meta.url), 'utf8'));
  assert.equal(evidence.milestone, 'M0');
  assert.equal(evidence.transport, 'local-protocol-fixture');
  for (const id of ['S-1', 'S-2', 'S-3', 'S-4', 'S-5', 'S-6']) {
    const spike = evidence.spikes.find((item) => item.id === id);
    assert.ok(spike, `${id} must be present`);
    assert.ok(['adopt', 'reject', 'partial'].includes(spike.conclusion));
    assert.ok(spike.observations.length > 0);
    assert.ok(spike.observations.every((item) => ['pass', 'fail', 'blocked', 'not-run'].includes(item.status)));
    assert.ok(spike.observations.every((item) => item.evidence.length > 0));
  }
});
