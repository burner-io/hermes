export interface HermesConfigFieldSchema {
  category?: string;
  description?: string;
  options?: unknown[];
  searchable?: boolean;
  clearable?: boolean;
  type?: "boolean" | "list" | "number" | "select" | "string" | "text";
  [key: string]: unknown;
}

export interface HermesConfigSchemaResponse {
  category_order?: string[];
  fields: Record<string, HermesConfigFieldSchema>;
  [key: string]: unknown;
}

/**
 * The Desktop client only types known sections and intentionally leaves the
 * rest open because config.yaml is extensible across providers/plugins.
 */
export interface HermesConfig {
  agent?: {
    reasoning_effort?: string;
    personalities?: Record<string, unknown>;
    service_tier?: string;
    [key: string]: unknown;
  };
  display?: {
    personality?: string;
    skin?: string;
    interim_assistant_messages?: boolean;
    [key: string]: unknown;
  };
  desktop?: {
    repo_scan_enabled?: boolean;
    repo_scan_roots?: string[];
    repo_scan_exclude_paths?: string[];
    [key: string]: unknown;
  };
  terminal?: {
    cwd?: string;
    font_family?: string;
    [key: string]: unknown;
  };
  stt?: {
    enabled?: boolean;
    [key: string]: unknown;
  };
  voice?: {
    max_recording_seconds?: number;
    auto_tts?: boolean;
    stop_phrases?: unknown;
    thinking_sound?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type HermesConfigRecord = Record<string, unknown>;

export interface HermesConfigUpdateRequest {
  config: Record<string, unknown>;
  profile?: string | null;
}

export interface HermesRawConfigUpdateRequest {
  yaml_text: string;
  profile?: string | null;
}

export interface HermesEnvVarInfo {
  advanced: boolean;
  category: string;
  channel_managed?: boolean;
  description: string;
  is_password: boolean;
  is_set: boolean;
  provider?: string;
  provider_label?: string;
  redacted_value: string | null;
  tools: string[];
  url: string | null;
  [key: string]: unknown;
}

export interface HermesEnvVarUpdateRequest {
  key: string;
  value: string;
  profile?: string | null;
  api_key?: string;
}

export interface HermesEnvVarDeleteRequest {
  key: string;
  profile?: string | null;
}


export interface HermesRawConfigResponse {
  yaml: string;
  path?: string;
  [key: string]: unknown;
}

export interface HermesConfigApi {
  get(profile?: string): Promise<HermesConfigRecord>;
  defaults(): Promise<HermesConfigRecord>;
  schema(): Promise<HermesConfigSchemaResponse>;
  getRaw(profile?: string): Promise<HermesRawConfigResponse>;
  update(input: HermesConfigUpdateRequest): Promise<unknown>;
  updateRaw(input: HermesRawConfigUpdateRequest): Promise<unknown>;
}
