export interface HermesPlatformStatus {
  error_code?: string;
  error_message?: string;
  state: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface HermesStatusResponse {
  active_sessions: number;
  auth_required?: boolean;
  auth_providers?: string[];
  auth_flows?: string[];
  can_update_hermes?: boolean;
  config_path: string;
  config_version: number;
  env_path: string;
  gateway_exit_reason: string | null;
  gateway_health_url: string | null;
  gateway_pid: number | null;
  gateway_platforms: Record<string, HermesPlatformStatus>;
  gateway_running: boolean;
  gateway_state: string | null;
  gateway_updated_at: string | null;
  hermes_home: string;
  latest_config_version: number;
  release_date: string;
  version: string;
  [key: string]: unknown;
}

export interface HermesHealthResponse extends Record<string, unknown> {
  ok?: boolean;
  status?: string;
}

export interface HermesSystemStatsResponse {
  os: string;
  os_release: string;
  os_version: string;
  platform: string;
  arch: string;
  hostname: string;
  python_version: string;
  python_impl: string;
  hermes_version: string;
  cpu_count: number | null;
  psutil: boolean;
  cpu_percent?: number;
  load_avg?: number[];
  uptime_seconds?: number;
  memory?: { total: number; available: number; used: number; percent: number };
  disk?: { total: number; used: number; free: number; percent: number };
  process?: { pid: number; rss: number; create_time: number; num_threads: number };
  [key: string]: unknown;
}

export interface HermesActionResponse {
  archive?: string;
  name: string;
  ok: boolean;
  pid: number | null;
  action_id?: string;
  already_running?: boolean;
  error?: string;
  message?: string;
  uploaded_bytes?: number;
  update_command?: string;
  [key: string]: unknown;
}

export interface HermesActionStatusResponse {
  exit_code: number | null;
  lines: string[];
  name: string;
  pid: number | null;
  running: boolean;
  [key: string]: unknown;
}

export interface HermesSystemApi {
  status(): Promise<HermesStatusResponse>;
  stats(): Promise<HermesSystemStatsResponse>;
}
