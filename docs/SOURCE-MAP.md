# Source map

Reviewed against `NousResearch/hermes-agent` `main` on 2026-08-13.

Hermes was moving during review, so this document records concrete source files/blob SHAs where available rather than pretending the entire audit came from one immutable repository commit.

| Contract area | Hermes source used | Observed blob SHA |
|---|---|---|
| Desktop-wide native response types | `apps/desktop/src/types/hermes.ts` | `2afe4e44a794e09ec55018991054bb447d864e1c` |
| Official Web dashboard API client + endpoint contracts | `web/src/lib/api.ts` | `02ff011945a7ce8799536c9dbb882b5b5a12d5ad` |
| Dashboard write/Pydantic models | `hermes_cli/web_models.py` | `3577ee312f2fd26dddf923a4e08407b4bb3eea42` |
| Dashboard server / non-extracted route declarations | `hermes_cli/web_server.py` | `701c5662d6c105d77634a9a721851b982a0de580` |
| Extracted Git router | `hermes_cli/web_routers/git.py` | `f788e86fe2aae66aa70ad76b64458d9bc46132b6` |
| Extracted session router | `hermes_cli/web_routers/sessions.py` | `5edf271bca1a64edd180ac0cf51f0d83bc5c19f1` |
| Kanban response types | `apps/desktop/src/plugins/kanban/types.ts` | `ef67db4c4670beac3fdc869d6cb416b179e3fd00` |
| Kanban Desktop REST usage | `apps/desktop/src/plugins/kanban/api.ts` | `16403bbc4ee0ee62a42c2b31e301d771b8cfd195` |
| Extracted profile management router | `hermes_cli/web_routers/profiles.py` | reviewed from `main` |
| Extracted Skill/Skills Hub router | `hermes_cli/web_routers/skills.py` | reviewed from `main` |
| Extracted MCP router | `hermes_cli/web_routers/mcp.py` | reviewed from `main` |
| Extracted tools router | `hermes_cli/web_routers/tools.py` | reviewed from `main` |
| Extracted cron router | `hermes_cli/web_routers/cron.py` | reviewed from `main` |
| Native Project persistence | `hermes_cli/projects_db.py` | reviewed from `main` |
| Native Project agent tools | `tools/project_tools.py` | reviewed from `main` |

## How sources are used

### Request contracts

Prefer Pydantic request models in `hermes_cli/web_models.py`, then official dashboard call payloads where a request is not modeled there.

### Response contracts

Prefer explicit official Desktop/Web client response types. Responses are normally additive (`[key: string]: unknown`) because Hermes evolves quickly.

### Route inventory

Use the official Web dashboard API client plus extracted FastAPI routers and the remaining route declarations in `web_server.py`.

### Kanban

Use the Kanban plugin's own backend/desktop types and API usage. The package does not reinterpret Kanban tasks as an application-level job/task abstraction.

## Known source divergence handling

When official clients temporarily disagree during active Hermes development, V0.3 avoids guessing:

- use a union/open field if both shapes are plausible,
- keep writes tied to the Pydantic model,
- mark fast-moving transport payloads `unknown`,
- retain `raw.request()` for forward compatibility.


## V0.3 transport-specific sources

| Runtime concern | Hermes source used | Observed blob SHA |
|---|---|---|
| Kanban REST + canonical WebSocket auth delegation | `plugins/kanban/dashboard/plugin_api.py` | `47077d939024a625ad526e312c6863fd707f4acd` |
| Desktop remote filesystem route usage | `apps/desktop/src/lib/desktop-fs.ts` | `a193fabfd939263b8c0e8cb60a8cd0156aa9ab4e` |
| Native remote file download route usage | `apps/desktop/src/lib/media.ts` | `33bcfbd963f823fd6f61a15ca7f363f56c005d47` |

V0.3 also re-reviewed the official Web dashboard client for the session-token header, cookie credentials, profile-scoped endpoint families, `/api/auth/ws-ticket`, multipart uploads, and management route paths.

### Deliberate removals from the V0.2 draft

Strict source review did not establish a public core dashboard `/api/projects`, `/api/health`, or dashboard egress-status route corresponding to the earlier draft methods. V0.3 therefore removes those client operations rather than guessing them. Native Project value types remain because the underlying Hermes concept exists; Kanban's own plugin `/projects` route remains separately available through `hermes.kanban.projects()`.

### Kanban V0.3 route corrections

The V0.3 runtime was rechecked against `plugins/kanban/dashboard/plugin_api.py`: task links use `POST /links` and `DELETE /links?parent_id=...&child_id=...`; live events accept `?since=<event_id>` and send `{events, cursor}` frames. Kanban create/update request contracts were tightened to the plugin's Pydantic bodies rather than preserving speculative write fields from the earlier draft.

## V0.5 programmatic execution sources

Reviewed on 2026-08-13 from current `NousResearch/hermes-agent` sources/documentation:

| Runtime concern | Hermes source used |
|---|---|
| Official protocol overview and API Server usage | `website/docs/developer-guide/programmatic-integration.md` |
| Browser TUI Gateway client and `/api/ws` semantics | `web/src/lib/gatewayClient.ts` |
| TUI Gateway prompt submission | `tui_gateway/methods_prompt.py` |
| TUI Gateway session lifecycle | `tui_gateway/methods_session.py` |
| API Server Runs HTTP/SSE implementation | current API Server routers/source referenced by the official integration guide |

V0.6 keeps control HTTP/WebSocket, TUI Gateway JSON-RPC and API Server HTTP/SSE as explicit typed seams, while `createHermesConnection()` lets trusted same-origin deployments feed control + API Server from one `baseUrl` and one Bearer `apiKey`.
