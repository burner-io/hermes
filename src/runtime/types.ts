import type { HermesClient } from "../contracts/client.js";
import type { HermesKanbanApi, HermesKanbanEvent } from "../contracts/kanban.js";
import type {
  HermesApiRun,
  HermesApiRunApprovalRequest,
  HermesApiRunCreateRequest,
  HermesApiRunCreateResponse,
  HermesApiRunEvent,
  HermesApiServerCapabilities,
  HermesApiServerModelsResponse,
  HermesGatewayRpcEvent,
  HermesGatewayRpcPromptSubmitRequest,
  HermesGatewayRpcSessionCreateRequest,
  HermesGatewayRpcSessionCreateResponse,
} from "../contracts/programmatic.js";

export type HermesTokenResolver =
  | string
  | (() => string | undefined | Promise<string | undefined>);

export type HermesWebSocketLike = {
  addEventListener?(type: string, listener: (event: any) => void): void;
  removeEventListener?(type: string, listener: (event: any) => void): void;
  close(code?: number, reason?: string): void;
  send?(data: string): void;
  onopen?: ((event: any) => void) | null;
  onmessage?: ((event: any) => void) | null;
  onerror?: ((event: any) => void) | null;
  onclose?: ((event: any) => void) | null;
};

export type HermesWebSocketFactory = (url: string) => HermesWebSocketLike;

export interface HermesApiServerClientOptions {
  /** Base URL of the native Hermes API Server (default port is configured by Hermes). */
  baseUrl: string;
  /** API_SERVER_KEY, sent as Authorization: Bearer. */
  apiKey?: HermesTokenResolver;
  /** Native multiplexed profile prefix: /p/<profile>/... */
  profile?: string;
  fetch?: typeof fetch;
  headers?: HeadersInit;
  timeoutMs?: number;
}

export interface HermesClientOptions {
  baseUrl: string;
  fetch?: typeof fetch;
  /** Loopback/legacy dashboard token sent as X-Hermes-Session-Token. */
  sessionToken?: HermesTokenResolver;
  /** Optional Authorization: Bearer credential for token-auth deployments. */
  bearerToken?: HermesTokenResolver;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  /** Default management profile, only applied to endpoints Hermes natively scopes. */
  profile?: string;
  timeoutMs?: number;
  websocketFactory?: HermesWebSocketFactory;
  /** Force WS auth mode; auto consults /api/status. */
  websocketAuth?: "auto" | "session-token" | "ticket" | "none";
  internalWebSocketToken?: string;
  surfaceCacheMs?: number;
  /** Probe optional plugin surfaces during createHermesClient(). Defaults true. */
  probeOnCreate?: boolean;
  /** Optional native Hermes API Server connection (separate listener from dashboard). */
  apiServer?: HermesApiServerClientOptions;
}

export interface HermesRequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: HeadersInit;
  timeoutMs?: number;
  response?: "json" | "text" | "response";
}

export interface HermesManagedFileStreamUpload {
  path: string;
  file: Blob;
  overwrite?: boolean;
  filename?: string;
}

export interface HermesImportArchiveUpload {
  file: Blob;
  force?: boolean;
  filename?: string;
}

export interface HermesKanbanAttachmentUpload {
  file: Blob;
  filename?: string;
  uploaded_by?: string;
}

export interface HermesKanbanEventFrame {
  events: HermesKanbanEvent[];
  cursor?: number;
  [key: string]: unknown;
}

export interface HermesKanbanEventsOptions {
  board?: string;
  cursor?: number;
  onOpen?: () => void;
  onError?: (error: unknown) => void;
  onClose?: (event: unknown) => void;
}

export interface HermesRuntimeKanbanApi extends HermesKanbanApi {
  events(
    listener: (frame: HermesKanbanEventFrame) => void,
    options?: HermesKanbanEventsOptions,
  ): Promise<() => void>;
  uploadAttachment(
    taskId: string,
    input: HermesKanbanAttachmentUpload,
    board?: string,
  ): Promise<unknown>;
  downloadAttachment(attachmentId: number | string, board?: string): Promise<Response>;
  removeAttachment(attachmentId: number | string, board?: string): Promise<unknown>;
}

export interface HermesWebSocketApi {
  buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<string>;
  connectJson<T = unknown>(
    path: string,
    listener: (value: T) => void,
    options?: {
      query?: Record<string, string | number | boolean | undefined>;
      onOpen?: () => void;
      onError?: (error: unknown) => void;
      onClose?: (event: unknown) => void;
    },
  ): Promise<() => void>;
}


export interface HermesGatewayRpcConnection {
  readonly state: "connecting" | "open" | "closed";
  request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
  on<T = unknown>(event: string, listener: (event: HermesGatewayRpcEvent<T>) => void): () => void;
  createSession(input?: HermesGatewayRpcSessionCreateRequest): Promise<HermesGatewayRpcSessionCreateResponse>;
  submitPrompt(input: HermesGatewayRpcPromptSubmitRequest): Promise<unknown>;
  interrupt(sessionId: string): Promise<unknown>;
  close(code?: number, reason?: string): void;
}

export interface HermesTuiGatewayApi {
  connect(): Promise<HermesGatewayRpcConnection>;
}

export interface HermesApiServerRunEventsOptions {
  signal?: AbortSignal;
  onError?: (error: unknown) => void;
}

export interface HermesApiServerWaitOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface HermesApiServerApi {
  capabilities(): Promise<HermesApiServerCapabilities>;
  models(): Promise<HermesApiServerModelsResponse>;
  health(detailed?: boolean): Promise<unknown>;
  runs: {
    create(input: HermesApiRunCreateRequest): Promise<HermesApiRunCreateResponse>;
    get(runId: string): Promise<HermesApiRun>;
    stop(runId: string): Promise<unknown>;
    approve(runId: string, input: HermesApiRunApprovalRequest): Promise<unknown>;
    events(
      runId: string,
      listener: (event: HermesApiRunEvent) => void,
      options?: HermesApiServerRunEventsOptions,
    ): Promise<() => void>;
    wait(runId: string, options?: HermesApiServerWaitOptions): Promise<HermesApiRun>;
  };
  raw<T = unknown>(method: string, path: string, input?: {
    query?: Record<string, string | number | boolean | undefined | null>;
    body?: unknown;
    headers?: HeadersInit;
  }): Promise<T>;
}

export interface HermesRuntimeClient extends Omit<HermesClient, "kanban" | "projects"> {
  /** Native Kanban dashboard plugin, present only when its route is reachable. */
  kanban?: HermesRuntimeKanbanApi;
  websocket: HermesWebSocketApi;
  /** Native TUI Gateway JSON-RPC protocol over /api/ws. */
  tuiGateway: HermesTuiGatewayApi;
  /** Native Hermes API Server HTTP/SSE protocol, only when configured. */
  apiServer?: HermesApiServerApi;
  /** Escape hatch returning the authenticated raw HTTP Response. */
  response(
    method: string,
    path: string,
    options?: HermesRequestOptions,
  ): Promise<Response>;
}
