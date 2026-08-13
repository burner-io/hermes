# Hermes native surface inventory — V0.3

Reviewed against `NousResearch/hermes-agent` `main` on 2026-08-13.

This inventory is deliberately organized by **Hermes-owned surfaces**, not by concepts from a consuming application.

## Coverage definition

V0.3 inventories and implements the native management/control surfaces visible through Hermes' official dashboard/Desktop clients, extracted FastAPI routers, request models, and Kanban plugin API.

The contracts cover REST resources and operations. V0.3 implements the reviewed HTTP/auth, multipart/download, WebSocket auth, and Kanban event-frame transport while keeping fast-moving payload internals open where Hermes itself is dynamic.

## Core/runtime

| Namespace | Native Hermes surface / routes | V0.3 |
|---|---|---|
| `auth` | `/api/auth/me`, `/api/auth/ws-ticket`, `/auth/logout` | Typed |
| `system` | `/api/status`, `/api/system/stats` | Typed + runtime |
| `gateway` | `/api/gateway/start`, `/stop`, `/restart`, `/drain` | Typed |
| `updates` | `/api/hermes/update`, `/api/hermes/update/check` | Typed |
| `logs` | `/api/logs` | Typed |
| `portal` | `/api/portal` | Typed + runtime |

## Configuration/providers/audio

| Namespace | Native Hermes surface / routes | V0.3 |
|---|---|---|
| `config` | `/api/config`, `/api/config/defaults`, `/api/config/schema`, `/api/config/raw` | Typed |
| `env` | `/api/env`, `/api/env/reveal` | Typed |
| `providers` | provider validation, custom endpoints, OAuth start/submit/poll/cancel | Typed |
| `models` | model info/options/set, auxiliary models, native MoA config | Typed |
| `audio` | transcribe, ElevenLabs voices, speak | Typed |
| audio stream | `/api/audio/speak-stream` WebSocket | Endpoint known; frame schema deferred |

## Profiles/skills/tools/MCP

| Namespace | Native Hermes surface / routes | V0.3 |
|---|---|---|
| `profiles` | list/create/active/rename/delete, setup command, SOUL, description, model, import/export | Typed |
| native Project values | current native per-profile Hermes Project data types | Types exported; no core dashboard API namespace claimed |
| `skills` | installed skills, toggle/content/create/edit + Skills Hub search/preview/scan/install/uninstall/update | Typed |
| `tools` | toolsets, providers, env, models, terminal backends, computer-use | Typed |
| `mcp` | servers, enable/test/remove, OAuth flow, catalog/install | Typed |

## Sessions/analytics/learning

| Namespace | Native Hermes surface / routes | V0.3 |
|---|---|---|
| `sessions` | list/search/detail/latest descendant/messages/update/delete/bulk delete/import/export/empty cleanup/stats/prune | Typed |
| `analytics` | `/api/analytics/usage`, `/api/analytics/models` | Usage typed; model-specific response open |
| `memory` | status/provider selection/reset/provider config/setup | Typed |
| `learning` | learning graph/node read/edit/delete | Typed/open where node payload is dynamic |
| `curator` | status/pause/run | Typed |

## Automation/channels/events

| Namespace | Native Hermes surface / routes | V0.3 |
|---|---|---|
| `cron` | jobs list/create/update/delete/pause/resume/trigger, delivery targets, blueprints | Typed |
| `messaging` | platforms update/test, Telegram and WhatsApp onboarding | Typed |
| `messaging.pairing` | list/approve/revoke/clear-pending | Typed |
| `webhooks` | list/enable/create/delete/per-route enabled toggle | Typed |
| `credentials` | credential pool list/add/delete | Typed |

## Coding/host operations

| Namespace | Native Hermes surface / routes | V0.3 |
|---|---|---|
| `filesystem.managed` | `/api/files*` | Typed; multipart stream input opaque |
| `filesystem.fs` | `/api/fs/list`, read/write text, data-url, git-root, default-cwd | Typed/open |
| `git` | status/worktrees/branches/review/diff/stage/commit/push/PR/worktree/branch switch | Request contracts typed; variable Git result payloads open |
| `operations` | doctor, security audit, prompt-size, dump, config-migrate, debug-share, backup/import, hooks, checkpoints | Typed/open |

## Dashboard/plugin management

| Namespace | Native Hermes surface / routes | V0.3 |
|---|---|---|
| `plugins` | dashboard plugin list/rescan/hub, agent plugin install/enable/disable/update/remove, providers, visibility | Typed/open |
| `dashboard` | dashboard themes and font preference | Typed/open |

## Hermes Kanban

`kanban` is kept as a native Hermes plugin surface. It preserves Hermes names and states:

`triage → todo → scheduled → ready → running → blocked → review → done → archived`

Typed areas include boards, tasks/details, comments, links, runs, workers, diagnostics, logs, orchestration, profile roster, estimates and native project linkage when present.

The Kanban event WebSocket is implemented in V0.3 with native ticket/token auth and the outer `{events,cursor}` frame preserved.

## Explicit non-contracts

The following are intentionally **not** introduced into `@tbachir/hermes` unless Hermes itself introduces them as native concepts:

- application project bindings
- references/catalog resources
- specs/user stories
- workflow definitions
- context packs
- application policies/capabilities
- application routing models

A consuming app may build those above the Hermes package.

## Raw fallback

A new or version-specific Hermes endpoint that is not yet represented by a typed namespace is not blocked:

```ts
await hermes.raw.request({
  method: "GET",
  path: "/api/some-new-hermes-surface",
});
```

That escape hatch is transport-level only; it does not authorize adding a made-up domain concept to the typed contracts.
