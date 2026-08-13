/**
 * Shared SDK-only primitives.
 *
 * These are NOT Hermes domain entities. They only describe transport and
 * native-surface reachability for a version-tolerant TypeScript client.
 */

export type HermesJsonPrimitive = string | number | boolean | null;
export type HermesJsonValue =
  | HermesJsonPrimitive
  | HermesJsonValue[]
  | { [key: string]: HermesJsonValue };

export type HermesUnknownRecord = Record<string, unknown>;

export interface HermesRawRequest {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface HermesRawApi {
  request<T = unknown>(request: HermesRawRequest): Promise<T>;
}

/**
 * SDK observation of which native Hermes surfaces are reachable.
 * This is transport metadata only; it is never written into Hermes state.
 */
export interface HermesSurfaceAvailability {
  auth: boolean;
  system: boolean;
  config: boolean;
  dashboard: boolean;
  env: boolean;
  profiles: boolean;
  skills: boolean;
  sessions: boolean;
  tools: boolean;
  mcp: boolean;
  models: boolean;
  providers: boolean;
  audio: boolean;
  messaging: boolean;
  webhooks: boolean;
  credentials: boolean;
  memory: boolean;
  learning: boolean;
  curator: boolean;
  analytics: boolean;
  filesystem: boolean;
  git: boolean;
  cron: boolean;
  operations: boolean;
  plugins: boolean;
  gateway: boolean;
  updates: boolean;
  logs: boolean;
  portal: boolean;
  kanban: boolean;
  [surface: string]: boolean;
}
