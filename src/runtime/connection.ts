import type {
  HermesApiServerApi,
  HermesConnection,
  HermesConnectionOptions,
  HermesRuntimeClient,
} from "./types.js";
import { createApiServerApi } from "./api-server.js";
import { createHermesClient, createHermesClientUnchecked } from "./client.js";

function apiOptions(options: HermesConnectionOptions) {
  return {
    baseUrl: options.baseUrl,
    apiKey: options.apiKey,
    ...(options.profile ? { profile: options.profile } : {}),
    ...(options.fetch ? { fetch: options.fetch } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
  };
}

function controlOptions(options: HermesConnectionOptions) {
  return {
    baseUrl: options.baseUrl,
    // The private machine connection uses API_SERVER_KEY as Bearer auth on the
    // shared Hermes origin. Legacy dashboard/session auth remains available on
    // the lower-level createHermesClient* APIs, but is deliberately not part of
    // this high-level connection helper.
    bearerToken: options.apiKey,
    ...(options.profile ? { profile: options.profile } : {}),
    ...(options.fetch ? { fetch: options.fetch } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
    ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    ...(options.websocketFactory ? { websocketFactory: options.websocketFactory } : {}),
    ...(options.websocketAuth ? { websocketAuth: options.websocketAuth } : {}),
    ...(options.internalWebSocketToken ? { internalWebSocketToken: options.internalWebSocketToken } : {}),
    ...(options.surfaceCacheMs !== undefined ? { surfaceCacheMs: options.surfaceCacheMs } : {}),
    ...(options.probeOnCreate !== undefined ? { probeOnCreate: options.probeOnCreate } : {}),
    apiServer: apiOptions(options),
  };
}

function assemble(baseUrl: string, control: HermesRuntimeClient, apiServer: HermesApiServerApi): HermesConnection {
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    control,
    apiServer,
    runs: apiServer.runs,
    capabilities: () => apiServer.capabilities(),
    models: () => apiServer.models(),
    health: (detailed = false) => apiServer.health(detailed),
  };
}

/**
 * Create one trusted machine connection to Hermes.
 *
 * `control` and `apiServer` are typed SDK facades over the same `baseUrl` and
 * `apiKey`. They are not separate application upstreams or credentials.
 */
export async function createHermesConnection(options: HermesConnectionOptions): Promise<HermesConnection> {
  if (!options.baseUrl) throw new TypeError("Hermes baseUrl is required");
  if (!options.apiKey) throw new TypeError("Hermes apiKey is required");

  const control = await createHermesClient(controlOptions(options));
  const apiServer = control.apiServer ?? createApiServerApi(apiOptions(options));
  return assemble(options.baseUrl, control, apiServer);
}

/** Create the same one-origin connection without optional surface probes. */
export function createHermesConnectionUnchecked(options: HermesConnectionOptions): HermesConnection {
  if (!options.baseUrl) throw new TypeError("Hermes baseUrl is required");
  if (!options.apiKey) throw new TypeError("Hermes apiKey is required");

  const control = createHermesClientUnchecked({
    ...controlOptions(options),
    probeOnCreate: false,
  });
  const apiServer = control.apiServer ?? createApiServerApi(apiOptions(options));
  return assemble(options.baseUrl, control, apiServer);
}
