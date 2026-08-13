import type { HermesAnalyticsApi } from "./analytics.js";
import type { HermesAuthApi } from "./auth.js";
import type { HermesAudioApi } from "./audio.js";
import type { HermesConfigApi } from "./config.js";
import type { HermesCredentialsApi } from "./credentials.js";
import type { HermesDashboardApi } from "./dashboard.js";
import type { HermesCronApi } from "./cron.js";
import type { HermesEnvApi } from "./env.js";
import type { HermesFilesystemApi } from "./filesystem.js";
import type { HermesGatewayApi } from "./gateway.js";
import type { HermesGitApi } from "./git.js";
import type { HermesKanbanApi } from "./kanban.js";
import type { HermesCuratorApi, HermesLearningApi } from "./learning.js";
import type { HermesLogsApi } from "./logs.js";
import type { HermesMcpApi } from "./mcp.js";
import type { HermesMemoryApi } from "./memory.js";
import type { HermesMessagingApi } from "./messaging.js";
import type { HermesModelsApi } from "./models.js";
import type { HermesOperationsApi } from "./operations.js";
import type { HermesPluginsApi } from "./plugins.js";
import type { HermesPortalApi } from "./portal.js";
import type { HermesProfilesApi } from "./profiles.js";
import type { HermesProvidersApi } from "./providers.js";
import type { HermesRawApi, HermesSurfaceAvailability } from "./common.js";
import type { HermesSessionsApi } from "./sessions.js";
import type { HermesSkillsApi } from "./skills.js";
import type { HermesSystemApi } from "./system.js";
import type { HermesToolsApi } from "./tools.js";
import type { HermesUpdatesApi } from "./updates.js";
import type { HermesWebhooksApi } from "./webhooks.js";

/**
 * Type-level façade for native Hermes surfaces only.
 *
 * No product/project/workflow abstraction is represented here. Optional
 * namespaces reflect Hermes features/plugins that can be absent on a connected
 * instance. A concrete client implementation must probe reachability.
 */
export interface HermesClient {
  raw: HermesRawApi;
  auth: HermesAuthApi;
  system: HermesSystemApi;
  config: HermesConfigApi;
  dashboard: HermesDashboardApi;
  env: HermesEnvApi;
  profiles: HermesProfilesApi;
  skills: HermesSkillsApi;
  sessions: HermesSessionsApi;
  tools: HermesToolsApi;
  mcp: HermesMcpApi;
  models: HermesModelsApi;
  providers: HermesProvidersApi;
  audio: HermesAudioApi;
  messaging: HermesMessagingApi;
  webhooks: HermesWebhooksApi;
  credentials: HermesCredentialsApi;
  memory: HermesMemoryApi;
  learning: HermesLearningApi;
  curator: HermesCuratorApi;
  analytics: HermesAnalyticsApi;
  filesystem: HermesFilesystemApi;
  git: HermesGitApi;
  cron: HermesCronApi;
  operations: HermesOperationsApi;
  plugins: HermesPluginsApi;
  gateway: HermesGatewayApi;
  updates: HermesUpdatesApi;
  logs: HermesLogsApi;
  portal: HermesPortalApi;

  /** Kanban is a Hermes plugin surface and therefore install/version gated. */
  kanban?: HermesKanbanApi;

  /** SDK-observed reachability, never Hermes domain state. */
  surfaces(): Promise<HermesSurfaceAvailability>;
}

