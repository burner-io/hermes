# Runtime architecture — V0.3

## Boundary

```text
Hermes server / dashboard / native plugins
                │
                │ exact native HTTP + WebSocket wire vocabulary
                ▼
        @burner-io/hermes/runtime
                │
                ├── authenticated HTTP
                ├── native profile scoping
                ├── capability/reachability probing
                ├── binary/multipart transport
                └── WebSocket auth + JSON frames
                │
                ▼
        Hermes-native contracts
```

The runtime has no application-domain mapping layer.

## Transport

`HermesHttpTransport` owns:

- base-path-safe URL construction,
- `X-Hermes-Session-Token`,
- optional bearer header,
- cookie credentials,
- JSON serialization,
- native body pass-through (`FormData`, `Blob`, `ArrayBuffer`, `URLSearchParams`),
- timeout/abort,
- `HermesHttpError`,
- endpoint reachability probes.

`raw.request()` intentionally does **not** apply profile scoping. It is a literal native path escape hatch.

## Profile scoping

The client methods opt into profile handling only where Hermes supports it. This is deliberate: a single global request middleware that appends `?profile=` to every call would alter machine-global endpoints and would not match Hermes.

Where a Hermes mutation defines `profile` in its body model, the body is used. Explicit body/method scope wins over the configured default.

Provider-management routes under `/api/providers/*` deliberately do not inherit the configured management profile: Hermes' dashboard client does not include that family in its management-profile rewrite set. An explicitly present wire field is still preserved.

## WebSocket

`HermesWebSocketApi` supports the native auth gate:

- `ticket`: POST `/api/auth/ws-ticket`, then `?ticket=...`.
- `session-token`: `?token=...`.
- `auto`: inspect `/api/status`; use ticket when `auth_required`, otherwise session token.
- `internal`: `?internal=...` when explicitly configured server-side.
- `none`: no auth query for custom/proxied environments.

A WebSocket factory is injectable because Node runtimes differ in global WebSocket availability and server deployments may need a custom implementation.

## Surface discovery

`surfaces()` is SDK transport metadata, not Hermes domain state.

Rules:

- successful response → present;
- protected/error response other than 404 → route considered present;
- 404 → absent;
- network failure → unavailable.

The result is cached briefly (`surfaceCacheMs`, default 30 seconds).

## Optional Kanban

`createHermesClient()` probes `/api/plugins/kanban/board`. The `kanban` namespace is attached only when the plugin route is reachable.

`createHermesClientUnchecked()` skips this probe and attaches Kanban optimistically for bootstrap/testing scenarios.

The Kanban event helper accepts an SDK-side `cursor` option but emits it on the native wire as `?since=`; incoming frames remain the native `{events, cursor}` shape.

## Binary/multipart

Multipart helpers create `FormData` and never set `Content-Type`; the runtime/fetch implementation must add the multipart boundary.

Raw downloads return the native `Response`, allowing the caller to stream, save, inspect headers, or consume a `Blob` without forced buffering.

## V0.5: programmatic execution transports

The runtime now exposes two additional Hermes-native seams alongside the V0.3 dashboard transport.

### TUI Gateway JSON-RPC

`createTuiGatewayApi()` reuses dashboard WebSocket URL/auth handling and connects to `/api/ws`.

It preserves JSON-RPC method names and native event envelopes. Convenience methods are thin wrappers around `session.create`, `prompt.submit`, and interrupt behavior; `request()` and `on()` remain open for protocol additions.

### API Server HTTP/SSE

`createApiServerApi()` is deliberately configured independently from the dashboard client because Hermes' API Server is a separate listener/protocol.

It owns:

- API Server `baseUrl`;
- native `Authorization: Bearer <API_SERVER_KEY>`;
- native multiplex profile prefix `/p/<profile>/...`;
- JSON request/response handling;
- native Run create/get/stop/approval routes;
- SSE Run event consumption;
- abort/timeout handling;
- `runs.wait()` as a client convenience over repeated native `get()` calls.

The final Run object is never normalized into an SDK-specific result type. Additive Hermes fields remain visible to callers.

This separation is what allows an external package such as `@burner-io/workflow` to delegate one node to a native Hermes Run without teaching Hermes about workflow concepts.
