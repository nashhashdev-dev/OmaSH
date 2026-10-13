import assert from 'node:assert/strict';
import test from 'node:test';
import { Context } from '@deepseek-ai/cordis';
import SystemPrompt, { renderPrompt } from '@deepseek-ai/dsh-system-prompt';
import { createScope } from '@deepseek-ai/dsh-scope';
import ToolRuntime from '@deepseek-ai/dsh-tools';
import SubagentRuntime from '@deepseek-ai/dsh-subagent';
import SubprocessRuntime from '@deepseek-ai/dsh-subprocess';
import * as CodexProvider from '@deepseek-ai/dsh-subagent-codex';
import * as ClaudeProvider from '@deepseek-ai/dsh-subagent-claude-code';

async function runtime() {
  const ctx = new Context();
  await ctx.plugin(SystemPrompt, { includeHarnessIdentity: false }).await();
  await ctx.plugin(ToolRuntime).await();
  const probe = ctx.inject(['systemPrompt', 'tools'], () => {});
  await probe.await();
  return probe.ctx;
}

test('S-5 real SystemPrompt orders, isolates, shadows, and disposes scoped sections', async () => {
  const ctx = await runtime();
  try {
    assert.equal(ctx.systemPrompt.getSectionOrder('HARNESS_IDENTITY'), -1000);
    assert.equal(ctx.systemPrompt.getSectionOrder('TOOL_BASH'), 1000);
    const key = {};
    const siblingKey = {};
    const scoped = createScope(ctx, key);
    ctx.systemPrompt.section({ name: 'reins:static', order: 10, text: 'GLOBAL' });
    scoped.ctx.systemPrompt.section({ name: 'reins:static', order: 10, text: 'SCOPED' });
    scoped.ctx.systemPrompt.section({ name: 'reins:session', order: 20, text: 'SESSION' });
    scoped.ctx.systemPrompt.context({ name: 'reins:turn', order: 10, text: 'TURN' });
    assert.equal(renderPrompt(await ctx.systemPrompt.assemble({ scope: key })), 'SCOPED\n\nSESSION');
    assert.equal(renderPrompt(await ctx.systemPrompt.assemble({ scope: siblingKey })), 'GLOBAL');
    assert.deepEqual((await ctx.systemPrompt.assemble({ scope: key })).contexts, [{ name: 'reins:turn', text: 'TURN' }]);
    await scoped.dispose();
    assert.equal(renderPrompt(await ctx.systemPrompt.assemble({ scope: key })), 'GLOBAL');
  } finally {
    await ctx.root.fiber.dispose();
  }
});

test('S-6 real product providers register but reject continuable children before any launch', async () => {
  const ctx = new Context();
  try {
    await ctx.plugin(SubagentRuntime).await();
    await ctx.plugin(SubprocessRuntime).await();
    const codex = ctx.plugin(CodexProvider);
    const claude = ctx.plugin(ClaudeProvider);
    await codex.await();
    await claude.await();
    for (const name of ['codex', 'claude-code']) {
      const provider = ctx.subagents.getProvider(name);
      assert.ok(provider);
      assert.equal(provider.capabilities.agentOptions, false);
      assert.equal(provider.prepareContinuable, undefined);
      await assert.rejects(ctx.subagents.prepareContinuable(name, {}), (error) => error.code === 'UNSUPPORTED_CAPABILITY');
    }
    await codex.dispose();
    await claude.dispose();
    assert.equal(ctx.subagents.getProvider('codex'), undefined);
    assert.equal(ctx.subagents.getProvider('claude-code'), undefined);
  } finally {
    await ctx.fiber.dispose();
  }
});

test('S-5 real asynchronous assembly returns replacement sections and contexts in one scope', async () => {
  const ctx = await runtime();
  try {
    const key = {};
    const scoped = createScope(ctx, key);
    scoped.ctx.systemPrompt.section({ name: 'reins:static', order: 10, text: 'STALE' });
    scoped.ctx.systemPrompt.context({ name: 'reins:turn', order: 10, text: 'STALE_TURN' });
    ctx.systemPrompt.section({ name: 'fixture:other', order: 30, text: 'KEEP_{{fixture_var}}' });
    ctx.systemPrompt.context({ name: 'fixture:other', order: 20, text: 'KEEP_CONTEXT' });
    ctx.systemPrompt.variable('fixture_var', () => 'kept');
    ctx.systemPrompt.tools(() => ({ schemas: [{ name: 'fixture_tool', description: 'Fixture schema', parameters: { type: 'object', properties: {} } }] }));
    let completed = false;
    scoped.ctx.on('system-prompt/assemble', async (_assembly, _context, next) => {
      await Promise.resolve();
      completed = true;
      const assembly = await next();
      return {
        ...assembly,
        sections: assembly.sections.map((part) => part.name === 'reins:static' ? { ...part, text: 'REPLACED' } : part),
        contexts: assembly.contexts.map((part) => part.name === 'reins:turn' ? { ...part, text: 'READY' } : part),
      };
    });
    const assembly = await ctx.systemPrompt.assemble({ scope: key });
    assert.equal(completed, true);
    assert.equal(renderPrompt(assembly), 'REPLACED\n\nKEEP_kept');
    assert.deepEqual(assembly.contexts, [{ name: 'reins:turn', text: 'READY' }, { name: 'fixture:other', text: 'KEEP_CONTEXT' }]);
    assert.equal(assembly.variables.fixture_var, 'kept');
    assert.deepEqual(assembly.tools.map((tool) => tool.name), ['fixture_tool']);
    assert.equal(renderPrompt(await ctx.systemPrompt.assemble({ scope: {} })), 'KEEP_kept');
    await scoped.dispose();
  } finally {
    await ctx.root.fiber.dispose();
  }
});

test('S-5 real tool restrictions remove visibility and execution; guards cannot be overridden', async () => {
  const ctx = await runtime();
  let calls = 0;
  try {
    for (const name of ['safe', 'write_fixture']) {
      ctx.tools.register({
        name,
        description: 'Disposable M0 tool',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
        output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
        execute: async () => { calls++; return 'ok'; },
      });
    }
    // Direct registry probe: the opaque identity is not a running Agent.
    const agent = {};
    const scoped = createScope(ctx, agent);
    const undo = scoped.ctx.tools.restrict({ allow: ['safe'] });
    assert.deepEqual(ctx.tools.schemas(agent).map((tool) => tool.name), ['safe']);
    assert.deepEqual(ctx.tools.schemas({}).map((tool) => tool.name).sort(), ['safe', 'write_fixture']);
    const hidden = await ctx.tools.execute({ agent, callId: 'fixture-hidden', name: 'write_fixture', arguments: {}, signal: new AbortController().signal });
    assert.equal(hidden.isError, true);
    assert.equal(calls, 0);
    undo();
    scoped.ctx.tools.guard((exec) => exec.name === 'write_fixture' ? 'fixture-denied' : undefined);
    ctx.on('tools/pre-execute', async () => ({ kind: 'allow' }));
    const denied = await ctx.tools.execute({ agent, callId: 'fixture-denied', name: 'write_fixture', arguments: {}, signal: new AbortController().signal });
    assert.equal(denied.isError, true);
    assert.equal(calls, 0);
    const allowed = await ctx.tools.execute({ agent, callId: 'fixture-allowed', name: 'safe', arguments: {}, signal: new AbortController().signal });
    assert.equal(allowed.isError, false);
    assert.equal(calls, 1);
    const outside = await ctx.tools.execute({ callId: 'fixture-outside', name: 'write_fixture', arguments: {}, signal: new AbortController().signal });
    assert.equal(outside.isError, false);
    assert.equal(calls, 2); // Scope controls registration, not a security boundary.
  } finally {
    await ctx.root.fiber.dispose();
  }
});
