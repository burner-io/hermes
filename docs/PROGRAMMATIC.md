# Programmatic Hermes protocols — SDK 0.6

The SDK keeps Hermes-native wire semantics explicit while allowing a trusted application to configure **one private Hermes origin and one machine key**.

## 1. Recommended private connection

```ts
const hermes = await createHermesConnection({
  baseUrl: process.env.HERMES_URL!,
  apiKey: process.env.HERMES_API_KEY!,
});
```

This produces:

- `hermes.control` — typed Hermes control/plugin namespaces;
- `hermes.apiServer` — typed API Server surface;
- `hermes.runs` — convenience alias for native Runs;
- `hermes.capabilities()`, `models()`, `health()` — API Server conveniences.

Both facades receive the same URL/key. The helper maps `apiKey` to Bearer auth for the control HTTP transport and to native API Server Bearer auth for API Server calls.

This helper is for deployments where the trusted/private Hermes origin or ingress accepts that same machine credential on the route families the application uses. It does not remove lower-level native auth options from the SDK.

## 2. Control HTTP/WebSocket

`createHermesClient()` remains the low-level control-plane client for Profiles, Skills, Sessions, tools, MCP, Kanban, config, filesystem, etc.

It can use native session-token/cookie/ticket mechanisms or an explicit Bearer seam. `createHermesConnection()` chooses Bearer because its contract is machine-to-machine private access.

Profile scoping remains endpoint-native; the SDK does not globally append `profile` to every request.

## 3. TUI Gateway JSON-RPC

`HermesRuntimeClient.tuiGateway` targets native `/api/ws`.

Convenience methods remain thin aliases over Hermes-native operations:

- `createSession()` -> `session.create`
- `submitPrompt()` -> `prompt.submit`
- `interrupt()` -> native interrupt request

`request()` and `on()` remain open for Hermes methods/events not yet wrapped.

## 4. API Server HTTP/SSE

`createApiServerApi()` remains available independently:

```ts
const api = createApiServerApi({
  baseUrl: process.env.HERMES_URL!,
  apiKey: process.env.HERMES_API_KEY!,
  profile: "architect",
});
```

Authentication is `Authorization: Bearer <API_SERVER_KEY>`.

Native profile multiplexing uses `/p/<profile>/...`.

Typed surfaces include:

- `capabilities()`
- `models()`
- `health()` / detailed health
- `runs.create()`
- `runs.get()`
- `runs.events()`
- `runs.approve()`
- `runs.stop()`
- `runs.wait()` convenience
- `raw()`

The Runs methods preserve native request fields and additive Hermes response fields.

## Runs and external workflow runtimes

```text
application workflow node
       │
       ▼
@burner-io/hermes
HermesConnection.runs
       │
POST /v1/runs
GET  /v1/runs/:id/events
GET  /v1/runs/:id
       │
       ▼
Hermes owns reasoning/tools/execution inside the Run
```

The SDK deliberately does not define the application workflow node, graph, project, story, spec or orchestration semantics. Those belong to the application or another package such as `@burner-io/workflow`.

## Why the facades remain explicit

One application URL/key does **not** imply one flattened Hermes namespace.

Important native distinctions remain visible:

- control endpoint profile scoping vs API Server `/p/<profile>/...` multiplexing;
- interactive JSON-RPC lifecycle vs durable HTTP/SSE Run lifecycle;
- control-domain payloads vs API Server payloads;
- WebSocket auth mechanics when an interactive transport is used.

`HermesConnection` unifies deployment configuration, not Hermes' domain/protocol vocabulary.
