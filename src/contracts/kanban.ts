export type HermesKanbanTaskStatus =
  | "triage"
  | "todo"
  | "scheduled"
  | "ready"
  | "running"
  | "blocked"
  | "review"
  | "done"
  | "archived";

export interface HermesKanbanTask {
  id: string;
  title: string;
  body?: string | null;
  status: HermesKanbanTaskStatus | string;
  assignee?: string | null;
  priority?: number;
  tenant?: string | null;
  created_at?: number;
  latest_summary?: string | null;
  comment_count?: number;
  link_counts?: { parents: number; children: number };
  progress?: { done: number; total: number } | null;
  warnings?: { count: number; highest_severity?: string | null } | null;
  started_at?: number | null;
  worker_pid?: number | null;
  last_heartbeat_at?: number | null;
  [key: string]: unknown;
}

export interface HermesKanbanColumn {
  name: string;
  tasks: HermesKanbanTask[];
  [key: string]: unknown;
}

export interface HermesKanbanBoard {
  columns: HermesKanbanColumn[];
  tenants: string[];
  assignees: string[];
  latest_event_id: number;
  now: number;
  [key: string]: unknown;
}

export interface HermesKanbanDiagnosticAction {
  kind: string;
  label: string;
  payload?: Record<string, unknown>;
  suggested?: boolean;
  [key: string]: unknown;
}

export interface HermesKanbanDiagnostic {
  kind: string;
  severity: "critical" | "error" | "warning";
  title: string;
  detail: string;
  actions: HermesKanbanDiagnosticAction[];
  count: number;
  last_seen_at: number;
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HermesKanbanRun {
  id: number | string;
  profile?: string | null;
  status: string;
  outcome?: string | null;
  summary?: string | null;
  error?: string | null;
  metadata?: Record<string, unknown> | string | null;
  worker_pid?: number | null;
  started_at?: number | null;
  ended_at?: number | null;
  [key: string]: unknown;
}

export interface HermesKanbanComment {
  id: number | string;
  author: string;
  body: string;
  created_at: number;
  [key: string]: unknown;
}

export interface HermesKanbanEvent {
  id: number;
  kind: string;
  payload: unknown;
  created_at: number;
  task_id?: string;
  [key: string]: unknown;
}

export interface HermesKanbanAttachment {
  id: number | string;
  filename: string;
  size?: number | null;
  [key: string]: unknown;
}

export interface HermesKanbanTaskFull extends HermesKanbanTask {
  result?: string | null;
  created_by?: string | null;
  model_override?: string | null;
  provider_override?: string | null;
  reasoning_effort?: string | null;
  completed_at?: number | null;
  last_failure_error?: string | null;
  workspace_kind?: string | null;
  workspace_path?: string | null;
  branch_name?: string | null;
  consecutive_failures?: number;
  diagnostics?: HermesKanbanDiagnostic[];
}

export interface HermesKanbanTaskDetail {
  task: HermesKanbanTaskFull;
  comments: HermesKanbanComment[];
  events: HermesKanbanEvent[];
  attachments: HermesKanbanAttachment[];
  links: { parents: string[]; children: string[] };
  runs: HermesKanbanRun[];
  [key: string]: unknown;
}

export interface HermesKanbanBoardMeta {
  slug: string;
  name?: string | null;
  description?: string | null;
  is_current?: boolean;
  total?: number;
  default_workdir?: string | null;
  default_workspace_kind?: string | null;
  project_id?: string | null;
  project_name?: string | null;
  [key: string]: unknown;
}

export interface HermesKanbanBoardsResponse {
  boards: HermesKanbanBoardMeta[];
  current: string;
  [key: string]: unknown;
}

export interface HermesKanbanProfile {
  name: string;
  is_default: boolean;
  description: string;
  description_auto: boolean;
  [key: string]: unknown;
}

export interface HermesKanbanProject {
  id: string;
  slug: string;
  name: string;
  primary_path?: string | null;
  icon?: string | null;
  color?: string | null;
  [key: string]: unknown;
}

export interface HermesKanbanOrchestrationSettings {
  orchestrator_profile: string;
  default_assignee: string;
  auto_decompose: boolean;
  auto_promote_children?: boolean;
  resolved_orchestrator_profile: string;
  resolved_default_assignee: string;
  [key: string]: unknown;
}

export interface HermesKanbanTaskEstimate {
  ok: boolean;
  reason?: string | null;
  est_tokens?: number;
  complexity?: "L" | "M" | "S" | null;
  rationale?: string | null;
  model?: string | null;
  [key: string]: unknown;
}

export interface HermesKanbanWorkerLog {
  exists: boolean;
  size_bytes: number;
  content: string;
  truncated: boolean;
  [key: string]: unknown;
}

export interface HermesKanbanActiveWorker {
  run_id: number | string;
  task_id: string;
  task_title?: string;
  task_status?: string;
  task_assignee?: string | null;
  profile?: string | null;
  worker_pid?: number | null;
  started_at?: number | null;
  claim_lock?: string | null;
  claim_expires?: number | null;
  last_heartbeat_at?: number | null;
  max_runtime_seconds?: number | null;
  [key: string]: unknown;
}

export interface HermesKanbanActiveWorkersResponse {
  workers: HermesKanbanActiveWorker[];
  count: number;
  checked_at: number;
  [key: string]: unknown;
}

export interface HermesKanbanCreateTaskRequest {
  title: string;
  body?: string | null;
  assignee?: string | null;
  tenant?: string | null;
  priority?: number;
  workspace_kind?: string;
  workspace_path?: string | null;
  parents?: string[];
  triage?: boolean;
  idempotency_key?: string | null;
  max_runtime_seconds?: number | null;
  skills?: string[] | null;
  goal_mode?: boolean;
  goal_max_turns?: number | null;
  model_override?: string | null;
  provider_override?: string | null;
  reasoning_effort?: string | null;
  project_id?: string | null;
}

export interface HermesKanbanUpdateTaskRequest {
  status?: HermesKanbanTaskStatus;
  assignee?: string | null;
  priority?: number;
  title?: string | null;
  body?: string | null;
  result?: string | null;
  block_reason?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  model_override?: string | null;
  provider_override?: string | null;
  clear_model_override?: boolean;
  reasoning_effort?: string | null;
  clear_reasoning_effort?: boolean;
}

export interface HermesKanbanBulkTaskRequest {
  ids: string[];
  status?: HermesKanbanTaskStatus | null;
  assignee?: string | null;
  priority?: number | null;
  archive?: boolean;
  result?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  reclaim_first?: boolean;
  model_override?: string | null;
  provider_override?: string | null;
  clear_model_override?: boolean;
  reasoning_effort?: string | null;
  clear_reasoning_effort?: boolean;
}

export interface HermesKanbanCreateBoardRequest {
  slug: string;
  name?: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  default_workdir?: string | null;
  project_id?: string | null;
  switch?: boolean;
}

export interface HermesKanbanUpdateBoardRequest {
  name?: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  default_workdir?: string | null;
  project_id?: string | null;
}

export interface HermesKanbanBoardQuery {
  board?: string;
  tenant?: string;
  include_archived?: boolean;
  workflow_template_id?: string;
  current_step_key?: string;
}

export interface HermesKanbanApi {
  board(input?: HermesKanbanBoardQuery): Promise<HermesKanbanBoard>;
  task(id: string, board?: string): Promise<HermesKanbanTaskDetail>;
  createTask(input: HermesKanbanCreateTaskRequest, board?: string): Promise<{ task: HermesKanbanTask | null; warning?: string }>;
  updateTask(id: string, input: HermesKanbanUpdateTaskRequest, board?: string): Promise<unknown>;
  bulkTasks(input: HermesKanbanBulkTaskRequest, board?: string): Promise<{ results: Array<{ id: string; ok: boolean; error?: string }>; [key: string]: unknown }>;
  deleteTask(id: string, board?: string): Promise<unknown>;
  addComment(id: string, body: { body: string; author?: string }, board?: string): Promise<unknown>;
  link(parent_id: string, child_id: string, board?: string): Promise<unknown>;
  unlink(parent_id: string, child_id: string, board?: string): Promise<unknown>;
  specify(id: string, input?: { author?: string }, board?: string): Promise<unknown>;
  decompose(id: string, input?: { author?: string }, board?: string): Promise<unknown>;
  dispatch(board?: string, input?: { dry_run?: boolean; max?: number }): Promise<{ spawned?: unknown[]; [key: string]: unknown }>;
  boards(): Promise<HermesKanbanBoardsResponse>;
  createBoard(input: HermesKanbanCreateBoardRequest): Promise<{ board: HermesKanbanBoardMeta }>;
  updateBoard(slug: string, input: HermesKanbanUpdateBoardRequest): Promise<{ board: HermesKanbanBoardMeta }>;
  deleteBoard(slug: string): Promise<unknown>;
  switchBoard(slug: string): Promise<unknown>;
  profiles(): Promise<{ profiles: HermesKanbanProfile[] }>;
  projects(): Promise<{ projects: HermesKanbanProject[] }>;
  orchestration(): Promise<HermesKanbanOrchestrationSettings>;
  updateOrchestration(input: Partial<HermesKanbanOrchestrationSettings>): Promise<HermesKanbanOrchestrationSettings>;
  activeWorkers(board?: string): Promise<HermesKanbanActiveWorkersResponse>;
  run(runId: number | string, board?: string): Promise<unknown>;
  inspectRun(runId: number | string, board?: string): Promise<unknown>;
  terminateRun(runId: number | string, input?: { reason?: string }, board?: string): Promise<unknown>;
  reclaimTask(id: string, input?: { reason?: string }, board?: string): Promise<unknown>;
  reassignTask(id: string, input: { profile?: string; reclaim_first?: boolean; reason?: string }, board?: string): Promise<unknown>;
  log(id: string, input?: { tail?: number }, board?: string): Promise<HermesKanbanWorkerLog>;
  diagnostics(board?: string): Promise<unknown>;
  stats(board?: string): Promise<unknown>;
  modelOptions(): Promise<unknown>;
  estimateTask(id: string, board?: string): Promise<HermesKanbanTaskEstimate>;
  estimate(input: { title: string; body?: string }): Promise<HermesKanbanTaskEstimate>;
}
