# @burner-io/hermes

Hermes-native TypeScript SDK modeled from Hermes itself.

**V0.5.0 adds Hermes' native programmatic execution protocols to the V0.4 management/integration SDK:** TUI Gateway JSON-RPC over `/api/ws` and the separate API Server HTTP/SSE Runs surface. These protocols stay Hermes-native and are suitable seams for applications and external workflow runtimes.

## Non-negotiable rule

If a resource, field, state, operation, or relationship cannot be traced to Hermes itself, it does not belong in this package's Hermes domain contracts.

The package therefore keeps Hermes vocabulary and wire spelling intact:

- `Profile` stays `Profile`.
- `Skill` stays `Skill`.
- `Session` stays `Session`.
- `Toolset` stays `Toolset`.
- `MCP` stays `MCP`.
- Kanban `Board`, `Task`, `Run`, `Worker`, `Event`, `Diagnostic` keep their Hermes meanings.
- Native payload fields keep `snake_case`.

Application-owned concepts must adapt to this package, never the reverse.

## Install

```bash
npm install @burner-io/hermes
```

The core SDK has no runtime dependency. Optional subpaths declare optional peers: `@tanstack/react-query >=5.90 <6` and `ai >=6 <7`. The core targets Node.js 20+ and browser runtimes with `fetch`, `FormData`, `Blob`, and optionally `WebSocket`.

## Create a client

```ts
import { createHermesClient } from "@burner-io/hermes";

const hermes = await createHermesClient({
  baseUrl: "http://127.0.0.1:9119",
  sessionToken: process.env.HERMES_SESSION_TOKEN,
  profile: "designer",
});

const profiles = await hermes.profiles.list();
const sessions = await hermes.sessions.list({ order: "recent" });
const surfaces = await hermes.surfaces();

if (hermes.kanban) {
  const board = await hermes.kanban.board();
}
```

`createHermesClient()` probes only the optional Kanban plugin before exposing `client.kanban`. `createHermesClientUnchecked()` performs no startup network probe and is useful for SSR/bootstrap/tests; in that mode the caller accepts that Kanban may 404.

## Authentication

The transport supports the native dashboard mechanisms without renaming them:

- `sessionToken` → `X-Hermes-Session-Token` for loopback/legacy dashboard auth.
- cookies through `credentials: "include"` by default for gated dashboard sessions.
- optional `bearerToken` for deployments using an Authorization bearer seam.
- WebSocket `ticket` auth through `/api/auth/ws-ticket` when the dashboard reports `auth_required`.
- WebSocket `token` auth for loopback/session-token mode.
- optional native `internal` WebSocket token when supplied by a server-side integration.

A custom `fetch` and `websocketFactory` can be injected for server runtimes, tests, proxies, or custom cookie jars.

## Native profile scoping

`profile` is **not** globally appended to every request. The runtime applies the configured management profile only to native Hermes families that actually support it, and keeps machine-global/self-scoped operations unmodified.

Explicit method/body profile always wins over the configured default. Pairing mutations are special: Hermes reads their profile from the request body, so the SDK inserts the default there rather than relying only on a query string.

## Raw and binary access

Typed namespaces cover the reviewed Hermes surfaces. Two escape hatches prevent the SDK from blocking new Hermes releases:

```ts
await hermes.raw.request({
  method: "GET",
  path: "/api/some-new-hermes-surface",
});

const response = await hermes.response(
  "GET",
  "/api/some-binary-endpoint",
);
```

`raw.request()` parses normal REST responses. `response()` returns the authenticated native `Response` for streams/downloads or endpoints not yet typed.

## Files and uploads

V0.3 implements Hermes' multipart paths without setting `Content-Type` manually:

```ts
await hermes.filesystem.managed.uploadStream({
  path: "/workspace/report.txt",
  file: new Blob(["hello"], { type: "text/plain" }),
  filename: "report.txt",
});

const response = await hermes.filesystem.managed.download("/workspace/report.txt");
```

The SDK also implements `/api/fs/*` for remote Desktop-style filesystem operations and the operations backup/import upload paths.

## Kanban live events

When the native Kanban dashboard plugin is reachable:

```ts
const unsubscribe = await hermes.kanban?.events(
  (frame) => {
    for (const event of frame.events) {
      console.log(event.kind, event.task_id);
    }
  },
  { board: "default" },
);

// later
unsubscribe?.();
```

The SDK preserves the Hermes frame shape `{ events, cursor }`; it does not turn events into an application workflow/event model.

## Programmatic execution protocols

V0.5 exposes Hermes' native execution seams without folding them into the dashboard management API.

### API Server HTTP/SSE

The API Server is a separate Hermes listener from the dashboard. It uses native bearer authentication and, when configured, Hermes' multiplexed `/p/<profile>/...` URL prefix.

```ts
import { createApiServerApi } from "@burner-io/hermes";

const apiServer = createApiServerApi({
  baseUrl: "http://127.0.0.1:8642",
  apiKey: process.env.API_SERVER_KEY,
  profile: "reviewer",
});

const run = await apiServer.runs.create({
  input: "Review the release plan",
  instructions: "Be precise and identify blockers.",
});

const unsubscribe = await apiServer.runs.events(run.run_id, (event) => {
  console.log(event);
});

const final = await apiServer.runs.wait(run.run_id);
unsubscribe();
```

The typed Runs surface includes native create/get/events/approval/stop plus a client-side `wait()` convenience that polls native run state without changing the returned payload. `raw()` remains available for API Server endpoints not yet typed.

The same API Server can be attached to a full dashboard client:

```ts
const hermes = await createHermesClient({
  baseUrl: "http://127.0.0.1:9119",
  sessionToken: process.env.HERMES_SESSION_TOKEN,
  apiServer: {
    baseUrl: "http://127.0.0.1:8642",
    apiKey: process.env.API_SERVER_KEY,
    profile: "reviewer",
  },
});

await hermes.apiServer?.runs.create({ input: "Do the work" });
```

### TUI Gateway JSON-RPC

For interactive clients, `client.tuiGateway` speaks the native JSON-RPC protocol on `/api/ws`, reusing the SDK's existing dashboard WebSocket auth behavior:

```ts
const gateway = await hermes.tuiGateway.connect();
const { session_id } = await gateway.createSession({
  source: "tool",
  close_on_disconnect: true,
});

const off = gateway.on("message.delta", (event) => {
  console.log(event.payload);
});

await gateway.submitPrompt({
  session_id,
  text: "Analyze this repository",
});

// later
off();
gateway.close();
```

The SDK preserves native JSON-RPC method/event names. It does not rename these events into an application chat or workflow protocol.

See `docs/PROGRAMMATIC.md`.

## React Query integration

```ts
import { createHermesReactQuery } from "@burner-io/hermes/react-query";

const hq = createHermesReactQuery(hermes, {
  scopeKey: "prod:designer",
  queryClient,
});

useQuery(hq.queryOptions.system.status());
useQuery(hq.queryOptions.sessions.list({ order: "recent" }));
```

The adapter is structurally compatible with TanStack Query v5 and has no React/runtime import of its own. Mutations can auto-invalidate the relevant Hermes key roots when a `queryClient` is supplied.

## AI SDK integration

```ts
import { createHermesAiTools } from "@burner-io/hermes/ai-sdk";

const readTools = createHermesAiTools(hermes);
const workflowTools = createHermesAiTools(hermes, {
  mode: "workflow",
  board: "product",
});
```

The AI SDK adapter is read-only by default. `workflow` mode opts into native Kanban mutations/dispatch. It does not create an agent or a second orchestrator: every tool calls one Hermes SDK operation and returns Hermes' native payload.

See `docs/INTEGRATIONS.md`.

## Native surface inventory

Core namespaces implemented since V0.3 include:

`auth`, `system`, `config`, `env`, `dashboard`, `profiles`, `skills`, `sessions`, `tools`, `mcp`, `models`, `providers`, `audio`, `messaging`, `webhooks`, `credentials`, `memory`, `learning`, `curator`, `analytics`, `filesystem`, `git`, `cron`, `operations`, `plugins`, `gateway`, `updates`, `logs`, `portal`, plus optional native Kanban.

Native Hermes `Project` value types remain exported because current Hermes source contains that concept. There is deliberately **no core `hermes.projects` API namespace** until a public core dashboard management route exists. Kanban may expose project summaries through its own plugin route.

See `docs/INVENTORY.md`, `docs/RUNTIME.md`, and `docs/SOURCE-MAP.md`.

## Validation

```bash
npm run check
```

V0.5 is validated with strict TypeScript plus runtime transport/integration/programmatic-protocol tests. See `VALIDATION.md` for the exact coverage and current limitation: no live Hermes instance was available in the build environment, so the wire tests use deterministic HTTP/WebSocket fixtures modeled from the reviewed Hermes source.
