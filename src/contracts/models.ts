export interface HermesModelInfoResponse {
  auto_context_length?: number;
  capabilities?: Record<string, unknown>;
  config_context_length?: number;
  effective_context_length?: number;
  model: string;
  provider: string;
  [key: string]: unknown;
}

export interface HermesModelPricing {
  input: string;
  output: string;
  cache: string | null;
  free: boolean;
  discount_percent?: number;
  was_input?: string;
  was_output?: string;
  [key: string]: unknown;
}

export interface HermesModelCapabilities {
  fast: boolean;
  reasoning: boolean;
  [key: string]: unknown;
}

export interface HermesModelOptionProvider {
  is_current?: boolean;
  models?: string[];
  name: string;
  slug: string;
  total_models?: number;
  warning?: string;
  featured_models?: string[];
  authenticated?: boolean;
  auth_type?: string;
  key_env?: string;
  is_user_defined?: boolean;
  api_url?: string;
  pricing?: Record<string, HermesModelPricing>;
  free_tier?: boolean;
  unavailable_models?: string[];
  capabilities?: Record<string, HermesModelCapabilities>;
  [key: string]: unknown;
}

export interface HermesModelOptionsResponse {
  model?: string;
  provider?: string;
  providers?: HermesModelOptionProvider[];
  [key: string]: unknown;
}

export interface HermesModelAssignmentRequest {
  scope: "main" | "auxiliary";
  provider: string;
  model: string;
  task?: string;
  base_url?: string;
  api_key?: string;
  confirm_expensive_model?: boolean;
  profile?: string | null;
}

export interface HermesStaleAuxAssignment {
  task: string;
  provider: string;
  model: string;
  [key: string]: unknown;
}

export interface HermesModelAssignmentResponse {
  base_url?: string;
  gateway_tools?: string[];
  cron_model_impact?: unknown;
  confirm_message?: string;
  confirm_required?: boolean;
  model?: string;
  ok: boolean;
  provider?: string;
  reset?: boolean;
  scope?: string;
  stale_aux?: HermesStaleAuxAssignment[];
  tasks?: string[];
  [key: string]: unknown;
}

export interface HermesAuxiliaryTaskAssignment {
  base_url: string;
  model: string;
  provider: string;
  task: string;
  [key: string]: unknown;
}

export interface HermesAuxiliaryModelsResponse {
  main: { model: string; provider: string };
  tasks: HermesAuxiliaryTaskAssignment[];
  [key: string]: unknown;
}


export interface HermesMoaModelSlot {
  provider: string;
  model: string;
  reasoning_effort?: string;
  enabled?: boolean;
  [key: string]: unknown;
}

export interface HermesMoaPreset {
  aggregator: HermesMoaModelSlot;
  aggregator_temperature: number;
  degraded_reference_policy: "loud" | "silent";
  enabled: boolean;
  max_tokens: number;
  reference_models: HermesMoaModelSlot[];
  reference_temperature: number;
  reference_max_tokens?: number | null;
  fanout?: string;
  reference_timeout: number | null;
  [key: string]: unknown;
}

export interface HermesMoaConfigResponse {
  default_preset: string;
  active_preset: string;
  presets: Record<string, HermesMoaPreset>;
  aggregator: HermesMoaModelSlot;
  aggregator_temperature: number;
  degraded_reference_policy: "loud" | "silent";
  enabled: boolean;
  max_tokens: number;
  reference_models: HermesMoaModelSlot[];
  reference_temperature: number;
  reference_timeout: number | null;
  reference_max_tokens?: number | null;
  fanout?: string;
  [key: string]: unknown;
}

export interface HermesModelsApi {
  info(profile?: string): Promise<HermesModelInfoResponse>;
  options(query?: { profile?: string; pricing?: boolean; capabilities?: boolean; include_unconfigured?: boolean }): Promise<HermesModelOptionsResponse>;
  set(input: HermesModelAssignmentRequest): Promise<HermesModelAssignmentResponse>;
  auxiliary(profile?: string): Promise<HermesAuxiliaryModelsResponse>;
  moa(profile?: string): Promise<HermesMoaConfigResponse>;
  saveMoa(input: HermesMoaConfigResponse, profile?: string): Promise<HermesMoaConfigResponse & { ok: boolean }>;
}
