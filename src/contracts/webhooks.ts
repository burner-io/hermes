export interface HermesWebhookRoute {
  created_at: string | null;
  deliver: string;
  deliver_only: boolean;
  description: string;
  enabled: boolean;
  events: string[];
  name: string;
  prompt: string;
  secret_set: boolean;
  skills: string[];
  url: string;
  [key: string]: unknown;
}

export interface HermesWebhooksResponse {
  base_url: string;
  enabled: boolean;
  subscriptions: HermesWebhookRoute[];
  [key: string]: unknown;
}

export interface HermesWebhookCreateRequest {
  name: string;
  description?: string | null;
  events?: string[];
  prompt?: string | null;
  script?: string | null;
  skills?: string[];
  deliver?: string;
  deliver_only?: boolean;
  deliver_chat_id?: string | null;
  secret?: string | null;
}

export interface HermesWebhookCreateResponse extends HermesWebhookRoute {
  secret: string;
}

export interface HermesWebhookEnableResponse {
  enabled: true;
  needs_restart: boolean;
  ok: boolean;
  platform: "webhook";
  restart_action?: string;
  restart_error?: string;
  restart_pid?: number | null;
  restart_started?: boolean;
  [key: string]: unknown;
}

export interface HermesWebhooksApi {
  list(): Promise<HermesWebhooksResponse>;
  enable(): Promise<HermesWebhookEnableResponse>;
  create(input: HermesWebhookCreateRequest): Promise<HermesWebhookCreateResponse>;
  remove(name: string): Promise<unknown>;
  setEnabled(name: string, enabled: boolean): Promise<unknown>;
}
