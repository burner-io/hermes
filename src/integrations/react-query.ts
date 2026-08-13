import type { HermesRuntimeClient } from "../runtime/types.js";

/**
 * TanStack Query compatible definitions without a runtime dependency on React
 * or @tanstack/react-query. The returned objects can be passed directly to
 * useQuery/useMutation/queryClient.prefetchQuery.
 */
export type HermesQueryKey = readonly unknown[];

export interface HermesQueryDefinition<TData> {
  queryKey: HermesQueryKey;
  queryFn: () => Promise<TData>;
  staleTime?: number;
}

export interface HermesMutationDefinition<TVariables, TData> {
  mutationKey: HermesQueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (...args: unknown[]) => Promise<void> | void;
}

export interface HermesQueryClientLike {
  invalidateQueries(input: { queryKey: HermesQueryKey }): Promise<unknown> | unknown;
}

export interface HermesReactQueryOptions {
  /** Stable discriminator for one Hermes instance/profile in a shared cache. */
  scopeKey?: string;
  /** Default stale time applied to read definitions. */
  staleTime?: number;
  /** Optional QueryClient-like object used to auto-invalidate mutation domains. */
  queryClient?: HermesQueryClientLike;
}

type SessionListInput = Parameters<HermesRuntimeClient["sessions"]["list"]>[0];
type SessionSearchInput = Parameters<HermesRuntimeClient["sessions"]["search"]>[0];
type SessionMessagesInput = Parameters<HermesRuntimeClient["sessions"]["messages"]>[1];
type ModelOptionsInput = Parameters<HermesRuntimeClient["models"]["options"]>[0];
type KanbanBoardInput = NonNullable<HermesRuntimeClient["kanban"]> extends { board(input?: infer T): unknown } ? T : never;

type AwaitedReturn<T extends (...args: never[]) => unknown> = Awaited<ReturnType<T>>;

function compact<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

export function createHermesQueryKeys(scopeKey = "default") {
  const root = ["hermes", scopeKey] as const;
  const domain = (name: string) => [...root, name] as const;

  return {
    root: () => root,
    surfaces: () => [...root, "surfaces"] as const,
    system: {
      root: () => domain("system"),
      status: () => [...domain("system"), "status"] as const,
      stats: () => [...domain("system"), "stats"] as const,
    },
    profiles: {
      root: () => domain("profiles"),
      list: () => [...domain("profiles"), "list"] as const,
      active: () => [...domain("profiles"), "active"] as const,
    },
    skills: {
      root: () => domain("skills"),
      list: (profile?: string) => [...domain("skills"), "list", profile ?? null] as const,
      content: (name: string, profile?: string) => [...domain("skills"), "content", name, profile ?? null] as const,
    },
    sessions: {
      root: () => domain("sessions"),
      list: (input?: SessionListInput) => [...domain("sessions"), "list", compact((input ?? {}) as Record<string, unknown>)] as const,
      search: (input: SessionSearchInput) => [...domain("sessions"), "search", compact(input as unknown as Record<string, unknown>)] as const,
      detail: (id: string, profile?: string) => [...domain("sessions"), "detail", id, profile ?? null] as const,
      messages: (id: string, input?: SessionMessagesInput) => [...domain("sessions"), "messages", id, compact((input ?? {}) as Record<string, unknown>)] as const,
      stats: (profile?: string) => [...domain("sessions"), "stats", profile ?? null] as const,
    },
    models: {
      root: () => domain("models"),
      info: (profile?: string) => [...domain("models"), "info", profile ?? null] as const,
      options: (input?: ModelOptionsInput) => [...domain("models"), "options", compact((input ?? {}) as Record<string, unknown>)] as const,
    },
    mcp: {
      root: () => domain("mcp"),
      servers: (profile?: string) => [...domain("mcp"), "servers", profile ?? null] as const,
    },
    cron: {
      root: () => domain("cron"),
      list: (profile?: string) => [...domain("cron"), "list", profile ?? null] as const,
      deliveryTargets: () => [...domain("cron"), "delivery-targets"] as const,
      blueprints: () => [...domain("cron"), "blueprints"] as const,
    },
    analytics: {
      root: () => domain("analytics"),
      usage: (input?: { days?: number; profile?: string }) => [...domain("analytics"), "usage", compact((input ?? {}) as Record<string, unknown>)] as const,
    },
    kanban: {
      root: () => domain("kanban"),
      board: (input?: KanbanBoardInput) => [...domain("kanban"), "board", compact((input ?? {}) as Record<string, unknown>)] as const,
      task: (id: string, board?: string) => [...domain("kanban"), "task", id, board ?? null] as const,
      boards: () => [...domain("kanban"), "boards"] as const,
      diagnostics: (board?: string) => [...domain("kanban"), "diagnostics", board ?? null] as const,
      stats: (board?: string) => [...domain("kanban"), "stats", board ?? null] as const,
    },
  };
}

function query<TData>(
  queryKey: HermesQueryKey,
  queryFn: () => Promise<TData>,
  staleTime?: number,
): HermesQueryDefinition<TData> {
  return staleTime === undefined ? { queryKey, queryFn } : { queryKey, queryFn, staleTime };
}

export function createHermesReactQuery(client: HermesRuntimeClient, options: HermesReactQueryOptions = {}) {
  const keys = createHermesQueryKeys(options.scopeKey);
  const staleTime = options.staleTime;
  const queryClient = options.queryClient;

  const invalidate = async (...queryKeys: HermesQueryKey[]) => {
    if (!queryClient) return;
    await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };

  const mutation = <TVariables, TData>(
    mutationKey: HermesQueryKey,
    mutationFn: (variables: TVariables) => Promise<TData>,
    invalidates: HermesQueryKey[] = [],
  ): HermesMutationDefinition<TVariables, TData> => {
    const base: HermesMutationDefinition<TVariables, TData> = { mutationKey, mutationFn };
    if (queryClient && invalidates.length > 0) {
      base.onSuccess = async () => invalidate(...invalidates);
    }
    return base;
  };

  const queryOptions = {
    surfaces: () => query(keys.surfaces(), () => client.surfaces(), staleTime),
    system: {
      status: () => query(keys.system.status(), () => client.system.status(), staleTime),
      stats: () => query(keys.system.stats(), () => client.system.stats(), staleTime),
    },
    profiles: {
      list: () => query(keys.profiles.list(), () => client.profiles.list(), staleTime),
      active: () => query(keys.profiles.active(), () => client.profiles.active(), staleTime),
    },
    skills: {
      list: (profile?: string) => query(keys.skills.list(profile), () => client.skills.list(profile), staleTime),
      content: (name: string, profile?: string) => query(keys.skills.content(name, profile), () => client.skills.content(name, profile), staleTime),
    },
    sessions: {
      list: (input: SessionListInput = {}) => query(keys.sessions.list(input), () => client.sessions.list(input), staleTime),
      search: (input: SessionSearchInput) => query(keys.sessions.search(input), () => client.sessions.search(input), staleTime),
      detail: (id: string, profile?: string) => query(keys.sessions.detail(id, profile), () => client.sessions.detail(id, profile), staleTime),
      messages: (id: string, input: SessionMessagesInput = {}) => query(keys.sessions.messages(id, input), () => client.sessions.messages(id, input), staleTime),
      stats: (profile?: string) => query(keys.sessions.stats(profile), () => client.sessions.stats(profile), staleTime),
    },
    models: {
      info: (profile?: string) => query(keys.models.info(profile), () => client.models.info(profile), staleTime),
      options: (input: ModelOptionsInput = {}) => query(keys.models.options(input), () => client.models.options(input), staleTime),
    },
    mcp: {
      servers: (profile?: string) => query(keys.mcp.servers(profile), () => client.mcp.servers(profile), staleTime),
    },
    cron: {
      list: (profile?: string) => query(keys.cron.list(profile), () => client.cron.list(profile), staleTime),
      deliveryTargets: () => query(keys.cron.deliveryTargets(), () => client.cron.deliveryTargets(), staleTime),
      blueprints: () => query(keys.cron.blueprints(), () => client.cron.blueprints(), staleTime),
    },
    analytics: {
      usage: (input: { days?: number; profile?: string } = {}) => query(keys.analytics.usage(input), () => client.analytics.usage(input), staleTime),
    },
    ...(client.kanban
      ? {
          kanban: {
            board: (input: KanbanBoardInput = {}) => query(keys.kanban.board(input), () => client.kanban!.board(input), staleTime),
            task: (id: string, board?: string) => query(keys.kanban.task(id, board), () => client.kanban!.task(id, board), staleTime),
            boards: () => query(keys.kanban.boards(), () => client.kanban!.boards(), staleTime),
            diagnostics: (board?: string) => query(keys.kanban.diagnostics(board), () => client.kanban!.diagnostics(board), staleTime),
            stats: (board?: string) => query(keys.kanban.stats(board), () => client.kanban!.stats(board), staleTime),
          },
        }
      : {}),
  };

  const mutationOptions = {
    profiles: {
      create: () => mutation(
        [...keys.profiles.root(), "create"],
        (input: Parameters<typeof client.profiles.create>[0]) => client.profiles.create(input),
        [keys.profiles.root()],
      ),
      setActive: () => mutation(
        [...keys.profiles.root(), "set-active"],
        (name: string) => client.profiles.setActive(name),
        [keys.profiles.root(), keys.sessions.root(), keys.skills.root(), keys.models.root()],
      ),
    },
    skills: {
      toggle: () => mutation(
        [...keys.skills.root(), "toggle"],
        (input: Parameters<typeof client.skills.toggle>[0]) => client.skills.toggle(input),
        [keys.skills.root()],
      ),
      create: () => mutation(
        [...keys.skills.root(), "create"],
        (input: Parameters<typeof client.skills.create>[0]) => client.skills.create(input),
        [keys.skills.root()],
      ),
    },
    sessions: {
      update: () => mutation(
        [...keys.sessions.root(), "update"],
        (input: { id: string; patch: Parameters<typeof client.sessions.update>[1] }) => client.sessions.update(input.id, input.patch),
        [keys.sessions.root()],
      ),
      remove: () => mutation(
        [...keys.sessions.root(), "remove"],
        (input: { id: string; profile?: string }) => client.sessions.remove(input.id, input.profile),
        [keys.sessions.root()],
      ),
    },
    models: {
      set: () => mutation(
        [...keys.models.root(), "set"],
        (input: Parameters<typeof client.models.set>[0]) => client.models.set(input),
        [keys.models.root(), keys.system.root()],
      ),
    },
    cron: {
      create: () => mutation(
        [...keys.cron.root(), "create"],
        (input: { job: Parameters<typeof client.cron.create>[0]; profile?: string }) => client.cron.create(input.job, input.profile),
        [keys.cron.root()],
      ),
      update: () => mutation(
        [...keys.cron.root(), "update"],
        (input: { id: string; patch: Parameters<typeof client.cron.update>[1]; profile?: string }) => client.cron.update(input.id, input.patch, input.profile),
        [keys.cron.root()],
      ),
      trigger: () => mutation(
        [...keys.cron.root(), "trigger"],
        (input: { id: string; profile?: string }) => client.cron.trigger(input.id, input.profile),
        [keys.cron.root(), keys.sessions.root()],
      ),
    },
    ...(client.kanban
      ? {
          kanban: {
            createTask: () => mutation(
              [...keys.kanban.root(), "create-task"],
              (input: { task: Parameters<NonNullable<typeof client.kanban>["createTask"]>[0]; board?: string }) => client.kanban!.createTask(input.task, input.board),
              [keys.kanban.root()],
            ),
            updateTask: () => mutation(
              [...keys.kanban.root(), "update-task"],
              (input: { id: string; patch: Parameters<NonNullable<typeof client.kanban>["updateTask"]>[1]; board?: string }) => client.kanban!.updateTask(input.id, input.patch, input.board),
              [keys.kanban.root()],
            ),
            addComment: () => mutation(
              [...keys.kanban.root(), "add-comment"],
              (input: { id: string; body: string; author?: string; board?: string }) => client.kanban!.addComment(input.id, { body: input.body, ...(input.author ? { author: input.author } : {}) }, input.board),
              [keys.kanban.root()],
            ),
            link: () => mutation(
              [...keys.kanban.root(), "link"],
              (input: { parent_id: string; child_id: string; board?: string }) => client.kanban!.link(input.parent_id, input.child_id, input.board),
              [keys.kanban.root()],
            ),
            dispatch: () => mutation(
              [...keys.kanban.root(), "dispatch"],
              (input: { board?: string; dry_run?: boolean; max?: number }) => client.kanban!.dispatch(input.board, compact({ dry_run: input.dry_run, max: input.max })),
              [keys.kanban.root(), keys.sessions.root()],
            ),
          },
        }
      : {}),
  };

  return {
    keys,
    queryOptions,
    mutationOptions,
    invalidate: {
      all: () => invalidate(keys.root()),
      profiles: () => invalidate(keys.profiles.root()),
      skills: () => invalidate(keys.skills.root()),
      sessions: () => invalidate(keys.sessions.root()),
      models: () => invalidate(keys.models.root()),
      cron: () => invalidate(keys.cron.root()),
      kanban: () => invalidate(keys.kanban.root()),
    },
  };
}

export type HermesReactQueryAdapter = ReturnType<typeof createHermesReactQuery>;
