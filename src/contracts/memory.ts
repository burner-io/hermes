export type HermesMemoryProviderFieldKind =
  | "bool"
  | "boolean"
  | "integer"
  | "json"
  | "number"
  | "secret"
  | "select"
  | "text";

export interface HermesMemoryProviderFieldOption {
  description?: string;
  label: string;
  value: string;
  [key: string]: unknown;
}

export interface HermesMemoryProviderExternalDependency {
  name: string;
  install: string;
  check: string;
  [key: string]: unknown;
}

export interface HermesMemoryProviderSetupInfo {
  pip_dependencies: string[];
  external_dependencies: HermesMemoryProviderExternalDependency[];
  required_env: string[];
  dependencies_installed: boolean;
  [key: string]: unknown;
}

export interface HermesMemoryProviderField {
  key: string;
  label: string;
  kind: HermesMemoryProviderFieldKind;
  description: string;
  placeholder: string;
  required?: boolean;
  value: unknown;
  is_set: boolean;
  options: HermesMemoryProviderFieldOption[];
  url?: string;
  minimum?: number | null;
  maximum?: number | null;
  step?: number | null;
  when?: Record<string, string | boolean | number> | null;
  group?: string;
  info?: string;
  inline?: boolean;
  [key: string]: unknown;
}

export interface HermesMemoryProviderConfig {
  name: string;
  label: string;
  docs_url?: string;
  fields: HermesMemoryProviderField[];
  setup?: HermesMemoryProviderSetupInfo;
  [key: string]: unknown;
}

export interface HermesMemoryProviderInfo {
  name: string;
  description: string;
  available?: boolean;
  configured: boolean;
  status?: "ready" | "needs_config" | "unavailable" | "missing" | string;
  setup?: HermesMemoryProviderSetupInfo;
  [key: string]: unknown;
}

export interface HermesMemoryStatusResponse {
  active: string;
  providers: HermesMemoryProviderInfo[];
  builtin_files: { memory: number; user: number; [key: string]: unknown };
  [key: string]: unknown;
}

export interface HermesMemoryProviderSetupResult {
  kind: string;
  name: string;
  status: string;
  command: string;
  returncode: number | null;
  stdout: string;
  stderr: string;
  [key: string]: unknown;
}

export interface HermesMemoryProviderSetupResponse {
  ok: boolean;
  provider: string;
  results: HermesMemoryProviderSetupResult[];
  status?: HermesMemoryProviderInfo | null;
  [key: string]: unknown;
}

export interface HermesMemoryProviderSelectRequest {
  provider: string;
}

export interface HermesMemoryProviderValuesRequest {
  values?: Record<string, unknown>;
}

export interface HermesMemoryResetRequest {
  target?: "all" | "memory" | "user" | string;
}

export interface HermesMemoryApi {
  status(): Promise<HermesMemoryStatusResponse>;
  select(input: HermesMemoryProviderSelectRequest): Promise<{ ok: boolean; active: string; [key: string]: unknown }>;
  reset(input?: HermesMemoryResetRequest): Promise<{ ok: boolean; deleted: string[]; [key: string]: unknown }>;
  providerConfig(name: string): Promise<HermesMemoryProviderConfig>;
  setupProvider(name: string, input?: HermesMemoryProviderValuesRequest): Promise<HermesMemoryProviderSetupResponse>;
  updateProviderConfig(name: string, input?: HermesMemoryProviderValuesRequest): Promise<{ ok: boolean; active: string; [key: string]: unknown }>;
}
