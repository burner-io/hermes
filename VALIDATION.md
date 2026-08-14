# Validation — 0.6.0

## Contract boundary

- No application-owned workflow/reference/spec/story/context-pack abstractions are present in `src/contracts` or `src/runtime`.
- Optional adapters live under `src/integrations`; they may define integration metadata such as query keys and AI tool names, but never redefine Hermes domain entities.
- Programmatic execution support preserves Hermes protocol vocabulary.
- Native Hermes field names and payloads are preserved.
- Profile scoping is not globally normalized; it follows the relevant Hermes endpoint family.
- Kanban remains an optional native plugin surface.
- Native Project value types remain exported, but no untraced core `client.projects` management API is invented.

## V0.6 one-origin invariant

`createHermesConnection({ baseUrl, apiKey })` is the preferred machine-to-machine helper.

It must satisfy:

1. control calls use the supplied `apiKey` as `Authorization: Bearer`;
2. API Server calls use the same supplied `apiKey` as `Authorization: Bearer`;
3. neither facade injects `X-Hermes-Session-Token` through this helper;
4. both facades share the same normalized origin;
5. native profile scoping remains different where Hermes defines it differently;
6. optional plugin probing uses the same origin/key;
7. low-level session-token/cookie/Ticket options remain available only through the lower-level control client.

## TypeScript/build

The core contracts/runtime compile under:

- `strict`
- `exactOptionalPropertyTypes`
- `noUncheckedIndexedAccess`
- NodeNext ESM

The build environment could not resolve/install the public `ai` peer package. For validation only, a minimal local `ai` type/runtime fixture matching the two seams used by this package (`jsonSchema()` and `tool()`) was provided outside the packaged files. With that fixture, the full package passed `npm run check` under the package's strict TypeScript settings.

## Runtime tests

Full deterministic suite after the V0.6 change: **30/30 passing** (22 runtime/programmatic tests + 8 integration-adapter tests).

New V0.6 coverage:

- same Bearer key on control `/api/*` and API Server `/v1/*` requests;
- same base origin on both facades;
- no session-token header in the one-origin helper;
- control `?profile=` behavior vs API Server `/p/<profile>/...` behavior;
- optional Kanban surface probing under the same Bearer-authenticated origin.

Existing V0.3–V0.5 runtime coverage remains intact, including HTTP errors, surface discovery, WebSocket token/ticket auth, Kanban event framing, native `/links`, `?since=`, multipart upload, provider scoping, API Server Runs polling/SSE, and TUI Gateway JSON-RPC fixtures.

The React Query / AI SDK adapters remain behaviorally unchanged by the connection helper; V0.6 only includes a small exact-optional typing fix in the Kanban AI adapter discovered by the strict validation run.

## Live-server limitation

No live Hermes server was available inside this build environment. The suite validates request construction, response/error handling, auth/scoping, multipart behavior, reachability logic, WebSocket framing and Runs behavior against deterministic fixtures.

The SDK retains control `raw.request()` / `response()` and API Server `raw()` escape hatches so version-specific Hermes paths remain usable without inventing a new domain abstraction.
