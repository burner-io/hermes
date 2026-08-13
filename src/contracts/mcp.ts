export type HermesMcpHttpAuth = "none" | "header" | "oauth";

export interface HermesMcpServerSummary {
  name: string;
  transport: "http" | "stdio" | "unknown" | string;
  command: string | null;
  args: string[];
  url: string | null;
  env?: Record<string, string>;
  auth?: "header" | "oauth" | null;
  enabled: boolean;
  tools: string[] | null;
  [key: string]: unknown;
}

export interface HermesMcpServersResponse {
  servers: HermesMcpServerSummary[];
  [key: string]: unknown;
}

export interface HermesMcpServerCreateRequest {
  name: string;
  url?: string | null;
  command?: string | null;
  args?: string[];
  env?: Record<string, string>;
  auth?: HermesMcpHttpAuth | null;
  bearer_token?: string | null;
  profile?: string | null;
}

export interface HermesMcpServersReplaceRequest {
  servers: Record<string, Record<string, unknown>>;
  profile?: string | null;
}

export interface HermesMcpEnabledToggleRequest {
  enabled: boolean;
  profile?: string | null;
}

export interface HermesMcpServerTestResponse {
  ok: boolean;
  error?: string;
  tools: Array<{ name: string; description: string }>;
  [key: string]: unknown;
}

export interface HermesMcpOAuthFlow {
  flow_id: string;
  server_name: string;
  status: "starting" | "authorization_required" | "approved" | "error" | string;
  authorization_url: string | null;
  error: string | null;
  tools?: Array<{ name: string; description: string }>;
  [key: string]: unknown;
}

export interface HermesMcpCatalogEntry {
  name: string;
  description: string;
  source: string;
  transport: "http" | "stdio" | string;
  auth_type: "api_key" | "oauth" | "none" | string;
  required_env: Array<{ name: string; prompt: string; required: boolean }>;
  command: string | null;
  args: string[];
  url: string | null;
  install_url: string | null;
  install_ref: string | null;
  bootstrap: string[];
  default_enabled: string[] | null;
  post_install: string;
  needs_install: boolean;
  installed: boolean;
  enabled: boolean;
  [key: string]: unknown;
}

export interface HermesMcpCatalogResponse {
  entries: HermesMcpCatalogEntry[];
  diagnostics: Array<{ name: string; kind: string; message: string }>;
  [key: string]: unknown;
}

export interface HermesMcpCatalogInstallRequest {
  name: string;
  env?: Record<string, string>;
  enable?: boolean;
  profile?: string | null;
}

export interface HermesMcpApi {
  servers(profile?: string): Promise<HermesMcpServersResponse>;
  create(input: HermesMcpServerCreateRequest): Promise<HermesMcpServerSummary>;
  replace(input: HermesMcpServersReplaceRequest): Promise<unknown>;
  remove(name: string, profile?: string): Promise<{ ok: boolean; [key: string]: unknown }>;
  toggle(name: string, input: HermesMcpEnabledToggleRequest): Promise<unknown>;
  test(name: string, profile?: string): Promise<HermesMcpServerTestResponse>;
  auth(name: string, profile?: string): Promise<HermesMcpOAuthFlow>;
  oauthFlow(flow_id: string, profile?: string): Promise<HermesMcpOAuthFlow>;
  catalog(profile?: string): Promise<HermesMcpCatalogResponse>;
  installCatalog(input: HermesMcpCatalogInstallRequest): Promise<unknown>;
}
