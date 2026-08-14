import { jsonSchema, tool, type ToolSet } from "ai";
import type {
  HermesKanbanCreateTaskRequest,
  HermesKanbanTaskStatus,
  HermesKanbanUpdateTaskRequest,
} from "../contracts/kanban.js";
import type { HermesRuntimeClient } from "../runtime/types.js";

export const HERMES_AI_READ_TOOL_NAMES = [
  "hermes_status",
  "hermes_profiles_list",
  "hermes_skills_list",
  "hermes_sessions_list",
  "hermes_session_get",
  "hermes_models_options",
  "hermes_mcp_servers",
  "hermes_cron_list",
  "hermes_analytics_usage",
  "hermes_kanban_board",
  "hermes_kanban_task",
  "hermes_kanban_boards",
  "hermes_kanban_diagnostics",
] as const;

export const HERMES_AI_WORKFLOW_TOOL_NAMES = [
  "hermes_kanban_create_task",
  "hermes_kanban_update_task",
  "hermes_kanban_comment",
  "hermes_kanban_link",
  "hermes_kanban_specify",
  "hermes_kanban_decompose",
  "hermes_kanban_dispatch",
] as const;

export type HermesAiReadToolName = (typeof HERMES_AI_READ_TOOL_NAMES)[number];
export type HermesAiWorkflowToolName = (typeof HERMES_AI_WORKFLOW_TOOL_NAMES)[number];
export type HermesAiToolName = HermesAiReadToolName | HermesAiWorkflowToolName;

export interface HermesAiToolsOptions {
  /** Default is read-only. workflow adds explicit Kanban mutation/dispatch tools. */
  mode?: "read-only" | "workflow";
  /** Exact tool selection. When present it overrides mode. */
  include?: readonly HermesAiToolName[];
  /** Default native Hermes profile passed only to operations whose API accepts it. */
  profile?: string;
  /** Default Kanban board for Kanban tools; each call may override it. */
  board?: string;
}

type JsonObject = Record<string, unknown>;

function objectSchema(
  properties: Record<string, unknown>,
  required: string[] = [],
  additionalProperties = false,
) {
  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
    additionalProperties,
  } as const;
}

const string = (description?: string) => ({ type: "string", ...(description ? { description } : {}) } as const);
const nullableString = (description?: string) => ({ type: ["string", "null"], ...(description ? { description } : {}) } as const);
const integer = (description?: string) => ({ type: "integer", ...(description ? { description } : {}) } as const);
const boolean = (description?: string) => ({ type: "boolean", ...(description ? { description } : {}) } as const);
const stringArray = (description?: string) => ({ type: "array", items: { type: "string" }, ...(description ? { description } : {}) } as const);

function profileFrom(input: { profile?: string }, fallback?: string): string | undefined {
  return input.profile?.trim() || fallback?.trim() || undefined;
}

function boardFrom(input: { board?: string }, fallback?: string): string | undefined {
  return input.board?.trim() || fallback?.trim() || undefined;
}

function clean<T extends JsonObject>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

function cleanAs<T extends object>(value: JsonObject): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function requestedNames(options: HermesAiToolsOptions): readonly HermesAiToolName[] {
  if (options.include) return options.include;
  return options.mode === "workflow"
    ? [...HERMES_AI_READ_TOOL_NAMES, ...HERMES_AI_WORKFLOW_TOOL_NAMES]
    : HERMES_AI_READ_TOOL_NAMES;
}

/**
 * AI SDK tool adapter for native Hermes operations.
 *
 * There is no agent/orchestrator here: execute() delegates directly to the
 * supplied Hermes client and returns the native Hermes payload unchanged.
 * Mutating workflow tools are opt-in through mode:"workflow" or include[].
 */
export function createHermesAiTools(
  client: HermesRuntimeClient,
  options: HermesAiToolsOptions = {},
): ToolSet {
  const builders: Partial<Record<HermesAiToolName, () => unknown>> = {
    hermes_status: () => tool({
      description: "Read the connected Hermes status, version, gateway state, platform state, and active session count.",
      inputSchema: jsonSchema<Record<string, never>>(objectSchema({})),
      execute: async () => client.system.status(),
    }),

    hermes_profiles_list: () => tool({
      description: "List native Hermes profiles and their configured model/provider and skill count.",
      inputSchema: jsonSchema<Record<string, never>>(objectSchema({})),
      execute: async () => client.profiles.list(),
    }),

    hermes_skills_list: () => tool({
      description: "List native Hermes skills for a profile, including enabled state, provenance, and usage when available.",
      inputSchema: jsonSchema<{ profile?: string }>(objectSchema({ profile: string("Hermes profile name. Omit to use the client's native profile scope.") })),
      execute: async (input) => client.skills.list(profileFrom(input, options.profile)),
    }),

    hermes_sessions_list: () => tool({
      description: "List Hermes sessions with native pagination, archive, ordering, source, and workspace filters.",
      inputSchema: jsonSchema<{
        limit?: number; offset?: number; min_messages?: number; archived?: "exclude" | "only" | "include";
        order?: "created" | "recent"; profile?: string; source?: string; sources?: string;
        exclude_sources?: string; cwd_prefix?: string; full?: boolean;
      }>(objectSchema({
        limit: integer("Maximum rows to return."),
        offset: integer("Pagination offset."),
        min_messages: integer("Minimum message count."),
        archived: { type: "string", enum: ["exclude", "only", "include"] },
        order: { type: "string", enum: ["created", "recent"] },
        profile: string("Hermes profile name."),
        source: string("Single source filter."),
        sources: string("Comma-separated source filters, matching the native Hermes API."),
        exclude_sources: string("Comma-separated sources to exclude."),
        cwd_prefix: string("Workspace path prefix."),
        full: boolean("Request full rows rather than compact list rows."),
      })),
      execute: async (input) => client.sessions.list(cleanAs<NonNullable<Parameters<typeof client.sessions.list>[0]>>({
        ...input,
        profile: profileFrom(input, options.profile),
      })),
    }),

    hermes_session_get: () => tool({
      description: "Read one native Hermes session by id or unique id prefix.",
      inputSchema: jsonSchema<{ session_id: string; profile?: string }>(objectSchema({
        session_id: string("Hermes session id or unique prefix."),
        profile: string("Hermes profile that owns the session."),
      }, ["session_id"])),
      execute: async (input) => client.sessions.detail(input.session_id, profileFrom(input, options.profile)),
    }),

    hermes_models_options: () => tool({
      description: "Read Hermes model/provider options and optional pricing/capability metadata.",
      inputSchema: jsonSchema<{ profile?: string; pricing?: boolean; capabilities?: boolean; include_unconfigured?: boolean }>(objectSchema({
        profile: string("Hermes profile name."),
        pricing: boolean("Include model pricing where Hermes can provide it."),
        capabilities: boolean("Include per-model capabilities."),
        include_unconfigured: boolean("Include providers not yet configured."),
      })),
      execute: async (input) => client.models.options(cleanAs<NonNullable<Parameters<typeof client.models.options>[0]>>({
        ...input,
        profile: profileFrom(input, options.profile),
      })),
    }),

    hermes_mcp_servers: () => tool({
      description: "List MCP servers configured in Hermes for a profile.",
      inputSchema: jsonSchema<{ profile?: string }>(objectSchema({ profile: string("Hermes profile name.") })),
      execute: async (input) => client.mcp.servers(profileFrom(input, options.profile)),
    }),

    hermes_cron_list: () => tool({
      description: "List native Hermes cron jobs. Hermes cron has its own profile parameter semantics.",
      inputSchema: jsonSchema<{ profile?: string }>(objectSchema({ profile: string("Cron profile, e.g. default or all, as accepted by Hermes.") })),
      execute: async (input) => client.cron.list(profileFrom(input, options.profile)),
    }),

    hermes_analytics_usage: () => tool({
      description: "Read Hermes usage analytics including tokens, cost, sessions, skills, and tools when available.",
      inputSchema: jsonSchema<{ days?: number; profile?: string }>(objectSchema({
        days: integer("Number of days to aggregate."),
        profile: string("Hermes profile name."),
      })),
      execute: async (input) => client.analytics.usage(cleanAs<NonNullable<Parameters<typeof client.analytics.usage>[0]>>({
        ...input,
        profile: profileFrom(input, options.profile),
      })),
    }),
  };

  if (client.kanban) {
    builders.hermes_kanban_board = () => tool({
      description: "Read a Hermes Kanban board grouped by native task status columns.",
      inputSchema: jsonSchema<{ board?: string; tenant?: string; include_archived?: boolean; workflow_template_id?: string; current_step_key?: string }>(objectSchema({
        board: string("Kanban board slug."),
        tenant: string("Tenant filter."),
        include_archived: boolean("Include archived tasks."),
        workflow_template_id: string("Workflow template filter."),
        current_step_key: string("Current workflow step filter."),
      })),
      execute: async (input) => client.kanban!.board(cleanAs<NonNullable<Parameters<NonNullable<typeof client.kanban>["board"]>[0]>>({
        ...input,
        board: boardFrom(input, options.board),
      })),
    });

    builders.hermes_kanban_task = () => tool({
      description: "Read full native Hermes Kanban task detail including comments, events, attachments, links, and runs.",
      inputSchema: jsonSchema<{ task_id: string; board?: string }>(objectSchema({
        task_id: string("Hermes Kanban task id."),
        board: string("Kanban board slug."),
      }, ["task_id"])),
      execute: async (input) => client.kanban!.task(input.task_id, boardFrom(input, options.board)),
    });

    builders.hermes_kanban_boards = () => tool({
      description: "List Hermes Kanban boards and the current board.",
      inputSchema: jsonSchema<Record<string, never>>(objectSchema({})),
      execute: async () => client.kanban!.boards(),
    });

    builders.hermes_kanban_diagnostics = () => tool({
      description: "Read Hermes Kanban diagnostics for active tasks on a board.",
      inputSchema: jsonSchema<{ board?: string }>(objectSchema({ board: string("Kanban board slug.") })),
      execute: async (input) => client.kanban!.diagnostics(boardFrom(input, options.board)),
    });

    builders.hermes_kanban_create_task = () => tool({
      description: "Create a native Hermes Kanban task. This is a mutation and is only exposed when explicitly enabled.",
      inputSchema: jsonSchema<HermesKanbanCreateTaskRequest & { board?: string }>(objectSchema({
        title: string("Task title."),
        body: nullableString("Task body."),
        assignee: nullableString("Hermes profile/assignee."),
        tenant: nullableString("Tenant."),
        priority: integer("Task priority."),
        workspace_kind: string("Hermes Kanban workspace kind."),
        workspace_path: nullableString("Workspace path."),
        parents: stringArray("Parent task ids."),
        triage: boolean("Create in triage."),
        idempotency_key: nullableString("Hermes Kanban idempotency key."),
        max_runtime_seconds: integer("Maximum worker runtime."),
        skills: stringArray("Per-task skill list."),
        goal_mode: boolean("Enable Hermes goal mode."),
        goal_max_turns: integer("Goal-mode maximum turns."),
        model_override: nullableString("Per-task model override."),
        provider_override: nullableString("Per-task provider override."),
        reasoning_effort: nullableString("Per-task reasoning effort."),
        project_id: nullableString("Native Hermes project id when supported by this Kanban version."),
        board: string("Kanban board slug."),
      }, ["title"])),
      execute: async (input) => {
        const { board, ...taskInput } = input;
        return client.kanban!.createTask(taskInput, boardFrom(board === undefined ? {} : { board }, options.board));
      },
    });

    builders.hermes_kanban_update_task = () => tool({
      description: "Update a native Hermes Kanban task using the plugin's actual PATCH semantics.",
      inputSchema: jsonSchema<HermesKanbanUpdateTaskRequest & { task_id: string; board?: string }>(objectSchema({
        task_id: string("Task id."),
        board: string("Kanban board slug."),
        status: { type: "string", enum: ["triage", "todo", "scheduled", "ready", "blocked", "review", "done", "archived"] satisfies HermesKanbanTaskStatus[] },
        assignee: nullableString("Assignee; null clears where Hermes permits it."),
        priority: integer("Priority."),
        title: nullableString("Title."),
        body: nullableString("Body."),
        result: nullableString("Completion result."),
        block_reason: nullableString("Block/schedule reason."),
        summary: nullableString("Structured handoff summary."),
        metadata: { type: ["object", "null"], additionalProperties: true },
        model_override: nullableString("Per-task model override."),
        provider_override: nullableString("Per-task provider override."),
        clear_model_override: boolean("Clear task model/provider override."),
        reasoning_effort: nullableString("Per-task reasoning effort."),
        clear_reasoning_effort: boolean("Clear per-task reasoning effort."),
      }, ["task_id"])),
      execute: async (input) => {
        const { task_id, board, ...patch } = input;
        return client.kanban!.updateTask(task_id, patch, boardFrom(board === undefined ? {} : { board }, options.board));
      },
    });

    builders.hermes_kanban_comment = () => tool({
      description: "Add a comment to a native Hermes Kanban task.",
      inputSchema: jsonSchema<{ task_id: string; body: string; author?: string; board?: string }>(objectSchema({
        task_id: string("Task id."), body: string("Comment body."), author: string("Comment author."), board: string("Kanban board slug."),
      }, ["task_id", "body"])),
      execute: async (input) => client.kanban!.addComment(
        input.task_id,
        { body: input.body, ...(input.author ? { author: input.author } : {}) },
        boardFrom(input, options.board),
      ),
    });

    builders.hermes_kanban_link = () => tool({
      description: "Create a native Hermes Kanban parent-child task link.",
      inputSchema: jsonSchema<{ parent_id: string; child_id: string; board?: string }>(objectSchema({
        parent_id: string("Parent task id."), child_id: string("Child task id."), board: string("Kanban board slug."),
      }, ["parent_id", "child_id"])),
      execute: async (input) => client.kanban!.link(input.parent_id, input.child_id, boardFrom(input, options.board)),
    });

    builders.hermes_kanban_specify = () => tool({
      description: "Ask the Hermes Kanban plugin to specify a task using its native operation.",
      inputSchema: jsonSchema<{ task_id: string; author?: string; board?: string }>(objectSchema({
        task_id: string("Task id."), author: string("Author label."), board: string("Kanban board slug."),
      }, ["task_id"])),
      execute: async (input) => client.kanban!.specify(
        input.task_id,
        input.author ? { author: input.author } : {},
        boardFrom(input, options.board),
      ),
    });

    builders.hermes_kanban_decompose = () => tool({
      description: "Ask the Hermes Kanban plugin to decompose a task into native child tasks.",
      inputSchema: jsonSchema<{ task_id: string; author?: string; board?: string }>(objectSchema({
        task_id: string("Task id."), author: string("Author label."), board: string("Kanban board slug."),
      }, ["task_id"])),
      execute: async (input) => client.kanban!.decompose(
        input.task_id,
        input.author ? { author: input.author } : {},
        boardFrom(input, options.board),
      ),
    });

    builders.hermes_kanban_dispatch = () => tool({
      description: "Run the native Hermes Kanban dispatcher. This can start work; expose it only in an intentional workflow toolset.",
      inputSchema: jsonSchema<{ board?: string; dry_run?: boolean; max?: number }>(objectSchema({
        board: string("Kanban board slug."), dry_run: boolean("Only report what would be dispatched."), max: integer("Maximum tasks to dispatch."),
      })),
      execute: async (input) => client.kanban!.dispatch(
        boardFrom(input, options.board),
        clean({ dry_run: input.dry_run, max: input.max }),
      ),
    });
  }

  const selected: ToolSet = {};
  for (const name of requestedNames(options)) {
    const build = builders[name];
    if (build) selected[name] = build() as ToolSet[string];
  }
  return selected;
}
