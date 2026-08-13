import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HermesHttpError,
  createHermesClient,
  createHermesClientUnchecked,
} from '../dist/index.js';

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

test('injects native X-Hermes-Session-Token header', async () => {
  const mock = mockFetch(() => json({ version: 'test' }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    sessionToken: 'secret-token',
    probeOnCreate: false,
  });

  await client.system.status();
  const headers = new Headers(mock.calls[0].init.headers);
  assert.equal(headers.get('X-Hermes-Session-Token'), 'secret-token');
});

test('raw.request never injects management profile', async () => {
  const mock = mockFetch(() => json({ ok: true }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test/base',
    fetch: mock.fetch,
    profile: 'designer',
    probeOnCreate: false,
  });

  await client.raw.request({ path: '/api/custom', query: { q: 'hello' } });
  const url = new URL(mock.calls[0].url);
  assert.equal(url.searchParams.get('q'), 'hello');
  assert.equal(url.searchParams.has('profile'), false);
});

test('applies default management profile only on native profile-scoped methods', async () => {
  const mock = mockFetch(() => json({ ok: true }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    profile: 'reviewer',
    probeOnCreate: false,
  });

  await client.config.get();
  await client.operations.doctor();

  assert.equal(new URL(mock.calls[0].url).searchParams.get('profile'), 'reviewer');
  assert.equal(new URL(mock.calls[1].url).searchParams.has('profile'), false);
});

test('explicit profile beats default profile', async () => {
  const mock = mockFetch(() => json({ fields: {} }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    profile: 'default-a',
    probeOnCreate: false,
  });

  await client.config.get('explicit-b');
  assert.equal(new URL(mock.calls[0].url).searchParams.get('profile'), 'explicit-b');
});

test('pairing mutations carry profile in the native request body', async () => {
  const mock = mockFetch(() => json({ ok: true }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    profile: 'telegram-profile',
    probeOnCreate: false,
  });

  await client.messaging.pairing.approve({ platform: 'telegram', request_id: 'r1' });
  const body = JSON.parse(mock.calls[0].init.body);
  assert.deepEqual(body, {
    platform: 'telegram',
    request_id: 'r1',
    profile: 'telegram-profile',
  });
});

test('HermesHttpError preserves status and parsed body', async () => {
  const mock = mockFetch(() => json({ detail: 'nope' }, { status: 409, statusText: 'Conflict' }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    probeOnCreate: false,
  });

  await assert.rejects(
    () => client.profiles.remove('busy'),
    (error) => {
      assert.ok(error instanceof HermesHttpError);
      assert.equal(error.status, 409);
      assert.deepEqual(error.body, { detail: 'nope' });
      return true;
    },
  );
});

test('surface discovery treats 401 as route-present and 404 as absent', async () => {
  const mock = mockFetch(({ url }) => {
    const path = new URL(url).pathname;
    if (path === '/api/auth/me') return json({ error: 'unauthenticated' }, { status: 401, statusText: 'Unauthorized' });
    if (path === '/api/status') return json({ version: 'test' });
    return json({ detail: 'not found' }, { status: 404, statusText: 'Not Found' });
  });
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    probeOnCreate: false,
  });

  const surfaces = await client.surfaces();
  assert.equal(surfaces.auth, true);
  assert.equal(surfaces.system, true);
  assert.equal(surfaces.gateway, true);
  assert.equal(surfaces.kanban, false);
  assert.equal(surfaces.profiles, false);
  assert.equal('projects' in surfaces, false);
});

test('createHermesClient only exposes kanban when plugin route is reachable', async () => {
  const yes = mockFetch(({ url }) => {
    if (new URL(url).pathname === '/api/plugins/kanban/board') {
      return json({ columns: [], tenants: [], assignees: [], latest_event_id: 0, now: 0 });
    }
    return json({ detail: 'not found' }, { status: 404, statusText: 'Not Found' });
  });
  const clientYes = await createHermesClient({ baseUrl: 'http://hermes.test', fetch: yes.fetch });
  assert.ok(clientYes.kanban);

  const no = mockFetch(() => json({ detail: 'not found' }, { status: 404, statusText: 'Not Found' }));
  const clientNo = await createHermesClient({ baseUrl: 'http://hermes.test', fetch: no.fetch });
  assert.equal(clientNo.kanban, undefined);
});

test('websocket session-token mode builds native token query URL', async () => {
  const mock = mockFetch(() => json({}));
  const client = createHermesClientUnchecked({
    baseUrl: 'https://hermes.test/prefix',
    fetch: mock.fetch,
    sessionToken: 'ws-secret',
    websocketAuth: 'session-token',
    probeOnCreate: false,
  });

  const url = new URL(await client.websocket.buildUrl('/api/plugins/kanban/events', { board: 'main' }));
  assert.equal(url.protocol, 'wss:');
  assert.equal(url.pathname, '/prefix/api/plugins/kanban/events');
  assert.equal(url.searchParams.get('board'), 'main');
  assert.equal(url.searchParams.get('token'), 'ws-secret');
});

test('websocket ticket mode mints a native one-time ticket', async () => {
  const mock = mockFetch(({ url }) => {
    assert.equal(new URL(url).pathname, '/api/auth/ws-ticket');
    return json({ ticket: 'ticket-123', ttl_seconds: 30 });
  });
  const client = createHermesClientUnchecked({
    baseUrl: 'https://hermes.test',
    fetch: mock.fetch,
    websocketAuth: 'ticket',
    probeOnCreate: false,
  });

  const url = new URL(await client.websocket.buildUrl('/api/plugins/kanban/events'));
  assert.equal(url.searchParams.get('ticket'), 'ticket-123');
  assert.equal(mock.calls.length, 1);
});

test('kanban live events parse Hermes event frames', async () => {
  let socket;
  class FakeSocket {
    listeners = new Map();
    closed = false;
    constructor(url) { this.url = url; socket = this; }
    addEventListener(type, fn) {
      const list = this.listeners.get(type) ?? [];
      list.push(fn);
      this.listeners.set(type, list);
    }
    removeEventListener(type, fn) {
      this.listeners.set(type, (this.listeners.get(type) ?? []).filter((value) => value !== fn));
    }
    emit(type, event) {
      for (const fn of this.listeners.get(type) ?? []) fn(event);
    }
    close() { this.closed = true; }
  }

  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: async () => json({}),
    sessionToken: 'token',
    websocketAuth: 'session-token',
    websocketFactory: (url) => new FakeSocket(url),
    probeOnCreate: false,
  });

  const frames = [];
  const unsubscribe = await client.kanban.events((frame) => frames.push(frame), { board: 'b1' });
  socket.emit('message', { data: JSON.stringify({ events: [{ id: 1, kind: 'created', payload: {}, created_at: 1 }], cursor: 1 }) });
  assert.equal(frames.length, 1);
  assert.equal(frames[0].cursor, 1);
  assert.equal(new URL(socket.url).searchParams.get('board'), 'b1');
  assert.equal(new URL(socket.url).searchParams.get('since'), null);
  unsubscribe();
  assert.equal(socket.closed, true);
});


test('kanban links use the native /links routes and wire shape', async () => {
  const mock = mockFetch(() => json({ ok: true }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    probeOnCreate: false,
  });

  await client.kanban.link('parent', 'child', 'b1');
  await client.kanban.unlink('parent', 'child', 'b1');

  const create = new URL(mock.calls[0].url);
  assert.equal(create.pathname, '/api/plugins/kanban/links');
  assert.equal(create.searchParams.get('board'), 'b1');
  assert.deepEqual(JSON.parse(mock.calls[0].init.body), { parent_id: 'parent', child_id: 'child' });

  const remove = new URL(mock.calls[1].url);
  assert.equal(remove.pathname, '/api/plugins/kanban/links');
  assert.equal(remove.searchParams.get('parent_id'), 'parent');
  assert.equal(remove.searchParams.get('child_id'), 'child');
});

test('kanban event cursor maps to the native since query parameter', async () => {
  let socketUrl = '';
  class FakeSocket {
    addEventListener() {}
    removeEventListener() {}
    close() {}
    constructor(url) { socketUrl = url; }
  }
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: async () => json({}),
    sessionToken: 'token',
    websocketAuth: 'session-token',
    websocketFactory: (url) => new FakeSocket(url),
    probeOnCreate: false,
  });
  const unsubscribe = await client.kanban.events(() => {}, { board: 'b1', cursor: 42 });
  const url = new URL(socketUrl);
  assert.equal(url.searchParams.get('since'), '42');
  assert.equal(url.searchParams.has('cursor'), false);
  unsubscribe();
});

test('multipart managed upload leaves Content-Type to fetch implementation', async () => {
  const mock = mockFetch(() => json({ ok: true, path: '/tmp/a.txt', entry: {}, root: null, locked_root: null, can_change_path: true }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    probeOnCreate: false,
  });

  await client.filesystem.managed.uploadStream({
    path: '/tmp/a.txt',
    file: new Blob(['hello'], { type: 'text/plain' }),
    filename: 'a.txt',
  });

  const headers = new Headers(mock.calls[0].init.headers);
  assert.equal(headers.has('content-type'), false);
  assert.ok(mock.calls[0].init.body instanceof FormData);
});

test('providers namespace does not inherit the dashboard management profile implicitly', async () => {
  const mock = mockFetch(() => json({ providers: [] }));
  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: mock.fetch,
    profile: 'designer',
    probeOnCreate: false,
  });

  await client.providers.oauth.list();
  const url = new URL(mock.calls[0].url);
  assert.equal(url.pathname, '/api/providers/oauth');
  assert.equal(url.searchParams.has('profile'), false);
});

test('API Server client uses native bearer auth and multiplex profile prefix', async () => {
  const mock = mockFetch(({ url }) => {
    const path = new URL(url).pathname;
    if (path === '/p/reviewer/v1/capabilities') return json({ features: { runs: true } });
    return json({ detail: 'not found' }, { status: 404, statusText: 'Not Found' });
  });
  const client = createHermesClientUnchecked({
    baseUrl: 'http://dashboard.test',
    fetch: async () => json({}),
    probeOnCreate: false,
    apiServer: {
      baseUrl: 'http://api.test:8642',
      apiKey: 'api-secret',
      profile: 'reviewer',
      fetch: mock.fetch,
    },
  });

  const capabilities = await client.apiServer.capabilities();
  assert.equal(capabilities.features.runs, true);
  assert.equal(new URL(mock.calls[0].url).pathname, '/p/reviewer/v1/capabilities');
  const headers = new Headers(mock.calls[0].init.headers);
  assert.equal(headers.get('Authorization'), 'Bearer api-secret');
  assert.equal(headers.has('X-Hermes-Session-Token'), false);
});

test('API Server runs preserve native create payload and wait for terminal state', async () => {
  let polls = 0;
  const mock = mockFetch(({ url, init }) => {
    const path = new URL(url).pathname;
    if (path === '/v1/runs' && init.method === 'POST') {
      assert.deepEqual(JSON.parse(init.body), { input: 'ship it', session_id: 's1' });
      return json({ run_id: 'run_1', status: 'started' }, { status: 202 });
    }
    if (path === '/v1/runs/run_1') {
      polls += 1;
      return json(polls < 2
        ? { object: 'hermes.run', run_id: 'run_1', status: 'running' }
        : { object: 'hermes.run', run_id: 'run_1', status: 'completed', output: 'done' });
    }
    return json({ detail: 'not found' }, { status: 404 });
  });
  const client = createHermesClientUnchecked({
    baseUrl: 'http://dashboard.test',
    fetch: async () => json({}),
    probeOnCreate: false,
    apiServer: { baseUrl: 'http://api.test', apiKey: 'x', fetch: mock.fetch },
  });

  const created = await client.apiServer.runs.create({ input: 'ship it', session_id: 's1' });
  const final = await client.apiServer.runs.wait(created.run_id, { pollIntervalMs: 1, timeoutMs: 1000 });
  assert.equal(final.status, 'completed');
  assert.equal(final.output, 'done');
});

test('API Server run events parse native SSE frames', async () => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('event: message.delta\ndata: {"run_id":"r1","text":"hi"}\n\n'));
      controller.enqueue(encoder.encode('data: {"event":"tool.complete","run_id":"r1"}\n\n'));
      controller.close();
    },
  });
  const fetch = async () => new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/event-stream' },
  });
  const client = createHermesClientUnchecked({
    baseUrl: 'http://dashboard.test',
    fetch: async () => json({}),
    probeOnCreate: false,
    apiServer: { baseUrl: 'http://api.test', apiKey: 'x', fetch },
  });

  const events = [];
  await client.apiServer.runs.events('r1', (event) => events.push(event));
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(events.length, 2);
  assert.equal(events[0].event, 'message.delta');
  assert.equal(events[0].text, 'hi');
  assert.equal(events[1].event, 'tool.complete');
});

test('TUI Gateway client speaks native JSON-RPC and emits Hermes events', async () => {
  let socket;
  class FakeRpcSocket {
    listeners = new Map();
    sent = [];
    constructor(url) {
      this.url = url;
      socket = this;
      queueMicrotask(() => this.emit('open', {}));
    }
    addEventListener(type, fn) {
      const list = this.listeners.get(type) ?? [];
      list.push(fn);
      this.listeners.set(type, list);
    }
    removeEventListener(type, fn) {
      this.listeners.set(type, (this.listeners.get(type) ?? []).filter((value) => value !== fn));
    }
    emit(type, event) {
      for (const fn of this.listeners.get(type) ?? []) fn(event);
    }
    send(data) { this.sent.push(data); }
    close() { this.emit('close', { code: 1000 }); }
  }

  const client = createHermesClientUnchecked({
    baseUrl: 'http://hermes.test',
    fetch: async () => json({}),
    sessionToken: 'ws-token',
    websocketAuth: 'session-token',
    websocketFactory: (url) => new FakeRpcSocket(url),
    probeOnCreate: false,
  });
  const gateway = await client.tuiGateway.connect();
  const observed = [];
  gateway.on('message.delta', (event) => observed.push(event));

  const createPromise = gateway.createSession({ source: 'tool', close_on_disconnect: true, profile: 'developer' });
  const request = JSON.parse(socket.sent[0]);
  assert.equal(request.jsonrpc, '2.0');
  assert.equal(request.method, 'session.create');
  assert.equal(request.params.profile, 'developer');
  socket.emit('message', { data: JSON.stringify({ jsonrpc: '2.0', id: request.id, result: { session_id: 's1' } }) });
  assert.equal((await createPromise).session_id, 's1');

  socket.emit('message', { data: JSON.stringify({ jsonrpc: '2.0', method: 'event', params: { type: 'message.delta', payload: { text: 'hello' } } }) });
  assert.equal(observed[0].payload.text, 'hello');
  assert.equal(new URL(socket.url).pathname, '/api/ws');
  assert.equal(new URL(socket.url).searchParams.get('token'), 'ws-token');
  gateway.close();
});
