/**
 * Native Hermes programmatic-integration protocols.
 *
 * These contracts mirror Hermes' TUI Gateway JSON-RPC and API Server
 * transport surfaces. They are not an application workflow model.
 */

export type HermesGatewayRpcEventName =
  | "message.delta"
  | "message.complete"
  | "tool.start"
  | "tool.progress"
  | "tool.complete"
  | "approval.request"
  | "clarify.request"
  | "sudo.request"
  | "secret.request"
  | "gateway.ready"
  | "session.info"
  | string;

export interface HermesGatewayRpcEvent<T = unknown> {
  type: HermesGatewayRpcEventName;
  payload?: T;
  [key: string]: unknown;
}

export interface HermesGatewayRpcSessionCreateRequest {
  profile?: string;
  source?: string;
  close_on_disconnect?: boolean;
  [key: string]: unknown;
}

export interface HermesGatewayRpcSessionCreateResponse {
  session_id: string;
  [key: string]: unknown;
}

export interface HermesGatewayRpcPromptSubmitRequest {
  session_id: string;
  text: string;
  [key: string]: unknown;
}

export interface HermesApiServerCapabilities {
  features?: Record<string, boolean | string | number | null>;
  [key: string]: unknown;
}

export interface HermesApiServerModel {
  id: string;
  object?: string;
  owned_by?: string;
  [key: string]: unknown;
}

export interface HermesApiServerModelsResponse {
  object?: string;
  data: HermesApiServerModel[];
  [key: string]: unknown;
}

export type HermesApiRunStatusName =
  | "started"
  | "running"
  | "waiting"
  | "stopping"
  | "completed"
  | "failed"
  | "cancelled"
  | string;

export interface HermesApiRunCreateRequest {
  input: string;
  session_id?: string;
  instructions?: string;
  conversation_history?: unknown[];
  previous_response_id?: string;
  provider?: string;
  model?: string;
  model_options?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HermesApiRunCreateResponse {
  run_id: string;
  status: HermesApiRunStatusName;
  [key: string]: unknown;
}

export interface HermesApiRunUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  [key: string]: unknown;
}

export interface HermesApiRun {
  object?: "hermes.run" | string;
  run_id: string;
  status: HermesApiRunStatusName;
  session_id?: string | null;
  model?: string | null;
  output?: string | null;
  error?: unknown;
  usage?: HermesApiRunUsage;
  [key: string]: unknown;
}

export type HermesApiRunApprovalChoice = "once" | "session" | "always" | "deny";

export interface HermesApiRunApprovalRequest {
  choice: HermesApiRunApprovalChoice;
  /** Present on Hermes versions/events that identify the pending approval. */
  approval_id?: string;
  [key: string]: unknown;
}

export interface HermesApiRunEvent {
  event?: string;
  type?: string;
  run_id?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface HermesApiServerSession {
  id?: string;
  session_id?: string;
  title?: string | null;
  [key: string]: unknown;
}
