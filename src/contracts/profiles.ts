import type { HermesMcpServerCreateRequest } from "./mcp.js";

export interface HermesProfileInfo {
  has_env: boolean;
  is_default: boolean;
  model: string | null;
  name: string;
  path: string;
  provider: string | null;
  skill_count: number;
  [key: string]: unknown;
}

export interface HermesProfilesResponse {
  profiles: HermesProfileInfo[];
  [key: string]: unknown;
}

export interface HermesProfileActiveResponse {
  active: string;
  current: string;
  [key: string]: unknown;
}

export interface HermesProfileCreateRequest {
  name: string;
  clone_from?: string | null;
  clone_from_default?: boolean;
  clone_all?: boolean;
  no_skills?: boolean;
  description?: string | null;
  provider?: string | null;
  model?: string | null;
  mcp_servers?: HermesMcpServerCreateRequest[];
  keep_skills?: string[];
  hub_skills?: string[];
}

export interface HermesProfileCreateResponse {
  ok: boolean;
  name: string;
  path: string;
  model_set?: boolean;
  mcp_written?: number;
  skills_disabled?: number;
  hub_installs?: Array<{ identifier: string; pid: number | null }>;
  [key: string]: unknown;
}

export interface HermesProfileRenameRequest {
  new_name: string;
}

export interface HermesProfileSetupCommand {
  command: string;
  [key: string]: unknown;
}

export interface HermesProfileSoul {
  content: string;
  exists: boolean;
  [key: string]: unknown;
}

export interface HermesProfileSoulUpdateRequest {
  content: string;
}

export interface HermesProfileDescriptionUpdateRequest {
  description?: string;
}

export interface HermesProfileModelUpdateRequest {
  provider: string;
  model: string;
}

export interface HermesProfileDescribeAutoRequest {
  overwrite?: boolean;
}

export interface HermesProfileDescribeAutoResponse {
  ok: boolean;
  reason: string | null;
  description: string | null;
  description_auto: boolean;
  [key: string]: unknown;
}

export interface HermesProfileExportRequest {
  extra_files?: Record<string, string>;
  output?: string;
}

export interface HermesProfileImportRequest {
  archive: string;
  name?: string | null;
}

export interface HermesProfileImportResponse {
  ok: boolean;
  name: string;
  path: string;
  desktop?: unknown;
  [key: string]: unknown;
}

export interface HermesProfilesApi {
  list(): Promise<HermesProfilesResponse>;
  active(): Promise<HermesProfileActiveResponse>;
  setActive(name: string): Promise<{ ok: boolean; active: string }>;
  create(input: HermesProfileCreateRequest): Promise<HermesProfileCreateResponse>;
  rename(name: string, input: HermesProfileRenameRequest): Promise<{ ok: boolean; name: string; path: string }>;
  remove(name: string): Promise<{ ok: boolean; path: string }>;
  setupCommand(name: string): Promise<HermesProfileSetupCommand>;
  getSoul(name: string): Promise<HermesProfileSoul>;
  setSoul(name: string, input: HermesProfileSoulUpdateRequest): Promise<{ ok: boolean }>;
  setDescription(name: string, input: HermesProfileDescriptionUpdateRequest): Promise<unknown>;
  setModel(name: string, input: HermesProfileModelUpdateRequest): Promise<unknown>;
  describeAuto(name: string, input?: HermesProfileDescribeAutoRequest): Promise<HermesProfileDescribeAutoResponse>;
  export(name: string, input?: HermesProfileExportRequest): Promise<{ ok: boolean; archive: string }>;
  import(input: HermesProfileImportRequest): Promise<HermesProfileImportResponse>;
}
