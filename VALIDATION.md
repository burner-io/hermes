# Validation — 0.5.0

## Contract boundary

- No application-owned workflow/reference/spec/story/context-pack abstractions are present in `src/contracts` or `src/runtime`.
- Optional adapters live under `src/integrations`; they may define integration metadata such as query keys and AI tool names, but never redefine Hermes domain entities.
- Programmatic execution support lives in `src/contracts/programmatic.ts` and `src/runtime/{api-server,gateway-rpc}.ts` and preserves Hermes protocol vocabulary.
- Native Hermes field names and payloads are preserved.
- Profile scoping is not globally normalized; it follows the reviewed Hermes endpoint families.
- Kanban remains an optional native plugin surface.
- Native Project value types remain exported, but no core `HermesProjectsApi`/`client.projects` is claimed because the reviewed core dashboard API does not expose `/api/projects`.

## TypeScript/build

```bash
npm run typecheck
npm run build
```

Both pass under `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, and NodeNext ESM.

## Runtime + integration tests

```bash
npm test
```

Current suite: **27/27 passing**.

V0.3 transport coverage remains intact, including auth/scoping, HTTP errors, surface discovery, WebSocket token/ticket auth, Kanban event framing, native `/links`, `?since=`, multipart upload, and provider scoping.

V0.4 integration coverage remains intact:

1. stable scoped React Query-compatible query definitions,
2. relevant-domain mutation invalidation,
3. React Query-compatible Kanban mutation routing,
4. AI SDK tools are read-only by default,
5. `workflow` mode explicitly adds Kanban mutations/dispatch,
6. AI tool execution delegates directly to Hermes and preserves additive response fields,
7. Kanban AI mutation preserves native task payload and board query semantics,
8. requested Kanban AI tools are omitted when the plugin is absent.

V0.5 additionally covers:

9. API Server `Authorization: Bearer` and native `/p/<profile>/...` multiplex prefix,
10. native Runs create payload and terminal-state polling without result normalization,
11. native Run SSE event framing/parsing,
12. TUI Gateway `/api/ws` JSON-RPC request/response and Hermes event envelopes.

## Integration API verification

The integration design was checked against current official documentation:

- Vercel AI SDK 6 `tool()` / `inputSchema` / `execute` and JSON Schema support.
- TanStack Query v5 object-form query/mutation APIs, `queryOptions`, `mutationOptions`, query keys and invalidation.

The build environment could not resolve the public npm registry, so it could not install the real peer packages for a package-manager integration test. The AI adapter compile/runtime fixture mirrors only the documented `tool()` and `jsonSchema()` seam used by this package. The emitted `.d.ts` references the real `ai` peer type (`ToolSet`), and the React Query adapter intentionally has no runtime import from TanStack Query.

## Current Hermes limitation

No live Hermes server was available inside this build environment. The suite therefore validates request construction, response/error handling, auth/scoping, multipart behavior, reachability logic, WebSocket framing, query/mutation adapters, and AI tool delegation against deterministic fixtures rather than performing a live end-to-end handshake.

The package keeps dashboard `raw.request()` / `response()` and API Server `raw()` escape hatches so newly added/version-specific Hermes paths remain usable without inventing a domain abstraction.
