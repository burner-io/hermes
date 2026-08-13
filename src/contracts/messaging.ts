export interface HermesMessagingEnvVarInfo {
  key: string;
  required: boolean;
  is_set: boolean;
  redacted_value: string | null;
  description: string;
  prompt: string;
  help?: string;
  url: string | null;
  is_password: boolean;
  advanced: boolean;
  [key: string]: unknown;
}

export interface HermesMessagingHomeChannel {
  chat_id: string;
  name: string;
  platform: string;
  thread_id?: string;
  [key: string]: unknown;
}

export interface HermesMessagingPlatformInfo {
  id: string;
  name: string;
  description: string;
  docs_url: string;
  enabled: boolean;
  configured: boolean;
  gateway_running: boolean;
  state: string;
  error_code: string | null;
  error_message: string | null;
  updated_at: string | null;
  home_channel: HermesMessagingHomeChannel | null;
  whatsapp_setup?: Record<string, unknown> | null;
  env_vars: HermesMessagingEnvVarInfo[];
  [key: string]: unknown;
}

export interface HermesMessagingPlatformsResponse {
  env_path?: string;
  gateway_start_command?: string;
  platforms: HermesMessagingPlatformInfo[];
  [key: string]: unknown;
}

export interface HermesMessagingPlatformUpdateRequest {
  clear_env?: string[];
  enabled?: boolean;
  env?: Record<string, string>;
  profile?: string | null;
}

export interface HermesMessagingPlatformTestResponse {
  message: string;
  ok: boolean;
  state: string;
  [key: string]: unknown;
}

export interface HermesTelegramOnboardingStartRequest {
  bot_name?: string | null;
}

export interface HermesTelegramOnboardingStartResponse {
  pairing_id: string;
  suggested_username: string;
  deep_link: string;
  qr_payload: string;
  expires_at: string;
  [key: string]: unknown;
}

export type HermesTelegramOnboardingStatusResponse =
  | { status: "waiting"; expires_at: string; [key: string]: unknown }
  | {
      status: "ready";
      bot_username: string;
      owner_user_id?: string;
      expires_at: string;
      [key: string]: unknown;
    };

export interface HermesTelegramOnboardingApplyRequest {
  allowed_user_ids: string[];
  profile?: string | null;
}

export interface HermesTelegramOnboardingApplyResponse {
  ok: boolean;
  platform: "telegram";
  bot_username?: string;
  needs_restart: boolean;
  restart_started?: boolean;
  restart_action?: string;
  restart_pid?: number | null;
  restart_error?: string;
  [key: string]: unknown;
}

export interface HermesWhatsAppOnboardingStartRequest {
  mode?: "bot" | "self-chat" | null;
  allowed_users?: string | null;
}

export interface HermesWhatsAppOnboardingStartResponse {
  pairing_id: string;
  status: "starting" | "installing" | "waiting" | "connected" | "error" | "expired" | "cancelled";
  qr_payload?: string | null;
  expires_at: string;
  mode: "bot" | "self-chat";
  allowed_users: string;
  account_id?: string | null;
  account_name?: string | null;
  account_phone?: string | null;
  error?: string | null;
  [key: string]: unknown;
}

export type HermesWhatsAppOnboardingStatusResponse = HermesWhatsAppOnboardingStartResponse;

export interface HermesWhatsAppOnboardingApplyRequest {
  mode?: "bot" | "self-chat" | null;
  allowed_users?: string | null;
  profile?: string | null;
}

export interface HermesWhatsAppOnboardingApplyResponse {
  ok: boolean;
  platform: "whatsapp";
  needs_restart: boolean;
  restart_started?: boolean;
  restart_action?: string;
  restart_pid?: number | null;
  restart_error?: string;
  [key: string]: unknown;
}

export interface HermesPairingUser {
  age_minutes?: number;
  platform: string;
  request_id?: string;
  user_id: string;
  user_name?: string;
  [key: string]: unknown;
}

export interface HermesPairingResponse {
  approved: HermesPairingUser[];
  pending: HermesPairingUser[];
  [key: string]: unknown;
}

export interface HermesPairingApproveRequest {
  platform: string;
  code?: string;
  request_id?: string;
  profile?: string | null;
}

export interface HermesPairingRevokeRequest {
  platform: string;
  user_id: string;
  profile?: string | null;
}

export interface HermesPairingApi {
  list(profile?: string): Promise<HermesPairingResponse>;
  approve(input: HermesPairingApproveRequest): Promise<{ ok: boolean; user?: HermesPairingUser; [key: string]: unknown }>;
  revoke(input: HermesPairingRevokeRequest): Promise<{ ok: boolean; [key: string]: unknown }>;
  clearPending(profile?: string): Promise<{ ok: boolean; cleared: number; [key: string]: unknown }>;
}

export interface HermesMessagingOnboardingApi {
  telegram: {
    start(input?: HermesTelegramOnboardingStartRequest): Promise<HermesTelegramOnboardingStartResponse>;
    status(pairing_id: string): Promise<HermesTelegramOnboardingStatusResponse>;
    apply(pairing_id: string, input: HermesTelegramOnboardingApplyRequest): Promise<HermesTelegramOnboardingApplyResponse>;
    cancel(pairing_id: string): Promise<{ ok: boolean; [key: string]: unknown }>;
  };
  whatsapp: {
    start(input?: HermesWhatsAppOnboardingStartRequest): Promise<HermesWhatsAppOnboardingStartResponse>;
    status(pairing_id: string): Promise<HermesWhatsAppOnboardingStatusResponse>;
    apply(pairing_id: string, input: HermesWhatsAppOnboardingApplyRequest): Promise<HermesWhatsAppOnboardingApplyResponse>;
    cancel(pairing_id: string): Promise<{ ok: boolean; [key: string]: unknown }>;
  };
}

export interface HermesMessagingApi {
  platforms(profile?: string): Promise<HermesMessagingPlatformsResponse>;
  update(platform_id: string, input: HermesMessagingPlatformUpdateRequest): Promise<{ ok: boolean; platform: string; [key: string]: unknown }>;
  test(platform_id: string, profile?: string): Promise<HermesMessagingPlatformTestResponse>;
  pairing: HermesPairingApi;
  onboarding: HermesMessagingOnboardingApi;
}
