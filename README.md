# @burner-io/hermes

Hermes-native TypeScript SDK modeled from Hermes itself.

**V0.6.0 adds a one-origin private machine connection as the recommended application seam:** one `baseUrl`, one `API_SERVER_KEY`-derived `apiKey`, and typed control + API Server/Run facades over that same trusted Hermes origin.

The low-level transports remain available because Hermes still has native auth/routing variants that some deployments use directly. V0.6 does not erase those native differences; it stops forcing applications to model them as separate upstreams when their private Hermes ingress exposes them behind one origin and one Bearer credential.

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

## Recommended: one private Hermes connection

For a trusted backend/private ingress where the same Hermes origin accepts the same machine Bearer credential across the Hermes route families your application uses:

```ts
import { createHermesConnection } from "@burner-io/hermes";

const hermes = await createHermesConnection({
  baseUrl: process.env.HERMES_URL!,
  apiKey: process.env.HERMES_API_KEY!,
});

const status = await hermes.control.system.status();
const profiles = await hermes.control.profiles.list();
const sessions = await hermes.control.sessions.list({ order: "recent" });

const capabilities = await hermes.capabilities();
const run = await hermes.runs.create({ input: "Review this release" });
const final = await hermes.runs.wait(run.run_id);
```

`createHermesConnectionUnchecked()` creates the same connection without startup surface probing, which is useful for SSR/bootstrap/tests.

The connection deliberately exposes two typed facades:

```text
HermesConnection
├── control   -> Hermes-native /api/* + plugin/control namespaces
└── apiServer -> native API Server /v1/*, selected /api/*, health and SSE
```

They receive the **same `baseUrl` and the same `apiKey`**. They are SDK views over one trusted origin, not an instruction to configure two application URLs or two secrets.

Conveniences:

- `connection.runs` -> `connection.apiServer.runs`
- `connection.capabilities()` -> API Server capabilities
- `connection.models()` -> API Server model aliases
- `connection.health()` -> API Server health/readiness

Native profile scoping remains faithful per facade: control methods use the control endpoint's native profile semantics, while API Server calls use Hermes' `/p/<profile>/...` multiplex prefix.

## Low-level control client

Use `createHermesClient()` directly when you intentionally need Hermes' lower-level control transport configuration, such as legacy/session-token or gated Dashboard deployments:

```ts
import { createHermesClient } from "@burner-io/hermes";

const hermes = await createHermesClient({
  baseUrl: "http://127.0.0.1:9119",
  sessionToken: process.env.HERMES_SESSION_TOKEN,
  profile: "designer",
});
```

Low-level auth options remain native and explicit:

- `sessionToken` -> `X-Hermes-Session-Token`.
- cookies through `credentials: "include"` by default.
- `bearerToken` -> `Authorization: Bearer ...`.
- WebSocket ticket/session/internal auth modes.

These options are intentionally not part of `createHermesConnection()`, whose contract is the private machine Bearer model.

## Low-level API Server client

Use `createApiServerApi()` when you only need the API Server surface:

```ts
import { createApiServerApi } from "@burner-io/hermes";

const api = createApiServerApi({
  baseUrl: process.env.HERMES_URL!,
  apiKey: process.env.HERMES_API_KEY!,
  profile: "reviewer",
});

const run = await api.runs.create({ input: "Review the release plan" });
const unsubscribe = await api.runs.events(run.run_id, console.log);
const final = await api.runs.wait(run.run_id);
unsubscribe();
```

The typed Runs surface includes native create/get/events/approval/stop plus client-side `wait()` polling. `raw()` remains available for API Server endpoints not yet typed.

## Native profile scoping

`profile` is **not** globally appended to every control request. The runtime applies the configured profile only to native Hermes families that actually support it, and keeps machine-global/self-scoped operations unmodified.

For the API Server facade, a configured profile uses Hermes' native `/p/<profile>/...` multiplex prefix.

## Raw, binary and multipart access

Typed namespaces cover the reviewed Hermes surfaces. Escape hatches prevent the SDK from blocking new Hermes releases:

```ts
await hermes.control.raw.request({
  method: "GET",
  path: "/api/some-new-hermes-surface",
});

const response = await hermes.control.response(
  "GET",
  "/api/some-binary-endpoint",
);

const apiValue = await hermes.apiServer.raw("GET", "/api/sessions");
```

Multipart helpers create `FormData` and never set `Content-Type` manually; fetch/runtime supplies the boundary.

## Kanban live events

When the native Kanban plugin is reachable:

```ts
const unsubscribe = await hermes.control.kanban?.events(
  (frame) => {
    for (const event of frame.events) console.log(event.kind, event.task_id);
  },
  { board: "default" },
);
```

The SDK preserves Hermes' `{ events, cursor }` frame shape.

## TUI Gateway JSON-RPC

For interactive clients, `connection.control.tuiGateway` speaks Hermes' native JSON-RPC protocol on `/api/ws`:

```ts
const gateway = await hermes.control.tuiGateway.connect();
const { session_id } = await gateway.createSession({
  source: "tool",
  close_on_disconnect: true,
});

const off = gateway.on("message.delta", (event) => console.log(event.payload));
await gateway.submitPrompt({ session_id, text: "Analyze this repository" });
```

The SDK preserves native JSON-RPC method/event names. See `docs/PROGRAMMATIC.md`.

## React Query integration

```ts
import { createHermesReactQuery } from "@burner-io/hermes/react-query";

const hq = createHermesReactQuery(hermes.control, {
  scopeKey: "prod:designer",
  queryClient,
});
```

## AI SDK integration

```ts
import { createHermesAiTools } from "@burner-io/hermes/ai-sdk";

const tools = createHermesAiTools(hermes.control, {
  mode: "workflow",
  board: "product",
});
```

The AI SDK adapter delegates to Hermes-native operations; it does not create a second agent/orchestrator.

## Native surface inventory

Control namespaces include:

`auth`, `system`, `config`, `env`, `dashboard`, `profiles`, `skills`, `sessions`, `tools`, `mcp`, `models`, `providers`, `audio`, `messaging`, `webhooks`, `credentials`, `memory`, `learning`, `curator`, `analytics`, `filesystem`, `git`, `cron`, `operations`, `plugins`, `gateway`, `updates`, `logs`, `portal`, plus optional native Kanban.

Native Hermes `Project` value types remain exported because Hermes contains that concept. There is deliberately **no core `hermes.projects` management namespace** until a traced Hermes core route supports it; Kanban may expose its own project summaries.

See `docs/INVENTORY.md`, `docs/RUNTIME.md`, `docs/PROGRAMMATIC.md`, and `docs/SOURCE-MAP.md`.

## Validation

```bash
npm run check
```

V0.6 adds one-origin/Bearer transport tests while keeping the V0.5 control, Runs, TUI, Kanban and integration coverage. See `VALIDATION.md`.
