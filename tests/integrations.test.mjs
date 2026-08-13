import test from 'node:test';
import assert from 'node:assert/strict';
import { createHermesClient, createHermesClientUnchecked } from '../dist/index.js';
import { createHermesReactQuery } from '../dist/integrations/react-query.js';
import {
  createHermesAiTools,
  HERMES_AI_READ_TOOL_NAMES,
  HERMES_AI_WORKFLOW_TOOL_NAMES,
} from '../dist/integrations/ai-sdk.js';

function json(value, init = {}) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function mockFetch(handler) {
  const calls = [];
  const fetch = async (url, init = {}) => {
    const call = { url: String(url), init };
    calls.push(call);
    return handler(call, calls);
  };
  return { fetch, calls };
}

test('react-query adapter returns stable scoped query definitions', async () => {
  const mock = mockFetch(({ url }) => {
    const path = new URL(url).pathname;
    if (path === '/api/status') return json({ version: 'x', active_sessions: 0, config_path: '', config_version: 1, env_path: '', gateway_exit_reason: null, gateway_health_url: null, gateway_pid: null, gateway_platforms: {}, gateway_running: false, gateway_state: null, gateway_updated_at: null, hermes_home: '', latest_config_version: 1, release_date: '' });
    return json({});
  });
  const client = createHermesClientUnchecked({ baseUrl: 'http://hermes.test', fetch: mock.fetch, probeOnCreate: false });
  const rq = createHermesReactQuery(client, { scopeKey: 'prod:designer', staleTime: 5000 });
  const def = rq.queryOptions.system.status();

  assert.deepEqual(def.queryKey, ['hermes', 'prod:designer', 'system', 'status']);
  assert.equal(def.staleTime, 5000);
  const data = await def.queryFn();
  assert.equal(data.version, 'x');
  assert.equal(new URL(mock.calls[0].url).pathname, '/api/status');
});

test('react-query adapter mutation invalidates only relevant Hermes roots', async () => {
  const mock = mockFetch(() => json({ ok: true, name: 'x', enabled: true }));
  const client = createHermesClientUnchecked({ baseUrl: 'http://hermes.test', fetch: mock.fetch, probeOnCreate: false });
  const invalidated = [];
  const rq = createHermesReactQuery(client, {
    scopeKey: 'one',
    queryClient: {
      invalidateQueries({ queryKey }) {
        invalidated.push(queryKey);
      },
    },
  });

  const mutation = rq.mutationOptions.skills.toggle();
  await mutation.mutationFn({ name: 'test', enabled: true });
  await mutation.onSuccess?.();

  assert.deepEqual(invalidated, [['hermes', 'one', 'skills']]);
});

test('react-query Kanban mutation uses native task route and default board', async () => {
  const mock = mockFetch(() => json({ task: { id: 't1', title: 'Build', status: 'todo' } }));
  const client = createHermesClientUnchecked({ baseUrl: 'http://hermes.test', fetch: mock.fetch, probeOnCreate: false });
  const rq = createHermesReactQuery(client);
  const mutation = rq.mutationOptions.kanban.createTask();

  await mutation.mutationFn({ task: { title: 'Build' }, board: 'product' });
  const url = new URL(mock.calls[0].url);
  assert.equal(url.pathname, '/api/plugins/kanban/tasks');
  assert.equal(url.searchParams.get('board'), 'product');
});

test('AI SDK adapter is read-only by default', () => {
  const client = createHermesClientUnchecked({ baseUrl: 'http://hermes.test', fetch: async () => json({}), probeOnCreate: false });
  const tools = createHermesAiTools(client);

  for (const name of HERMES_AI_READ_TOOL_NAMES) assert.ok(name in tools);
  for (const name of HERMES_AI_WORKFLOW_TOOL_NAMES) assert.equal(name in tools, false);
});

test('AI SDK workflow mode opts into native Kanban mutations', () => {
  const client = createHermesClientUnchecked({ baseUrl: 'http://hermes.test', fetch: async () => json({}), probeOnCreate: false });
  const tools = createHermesAiTools(client, { mode: 'workflow' });
  for (const name of HERMES_AI_WORKFLOW_TOOL_NAMES) assert.ok(name in tools);
});

test('AI SDK tool execute delegates to native Hermes and preserves payload', async () => {
  const payload = {
    active_sessions: 3,
    version: '1.2.3',
    config_path: '/x',
    config_version: 1,
    env_path: '/e',
    gateway_exit_reason: null,
    gateway_health_url: null,
    gateway_pid: null,
    gateway_platforms: {},
    gateway_running: true,
    gateway_state: 'running',
    gateway_updated_at: null,
    hermes_home: '/h',
    latest_config_version: 1,
    release_date: 'today',
    extra_from_future_hermes: 42,
  };
  const mock = mockFetch(() => json(payload));
  const client = createHermesClientUnchecked({ baseUrl: 'http://hermes.test', fetch: mock.fetch, probeOnCreate: false });
  const tools = createHermesAiTools(client, { include: ['hermes_status'] });

  const result = await tools.hermes_status.execute({});
  assert.deepEqual(result, payload);
  assert.equal(new URL(mock.calls[0].url).pathname, '/api/status');
});

test('AI SDK Kanban create tool preserves native request and board override', async () => {
  const mock = mockFetch(() => json({ task: { id: 't1', title: 'Ship', status: 'todo' } }));
  const client = createHermesClientUnchecked({ baseUrl: 'http://hermes.test', fetch: mock.fetch, probeOnCreate: false });
  const tools = createHermesAiTools(client, {
    include: ['hermes_kanban_create_task'],
    board: 'default-board',
  });

  await tools.hermes_kanban_create_task.execute({
    title: 'Ship',
    priority: 7,
    board: 'release',
  });

  const url = new URL(mock.calls[0].url);
  assert.equal(url.pathname, '/api/plugins/kanban/tasks');
  assert.equal(url.searchParams.get('board'), 'release');
  assert.deepEqual(JSON.parse(mock.calls[0].init.body), { title: 'Ship', priority: 7 });
});

test('AI SDK omits requested Kanban tools when plugin is absent', async () => {
  const mock = mockFetch(({ url }) => {
    const path = new URL(url).pathname;
    if (path === '/api/plugins/kanban/board') return json({ detail: 'not found' }, { status: 404, statusText: 'Not Found' });
    return json({});
  });
  const client = await createHermesClient({ baseUrl: 'http://hermes.test', fetch: mock.fetch });
  const tools = createHermesAiTools(client, { include: ['hermes_status', 'hermes_kanban_board', 'hermes_kanban_dispatch'] });

  assert.ok('hermes_status' in tools);
  assert.equal('hermes_kanban_board' in tools, false);
  assert.equal('hermes_kanban_dispatch' in tools, false);
});
