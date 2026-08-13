export interface HermesUsageStats {
  calls: number;
  context_max?: number;
  context_percent?: number;
  context_used?: number;
  cost_usd?: number;
  input: number;
  output: number;
  total: number;
  [key: string]: unknown;
}

export interface HermesSessionRuntimeInfo {
  approval_mode?: "manual" | "off" | "smart";
  branch?: string;
  config_warning?: string;
  credential_warning?: string;
  cwd?: string;
  desktop_contract?: number;
  fast?: boolean;
  install_warning?: string;
  model?: string;
  personality?: string;
  provider?: string;
  reasoning_effort?: string;
  running?: boolean;
  service_tier?: string;
  skills?: Record<string, string[]> | string[];
  tools?: Record<string, string[]>;
  usage?: Partial<HermesUsageStats>;
  version?: string;
  yolo?: boolean;
  [key: string]: unknown;
}

export interface HermesSessionInfo {
  archived?: boolean;
  cwd?: string | null;
  git_branch?: string | null;
  git_repo_root?: string | null;
  ended_at: number | null;
  id: string;
  _lineage_root_id?: string | null;
  input_tokens: number;
  actual_cost_usd?: number | null;
  estimated_cost_usd?: number | null;
  is_active: boolean;
  last_active: number;
  message_count: number;
  model: string | null;
  output_tokens: number;
  parent_session_id?: string | null;
  pinned?: boolean;
  preview: string | null;
  source: string | null;
  started_at: number;
  title: string | null;
  tool_call_count: number;
  handoff_platform?: string | null;
  handoff_state?: string | null;
  handoff_error?: string | null;
  profile?: string;
  is_default_profile?: boolean;
  [key: string]: unknown;
}

export interface HermesPaginatedSessions {
  limit: number;
  offset: number;
  sessions: HermesSessionInfo[];
  total: number;
  profile_totals?: Record<string, number>;
  errors?: Array<{ profile: string; error: string }>;
  [key: string]: unknown;
}

export type HermesTimelineDisplayMetadata =
  | { model: string; provider?: string }
  | {
      delegation_id: string;
      task_count: number;
      completed_count?: number;
      failed_count?: number;
      duration_seconds?: number;
    }
  | { reactions: HermesMessageReaction[] };

export interface HermesMessageReaction {
  emoji: string;
  author: "agent" | "user";
  at: number;
  [key: string]: unknown;
}

export interface HermesSessionMessage {
  args?: unknown;
  codex_reasoning_items?: unknown;
  content: unknown;
  context?: unknown;
  name?: string;
  reasoning?: string | null;
  reasoning_content?: string | null;
  reasoning_details?: unknown;
  display_kind?: string;
  display_metadata?: string | HermesTimelineDisplayMetadata;
  role: "assistant" | "system" | "tool" | "user";
  row_id?: number;
  id?: number;
  text?: unknown;
  timestamp?: number;
  tool_call_id?: string | null;
  tool_calls?: unknown;
  tool_name?: string;
  [key: string]: unknown;
}

export interface HermesSessionMessagesResponse {
  messages: HermesSessionMessage[];
  pagination?: {
    limit: number;
    offset: number;
    order: "latest" | "oldest";
    returned: number;
  };
  session_id: string;
  [key: string]: unknown;
}

export interface HermesSessionCreateResponse {
  info?: HermesSessionRuntimeInfo;
  message_count?: number;
  messages?: HermesSessionMessage[];
  session_id: string;
  stored_session_id?: string;
  [key: string]: unknown;
}

export interface HermesSessionRenameRequest {
  title?: string | null;
  archived?: boolean | null;
  pinned?: boolean | null;
  profile?: string | null;
}

export interface HermesBulkDeleteSessionsRequest {
  ids: string[];
  profile?: string | null;
}

export interface HermesSessionImportRequest {
  sessions: Array<Record<string, unknown>>;
  profile?: string | null;
}

export interface HermesSessionPruneRequest {
  older_than_days?: number | null;
  source?: string | null;
  profile?: string | null;
  started_before?: number | null;
  started_after?: number | null;
  title_like?: string | null;
  end_reason?: string | null;
  cwd_prefix?: string | null;
  min_messages?: number | null;
  max_messages?: number | null;
  model_like?: string | null;
  provider?: string | null;
  user_id?: string | null;
  chat_id?: string | null;
  chat_type?: string | null;
  branch_like?: string | null;
  min_tokens?: number | null;
  max_tokens?: number | null;
  min_cost?: number | null;
  max_cost?: number | null;
  min_tool_calls?: number | null;
  max_tool_calls?: number | null;
  include_archived?: boolean;
  dry_run?: boolean;
}

export interface HermesSessionListQuery {
  limit?: number;
  offset?: number;
  min_messages?: number;
  archived?: "exclude" | "only" | "include";
  order?: "created" | "recent";
  profile?: string;
  source?: string;
  sources?: string;
  exclude_sources?: string;
  cwd_prefix?: string;
  full?: boolean;
}

export interface HermesSessionSearchQuery {
  q: string;
  limit?: number;
  profile?: string;
  source?: string;
  sources?: string;
  exclude_sources?: string;
}

export interface HermesSessionSearchResult {
  lineage_root?: string | null;
  model: string | null;
  role: string | null;
  session_id: string;
  session_started: number | null;
  snippet: string;
  source: string | null;
  [key: string]: unknown;
}

export interface HermesSessionSearchResponse {
  results: HermesSessionSearchResult[];
  [key: string]: unknown;
}

export interface HermesSessionLatestDescendantResponse {
  requested_session_id: string;
  session_id: string;
  path: string[];
  changed: boolean;
  [key: string]: unknown;
}

export interface HermesSessionStatsResponse {
  total: number;
  active_store: number;
  archived: number;
  messages: number;
  by_source: Record<string, number>;
  [key: string]: unknown;
}

export interface HermesSessionsApi {
  list(query?: HermesSessionListQuery): Promise<HermesPaginatedSessions>;
  search(query: HermesSessionSearchQuery): Promise<HermesSessionSearchResponse>;
  detail(sessionId: string, profile?: string): Promise<HermesSessionInfo>;
  latestDescendant(sessionId: string, profile?: string): Promise<HermesSessionLatestDescendantResponse>;
  messages(sessionId: string, query?: { limit?: number; offset?: number; order?: "latest" | "oldest"; profile?: string }): Promise<HermesSessionMessagesResponse>;
  update(sessionId: string, input: HermesSessionRenameRequest): Promise<unknown>;
  remove(sessionId: string, profile?: string): Promise<unknown>;
  deleteMany(input: HermesBulkDeleteSessionsRequest): Promise<{ ok: boolean; deleted: number; [key: string]: unknown }>;
  import(input: HermesSessionImportRequest): Promise<unknown>;
  export(sessionId: string, profile?: string): Promise<unknown>;
  emptyCount(profile?: string): Promise<{ count: number; [key: string]: unknown }>;
  deleteEmpty(profile?: string): Promise<{ ok: boolean; deleted: number; [key: string]: unknown }>;
  stats(profile?: string): Promise<HermesSessionStatsResponse>;
  prune(input: HermesSessionPruneRequest): Promise<unknown>;
}
