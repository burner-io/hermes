# Programmatic Hermes protocols — SDK 0.5

Hermes exposes more than one network/programmatic surface. The SDK keeps them separate because they have different lifecycles, authentication and semantics.

## 1. Dashboard management HTTP/WebSocket

`createHermesClient()` continues to target the dashboard/control-plane server for Profiles, Skills, Sessions, tools, MCP, Kanban, config, filesystem, etc.

This transport uses Hermes dashboard auth (`X-Hermes-Session-Token`, cookie-gated auth, or native WS tickets depending on deployment).

## 2. TUI Gateway JSON-RPC

`HermesRuntimeClient.tuiGateway` targets the native `/api/ws` WebSocket exposed with the dashboard gateway.

The SDK sends standard Hermes JSON-RPC request envelopes and exposes native method/event names. Convenience methods are thin aliases over native operations:

- `createSession()` → `session.create`
- `submitPrompt()` → `prompt.submit`
- `interrupt()` → native interrupt request

`connection.request()` and `connection.on()` are retained for methods/events added by Hermes that the convenience layer has not yet named.

This is the appropriate seam for interactive session clients that need live message/tool/approval events.

## 3. API Server HTTP/SSE

`createApiServerApi()` targets Hermes' separate API Server listener.

```ts
const api = createApiServerApi({
  baseUrl: "http://127.0.0.1:8642",
  apiKey: process.env.API_SERVER_KEY,
  profile: "architect",
});
```

Native profile multiplexing is implemented as `/p/<profile>/...`, not as the dashboard's management `?profile=` convention.

Authentication uses the native API Server bearer key.

Typed V0.5 surfaces:

- `capabilities()`
- `models()`
- `health()` / detailed health
- `runs.create()`
- `runs.get()`
- `runs.events()` (SSE)
- `runs.approve()`
- `runs.stop()`
- `runs.wait()` client convenience
- `raw()` escape hatch

The Runs methods preserve snake_case request fields and additive response fields from Hermes.

## Runs and external workflow runtimes

The native Run lifecycle is the preferred seam when another system needs to delegate a durable unit of work to Hermes:

```text
external workflow node
       │
       ▼
@burner-io/hermes API Server client
       │
POST /v1/runs
GET  /v1/runs/:id/events
GET  /v1/runs/:id
       │
       ▼
Hermes owns reasoning/tools/execution inside the Run
```

The Hermes SDK deliberately does not define the external workflow node, graph or orchestration semantics. Those belong to the application or a separate package such as `@burner-io/workflow`.

## Why the transports are not merged

A global `hermes.runPrompt()` abstraction would hide important native differences:

- dashboard management profile scoping vs API Server URL-profile multiplexing;
- dashboard session auth vs API Server bearer auth;
- interactive JSON-RPC session lifecycle vs durable HTTP/SSE Run lifecycle;
- different event/protocol envelopes.

Keeping these explicit makes the SDK a faithful facade rather than a second Hermes domain model.
