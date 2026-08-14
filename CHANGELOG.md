# Changelog

## 0.6.0 - 2026-08-14

- Added `createHermesConnection()` and `createHermesConnectionUnchecked()` as the preferred private machine-connection helpers.
- A connection is configured with exactly one `baseUrl` and one `apiKey` and exposes typed `control` and `apiServer` facades over that same origin/credential.
- Added `runs`, `capabilities()`, `models()` and `health()` conveniences on the connection object without flattening or renaming Hermes-native control namespaces.
- Preserved low-level `createHermesClient*()` authentication options for direct Dashboard/gated/session-token integrations.
- Preserved `createApiServerApi()` for callers that intentionally need only the API Server surface.
- Removed the SDK-level assumption that API Server and control routes must be separate application URLs/listeners.
- Updated package scope/documentation to `@burner-io/hermes`.
- Added strict one-origin/Bearer transport tests covering control calls, API Server calls, native profile scoping and optional plugin probing.

## 0.5.0

- Added native Hermes API Server Runs HTTP/SSE support.
- Added native TUI Gateway JSON-RPC support over `/api/ws`.
- Added programmatic execution contracts while preserving the existing control-plane SDK.
