export interface HermesToolsetInfo {
  configured: boolean;
  description: string;
  enabled: boolean;
  label: string;
  name: string;
  tools: string[];
  [key: string]: unknown;
}

export interface HermesToolEnvVar {
  key: string;
  prompt: string;
  url: string | null;
  default: string | null;
  is_set: boolean;
  [key: string]: unknown;
}

export type HermesToolProviderStatus = "ready" | "needs_setup" | "needs_auth" | "needs_keys";
export type HermesWebCapability = "search" | "extract";

export interface HermesToolProvider {
  name: string;
  badge: string;
  tag: string;
  env_vars: HermesToolEnvVar[];
  post_setup: string | null;
  requires_nous_auth: boolean;
  is_active: boolean;
  status?: HermesToolProviderStatus;
  web_backend?: string;
  tts_provider?: string;
  capabilities?: HermesWebCapability[];
  [key: string]: unknown;
}

export interface HermesToolsetConfig {
  name: string;
  has_category: boolean;
  providers: HermesToolProvider[];
  active_provider: string | null;
  active_search_backend?: string | null;
  active_extract_backend?: string | null;
  [key: string]: unknown;
}

export interface HermesToolsetModel {
  id: string;
  display: string;
  speed: string;
  strengths: string;
  price: string;
  [key: string]: unknown;
}

export interface HermesToolsetModelsResponse {
  name: string;
  has_models: boolean;
  provider?: string | null;
  plugin?: string | null;
  models: HermesToolsetModel[];
  current: string | null;
  default: string | null;
  [key: string]: unknown;
}

export interface HermesToolsetToggleRequest {
  enabled: boolean;
  profile?: string | null;
}

export interface HermesToolsetProviderSelectRequest {
  provider: string;
  capability?: string | null;
  profile?: string | null;
}

export interface HermesToolsetModelSelectRequest {
  model: string;
  provider?: string | null;
  profile?: string | null;
}

export interface HermesToolsetEnvUpdateRequest {
  env: Record<string, string>;
  profile?: string | null;
}

export interface HermesToolsetPostSetupRequest {
  key: string;
  profile?: string | null;
}

export type HermesTerminalBackendStatus = "ready" | "needs_setup" | "unavailable";

export interface HermesTerminalBackendInfo {
  name: string;
  label: string;
  description: string;
  active: boolean;
  status: HermesTerminalBackendStatus;
  detail: string;
  [key: string]: unknown;
}

export interface HermesTerminalBackendsResponse {
  active: string;
  backends: HermesTerminalBackendInfo[];
  [key: string]: unknown;
}

export interface HermesTerminalBackendSelectRequest {
  backend: string;
  profile?: string | null;
}

export interface HermesComputerUseCheck {
  label: string;
  status: string;
  message: string;
  [key: string]: unknown;
}

export interface HermesComputerUsePermissionSource {
  attribution?: string;
  executable?: string;
  note?: string;
  pid?: number;
  responsible_ppid?: number;
  [key: string]: unknown;
}

export interface HermesComputerUseStatus {
  platform: string;
  platform_supported: boolean;
  installed: boolean;
  version: string | null;
  ready: boolean | null;
  can_grant: boolean;
  checks: HermesComputerUseCheck[];
  accessibility: boolean | null;
  screen_recording: boolean | null;
  screen_recording_capturable: boolean | null;
  source: HermesComputerUsePermissionSource | null;
  error: string | null;
  [key: string]: unknown;
}

export interface HermesToolsApi {
  list(profile?: string): Promise<HermesToolsetInfo[]>;
  config(name: string, profile?: string): Promise<HermesToolsetConfig>;
  toggle(name: string, input: HermesToolsetToggleRequest): Promise<unknown>;
  selectProvider(name: string, input: HermesToolsetProviderSelectRequest): Promise<unknown>;
  models(name: string, profile?: string): Promise<HermesToolsetModelsResponse>;
  selectModel(name: string, input: HermesToolsetModelSelectRequest): Promise<unknown>;
  updateEnv(name: string, input: HermesToolsetEnvUpdateRequest): Promise<unknown>;
  postSetup(name: string, input: HermesToolsetPostSetupRequest): Promise<unknown>;
  terminalBackends(profile?: string): Promise<HermesTerminalBackendsResponse>;
  selectTerminalBackend(input: HermesTerminalBackendSelectRequest): Promise<unknown>;
  computerUseStatus(profile?: string): Promise<HermesComputerUseStatus>;
}
