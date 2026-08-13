import type { HermesEnvVarUpdateRequest } from "./config.js";

export interface HermesOAuthProviderStatus {
  error?: string;
  expires_at?: string | null;
  has_refresh_token?: boolean;
  last_refresh?: string | null;
  logged_in: boolean;
  source?: string | null;
  source_label?: string | null;
  token_preview?: string | null;
  [key: string]: unknown;
}

export interface HermesOAuthProvider {
  cli_command: string;
  disconnect_command?: string | null;
  disconnect_hint?: string | null;
  disconnectable?: boolean;
  docs_url: string;
  flow: "device_code" | "external" | "pkce";
  id: string;
  name: string;
  status: HermesOAuthProviderStatus;
  [key: string]: unknown;
}

export interface HermesOAuthProvidersResponse {
  providers: HermesOAuthProvider[];
  [key: string]: unknown;
}

export type HermesOAuthStartResponse =
  | {
      auth_url: string;
      expires_in: number;
      flow: "pkce";
      session_id: string;
      [key: string]: unknown;
    }
  | {
      expires_in: number;
      flow: "device_code";
      poll_interval: number;
      session_id: string;
      user_code: string;
      verification_url: string;
      [key: string]: unknown;
    };

export interface HermesOAuthSubmitRequest {
  session_id: string;
  code: string;
}

export interface HermesOAuthSubmitResponse {
  message?: string;
  ok: boolean;
  status: "approved" | "error";
  [key: string]: unknown;
}

export interface HermesOAuthPollResponse {
  error_message?: string | null;
  expires_at?: number | null;
  session_id: string;
  status: "approved" | "denied" | "error" | "expired" | "pending";
  [key: string]: unknown;
}

export interface HermesCustomEndpoint {
  api_key_preview?: string | null;
  base_url: string;
  context_length?: number | null;
  discover_models: boolean;
  has_api_key: boolean;
  id: string;
  is_current?: boolean;
  model: string;
  models: string[];
  name: string;
  source?: string;
  [key: string]: unknown;
}

export interface HermesCustomEndpointsResponse {
  current: {
    base_url: string;
    model: string;
    provider: string;
    [key: string]: unknown;
  };
  endpoints: HermesCustomEndpoint[];
  id?: string;
  ok?: boolean;
  [key: string]: unknown;
}

export interface HermesCustomEndpointUpdateRequest {
  api_key?: string;
  base_url: string;
  context_length?: number;
  discover_models?: boolean;
  id?: string;
  make_default?: boolean;
  model: string;
  models?: string[];
  name: string;
}

export interface HermesCustomEndpointValidationResponse {
  message: string;
  models: string[];
  ok: boolean;
  reachable: boolean;
  [key: string]: unknown;
}

export interface HermesOAuthApi {
  list(): Promise<HermesOAuthProvidersResponse>;
  disconnect(provider_id: string): Promise<unknown>;
  start(provider_id: string): Promise<HermesOAuthStartResponse>;
  submit(provider_id: string, input: HermesOAuthSubmitRequest): Promise<HermesOAuthSubmitResponse>;
  poll(provider_id: string, session_id: string): Promise<HermesOAuthPollResponse>;
  cancel(session_id: string): Promise<unknown>;
}

export interface HermesCustomEndpointsApi {
  list(): Promise<HermesCustomEndpointsResponse>;
  save(input: HermesCustomEndpointUpdateRequest): Promise<HermesCustomEndpointsResponse>;
  activate(id: string): Promise<unknown>;
  remove(id: string): Promise<unknown>;
  validate(input: HermesCustomEndpointUpdateRequest): Promise<HermesCustomEndpointValidationResponse>;
}

export interface HermesProvidersApi {
  oauth: HermesOAuthApi;
  custom_endpoints: HermesCustomEndpointsApi;
  validate(input: HermesEnvVarUpdateRequest): Promise<unknown>;
}
