import type { HermesActionResponse, HermesActionStatusResponse } from "./system.js";

export interface HermesDebugShareRequest {
  redact?: boolean;
  lines?: number;
}

export interface HermesDebugShareResponse {
  ok: boolean;
  urls: Record<string, string>;
  failures: string[] | Record<string, string>;
  redacted: boolean;
  auto_delete_seconds: number | null;
  [key: string]: unknown;
}

export interface HermesBackupRequest {
  output?: string | null;
}

export interface HermesImportRequest {
  archive: string;
  force?: boolean;
}

export interface HermesHookCreateRequest {
  event: string;
  command: string;
  matcher?: string | null;
  timeout?: number | null;
  approve?: boolean;
}

export interface HermesHookDeleteRequest {
  event: string;
  command: string;
}

export interface HermesHookInfo extends Record<string, unknown> {
  event?: string;
  command?: string;
  matcher?: string | null;
  timeout?: number | null;
}

export interface HermesCheckpointInfo extends Record<string, unknown> {}

export interface HermesOperationsApi {
  promptSize(): Promise<HermesActionResponse>;
  dump(): Promise<HermesActionResponse>;
  migrateConfig(): Promise<HermesActionResponse>;
  debugShare(input?: HermesDebugShareRequest): Promise<HermesDebugShareResponse>;
  doctor(): Promise<HermesActionResponse>;
  securityAudit(): Promise<HermesActionResponse>;
  backup(input?: HermesBackupRequest): Promise<HermesActionResponse | unknown>;
  backupDownload(path: string): Promise<unknown>;
  import(input: HermesImportRequest): Promise<HermesActionResponse | unknown>;
  /** Multipart/binary transport shape is deliberately left opaque in the contract layer; V0.3 implements it in the runtime transport. */
  importUpload(input: unknown): Promise<HermesActionResponse | unknown>;
  hooks(): Promise<{ hooks?: HermesHookInfo[]; [key: string]: unknown }>;
  createHook(input: HermesHookCreateRequest): Promise<unknown>;
  deleteHook(input: HermesHookDeleteRequest): Promise<unknown>;
  checkpoints(): Promise<{ sessions?: HermesCheckpointInfo[]; total_bytes?: number; [key: string]: unknown }>;
  pruneCheckpoints(input?: Record<string, unknown>): Promise<unknown>;
  /** Action-status path is native Hermes; exact supported action names are server-defined. */
  actionStatus(name: string, lines?: number): Promise<HermesActionStatusResponse>;
}
