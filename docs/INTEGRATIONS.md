# Integration adapters — V0.4

V0.4 adds two optional integration subpaths. Neither changes Hermes contracts or invents Hermes domain concepts.

## `@tbachir/hermes/react-query`

This adapter has **no runtime import** from React or TanStack Query. It returns structural option objects (`queryKey`, `queryFn`, `mutationKey`, `mutationFn`) that can be passed directly to TanStack Query v5 APIs.

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createHermesReactQuery } from "@tbachir/hermes/react-query";

const queryClient = useQueryClient();
const hq = createHermesReactQuery(hermes, {
  scopeKey: "prod:designer",
  queryClient,
  staleTime: 5_000,
});

const status = useQuery(hq.queryOptions.system.status());
const sessions = useQuery(hq.queryOptions.sessions.list({ order: "recent" }));

const createTask = useMutation(hq.mutationOptions.kanban!.createTask());
```

`scopeKey` is deliberately app-owned cache metadata. It should be stable across SSR/hydration and distinguish Hermes instances/profiles sharing one QueryClient.

If a `queryClient` is supplied, mutation definitions invalidate only the relevant Hermes query-key roots. The adapter does not install global TanStack Query key registrations or hooks.

## `@tbachir/hermes/ai-sdk`

This subpath uses the Vercel AI SDK `tool()` + `jsonSchema()` APIs and has `ai >=6 <7` as an optional peer dependency.

```ts
import { createHermesAiTools } from "@tbachir/hermes/ai-sdk";

const tools = createHermesAiTools(hermes); // read-only by default
```

The adapter is intentionally **not an agent and not an orchestrator**. Every `execute()` delegates to one typed Hermes SDK method and returns the native Hermes payload unchanged.

### Default read-only tools

- `hermes_status`
- `hermes_profiles_list`
- `hermes_skills_list`
- `hermes_sessions_list`
- `hermes_session_get`
- `hermes_models_options`
- `hermes_mcp_servers`
- `hermes_cron_list`
- `hermes_analytics_usage`
- Kanban reads when the native plugin is present: board, task, boards, diagnostics

### Workflow mode

```ts
const tools = createHermesAiTools(hermes, {
  mode: "workflow",
  board: "product",
});
```

Workflow mode additionally exposes native Kanban mutations:

- create/update task
- comment
- parent-child link
- specify
- decompose
- dispatch

`dispatch` can start actual Hermes work. It is therefore never included in the default read-only tool set.

For tighter control, `include` overrides `mode`:

```ts
const tools = createHermesAiTools(hermes, {
  include: [
    "hermes_kanban_board",
    "hermes_kanban_task",
    "hermes_kanban_create_task",
  ],
});
```

If Kanban is not available on the connected Hermes instance, Kanban tool builders are omitted even if requested.

## Boundary rule

The integration adapters may define integration metadata (query keys, tool names, cache scope) because those are not Hermes domain concepts. They must never redefine `Profile`, `Skill`, `Session`, `Task`, `Board`, etc., and they must never normalize Hermes responses into an application model.
