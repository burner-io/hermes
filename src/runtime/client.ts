import type { HermesClient } from "../contracts/client.js";
import type { HermesRawRequest, HermesSurfaceAvailability } from "../contracts/common.js";
import type { HermesKanbanApi } from "../contracts/kanban.js";
import type {
  HermesClientOptions,
  HermesImportArchiveUpload,
  HermesKanbanEventFrame,
  HermesManagedFileStreamUpload,
  HermesRuntimeClient,
  HermesRuntimeKanbanApi,
} from "./types.js";
import { HermesHttpTransport } from "./http.js";
import { createWebSocketApi } from "./websocket.js";
import { createTuiGatewayApi } from "./gateway-rpc.js";
import { createApiServerApi } from "./api-server.js";

const enc = encodeURIComponent;
const KANBAN = "/api/plugins/kanban";

function csv(values?: string[]): string | undefined {
  return values?.length ? values.join(",") : undefined;
}

function pluginPath(name: string): string {
  return name.split("/").map(enc).join("/");
}

function profileOrDefault(transport: HermesHttpTransport, explicit?: string | null): string | undefined {
  return transport.profile(explicit);
}

function optionalProfileQuery(transport: HermesHttpTransport, explicit?: string | null) {
  const profile = profileOrDefault(transport, explicit);
  return profile ? { profile } : {};
}

function cronProfile(explicit?: string, fallback = "default"): string {
  return explicit?.trim() || fallback;
}

function boardQuery(board?: string, extra: Record<string, string | number | boolean | undefined> = {}) {
  return board ? { ...extra, board } : extra;
}

function formFile(file: Blob, filename?: string): File | Blob {
  if (typeof File !== "undefined" && file instanceof File) return file;
  if (filename && typeof File !== "undefined") return new File([file], filename, { type: file.type });
  return file;
}

function createKanbanApi(transport: HermesHttpTransport, websocket: ReturnType<typeof createWebSocketApi>): HermesRuntimeKanbanApi {
  const api: HermesKanbanApi = {
    board(input = {}) {
      return transport.request("GET", `${KANBAN}/board`, {
        query: boardQuery(input.board, {
          include_archived: input.include_archived,
          tenant: input.tenant,
          workflow_template_id: input.workflow_template_id,
          current_step_key: input.current_step_key,
        }),
      });
    },
    task(id, board) {
      return transport.request("GET", `${KANBAN}/tasks/${enc(id)}`, { query: boardQuery(board) });
    },
    createTask(input, board) {
      return transport.request("POST", `${KANBAN}/tasks`, { query: boardQuery(board), body: input });
    },
    updateTask(id, input, board) {
      return transport.request("PATCH", `${KANBAN}/tasks/${enc(id)}`, { query: boardQuery(board), body: input });
    },
    bulkTasks(input, board) {
      return transport.request("POST", `${KANBAN}/tasks/bulk`, { query: boardQuery(board), body: input });
    },
    deleteTask(id, board) {
      return transport.request("DELETE", `${KANBAN}/tasks/${enc(id)}`, { query: boardQuery(board) });
    },
    addComment(id, input, board) {
      return transport.request("POST", `${KANBAN}/tasks/${enc(id)}/comments`, {
        query: boardQuery(board),
        body: { author: input.author ?? "dashboard", body: input.body },
      });
    },
    link(parent_id, child_id, board) {
      return transport.request("POST", `${KANBAN}/links`, {
        query: boardQuery(board), body: { parent_id, child_id },
      });
    },
    unlink(parent_id, child_id, board) {
      return transport.request("DELETE", `${KANBAN}/links`, {
        query: boardQuery(board, { parent_id, child_id }),
      });
    },
    specify(id, input = {}, board) {
      return transport.request("POST", `${KANBAN}/tasks/${enc(id)}/specify`, {
        query: boardQuery(board), body: input,
      });
    },
    decompose(id, input = {}, board) {
      return transport.request("POST", `${KANBAN}/tasks/${enc(id)}/decompose`, {
        query: boardQuery(board), body: input,
      });
    },
    dispatch(board, input = {}) {
      return transport.request("POST", `${KANBAN}/dispatch`, {
        query: boardQuery(board, { dry_run: input.dry_run, max: input.max }),
      });
    },
    boards() { return transport.request("GET", `${KANBAN}/boards`); },
    createBoard(input) { return transport.request("POST", `${KANBAN}/boards`, { body: input }); },
    updateBoard(slug, input) { return transport.request("PATCH", `${KANBAN}/boards/${enc(slug)}`, { body: input }); },
    deleteBoard(slug) { return transport.request("DELETE", `${KANBAN}/boards/${enc(slug)}`); },
    switchBoard(slug) { return transport.request("POST", `${KANBAN}/boards/${enc(slug)}/switch`, { body: {} }); },
    profiles() { return transport.request("GET", `${KANBAN}/profiles`); },
    projects() { return transport.request("GET", `${KANBAN}/projects`); },
    orchestration() { return transport.request("GET", `${KANBAN}/orchestration`); },
    updateOrchestration(input) { return transport.request("PUT", `${KANBAN}/orchestration`, { body: input }); },
    activeWorkers(board) { return transport.request("GET", `${KANBAN}/workers/active`, { query: boardQuery(board) }); },
    run(runId, board) { return transport.request("GET", `${KANBAN}/runs/${enc(String(runId))}`, { query: boardQuery(board) }); },
    inspectRun(runId, board) { return transport.request("GET", `${KANBAN}/runs/${enc(String(runId))}/inspect`, { query: boardQuery(board) }); },
    terminateRun(runId, input = {}, board) {
      return transport.request("POST", `${KANBAN}/runs/${enc(String(runId))}/terminate`, { query: boardQuery(board), body: input });
    },
    reclaimTask(id, input = {}, board) {
      return transport.request("POST", `${KANBAN}/tasks/${enc(id)}/reclaim`, { query: boardQuery(board), body: input });
    },
    reassignTask(id, input, board) {
      return transport.request("POST", `${KANBAN}/tasks/${enc(id)}/reassign`, { query: boardQuery(board), body: input });
    },
    log(id, input = {}, board) {
      return transport.request("GET", `${KANBAN}/tasks/${enc(id)}/log`, { query: boardQuery(board, { tail: input.tail }) });
    },
    diagnostics(board) { return transport.request("GET", `${KANBAN}/diagnostics`, { query: boardQuery(board) }); },
    stats(board) { return transport.request("GET", `${KANBAN}/stats`, { query: boardQuery(board) }); },
    modelOptions() { return transport.request("GET", `${KANBAN}/model-options`); },
    estimateTask(id, board) {
      return transport.request("POST", `${KANBAN}/tasks/${enc(id)}/estimate`, { query: boardQuery(board), body: {} });
    },
    estimate(input) { return transport.request("POST", `${KANBAN}/estimate`, { body: input }); },
  };

  return {
    ...api,
    async events(listener, options = {}) {
      return websocket.connectJson<HermesKanbanEventFrame>(`${KANBAN}/events`, listener, {
        query: boardQuery(options.board, { since: options.cursor }),
        ...(options.onOpen ? { onOpen: options.onOpen } : {}),
        ...(options.onError ? { onError: options.onError } : {}),
        ...(options.onClose ? { onClose: options.onClose } : {}),
      });
    },
    uploadAttachment(taskId, input, board) {
      const form = new FormData();
      form.append("file", formFile(input.file, input.filename), input.filename ?? "attachment");
      if (input.uploaded_by) form.append("uploaded_by", input.uploaded_by);
      return transport.request("POST", `${KANBAN}/tasks/${enc(taskId)}/attachments`, {
        query: boardQuery(board), body: form,
      });
    },
    downloadAttachment(attachmentId, board) {
      return transport.response("GET", `${KANBAN}/attachments/${enc(String(attachmentId))}`, {
        query: boardQuery(board), response: "response",
      });
    },
    removeAttachment(attachmentId, board) {
      return transport.request("DELETE", `${KANBAN}/attachments/${enc(String(attachmentId))}`, { query: boardQuery(board) });
    },
  };
}

function createCoreClient(options: HermesClientOptions): HermesRuntimeClient {
  const transport = new HermesHttpTransport(options);
  const websocket = createWebSocketApi(transport, {
    ...(options.websocketFactory ? { websocketFactory: options.websocketFactory } : {}),
    ...(options.websocketAuth ? { websocketAuth: options.websocketAuth } : {}),
    ...(options.sessionToken ? { sessionToken: options.sessionToken } : {}),
    ...(options.internalWebSocketToken ? { internalWebSocketToken: options.internalWebSocketToken } : {}),
  });

  const tuiGateway = createTuiGatewayApi(websocket, options.websocketFactory);
  const apiServer = options.apiServer ? createApiServerApi(options.apiServer) : undefined;

  const raw: HermesClient["raw"] = {
    request<T>(request: HermesRawRequest) {
      return transport.request<T>(request.method ?? "GET", request.path, {
        ...(request.query ? { query: request.query } : {}),
        ...(request.body !== undefined ? { body: request.body } : {}),
        ...(request.headers ? { headers: request.headers } : {}),
      });
    },
  };

  const auth: HermesClient["auth"] = {
    me: () => transport.request("GET", "/api/auth/me"),
    wsTicket: () => transport.request("POST", "/api/auth/ws-ticket"),
    logout: () => transport.request("POST", "/auth/logout"),
  };

  const system: HermesClient["system"] = {
    status: () => transport.request("GET", "/api/status", { query: optionalProfileQuery(transport) }),
    stats: () => transport.request("GET", "/api/system/stats"),
  };

  const config: HermesClient["config"] = {
    get: (profile) => transport.request("GET", "/api/config", { query: optionalProfileQuery(transport, profile) }),
    defaults: () => transport.request("GET", "/api/config/defaults"),
    schema: () => transport.request("GET", "/api/config/schema"),
    getRaw: (profile) => transport.request("GET", "/api/config/raw", { query: optionalProfileQuery(transport, profile) }),
    update: (input) => transport.request("PUT", "/api/config", { body: transport.withProfileBody(input, input.profile) }),
    updateRaw: (input) => transport.request("PUT", "/api/config/raw", { body: transport.withProfileBody(input, input.profile) }),
  };

  const dashboard: HermesClient["dashboard"] = {
    themes: () => transport.request("GET", "/api/dashboard/themes"),
    setTheme: (name) => transport.request("PUT", "/api/dashboard/theme", { body: { name } }),
    font: () => transport.request("GET", "/api/dashboard/font"),
    setFont: (font) => transport.request("PUT", "/api/dashboard/font", { body: { font } }),
  };

  const env: HermesClient["env"] = {
    list: (profile) => transport.request("GET", "/api/env", { query: optionalProfileQuery(transport, profile) }),
    set: (input) => transport.request("PUT", "/api/env", { body: transport.withProfileBody(input, input.profile) }),
    remove: (input) => transport.request("DELETE", "/api/env", { body: transport.withProfileBody(input, input.profile) }),
    reveal: (input) => transport.request("POST", "/api/env/reveal", { body: transport.withProfileBody(input, input.profile) }),
  };

  const profiles: HermesClient["profiles"] = {
    list: () => transport.request("GET", "/api/profiles"),
    active: () => transport.request("GET", "/api/profiles/active"),
    setActive: (name) => transport.request("POST", "/api/profiles/active", { body: { name } }),
    create: (input) => transport.request("POST", "/api/profiles", { body: input }),
    rename: (name, input) => transport.request("PATCH", `/api/profiles/${enc(name)}`, { body: input }),
    remove: (name) => transport.request("DELETE", `/api/profiles/${enc(name)}`),
    setupCommand: (name) => transport.request("GET", `/api/profiles/${enc(name)}/setup-command`),
    getSoul: (name) => transport.request("GET", `/api/profiles/${enc(name)}/soul`),
    setSoul: (name, input) => transport.request("PUT", `/api/profiles/${enc(name)}/soul`, { body: input }),
    setDescription: (name, input) => transport.request("PUT", `/api/profiles/${enc(name)}/description`, { body: input }),
    setModel: (name, input) => transport.request("PUT", `/api/profiles/${enc(name)}/model`, { body: input }),
    describeAuto: (name, input = {}) => transport.request("POST", `/api/profiles/${enc(name)}/describe-auto`, { body: input }),
    export: (name, input = {}) => transport.request("POST", `/api/profiles/${enc(name)}/export`, { body: input }),
    import: (input) => transport.request("POST", "/api/profiles/import", { body: input }),
  };

  const skills: HermesClient["skills"] = {
    list: (profile) => transport.request("GET", "/api/skills", { query: optionalProfileQuery(transport, profile) }),
    toggle: (input) => transport.request("PUT", "/api/skills/toggle", { body: transport.withProfileBody(input, input.profile) }),
    content: (name, profile) => transport.request("GET", "/api/skills/content", {
      query: transport.withProfileQuery({ name }, profile),
    }),
    create: (input) => transport.request("POST", "/api/skills", { body: transport.withProfileBody(input, input.profile) }),
    updateContent: (input) => transport.request("PUT", "/api/skills/content", { body: transport.withProfileBody(input, input.profile) }),
    hub: {
      sources: (profile) => transport.request("GET", "/api/skills/hub/sources", { query: optionalProfileQuery(transport, profile) }),
      search: (input) => transport.request("GET", "/api/skills/hub/search", {
        query: transport.withProfileQuery({ q: input.q, source: input.source ?? "all", limit: input.limit ?? 20 }, input.profile),
      }),
      preview: (identifier, profile) => transport.request("GET", "/api/skills/hub/preview", {
        query: transport.withProfileQuery({ identifier }, profile),
      }),
      scan: (identifier, profile) => transport.request("GET", "/api/skills/hub/scan", {
        query: transport.withProfileQuery({ identifier }, profile),
      }),
      install: (input) => transport.request("POST", "/api/skills/hub/install", { body: transport.withProfileBody(input, input.profile) }),
      uninstall: (input) => transport.request("POST", "/api/skills/hub/uninstall", { body: transport.withProfileBody(input, input.profile) }),
      update: (input = {}) => transport.request("POST", "/api/skills/hub/update", { body: transport.withProfileBody(input, input.profile) }),
    },
  };

  const sessions: HermesClient["sessions"] = {
    list: (query = {}) => transport.request("GET", "/api/sessions", {
      query: transport.withProfileQuery({
        limit: query.limit,
        offset: query.offset,
        min_messages: query.min_messages,
        archived: query.archived,
        order: query.order,
        source: query.source,
        sources: query.sources,
        exclude_sources: query.exclude_sources,
        cwd_prefix: query.cwd_prefix,
        full: query.full,
      }, query.profile),
    }),
    search: (query) => transport.request("GET", "/api/sessions/search", {
      query: transport.withProfileQuery({
        q: query.q,
        limit: query.limit,
        source: query.source,
        sources: query.sources,
        exclude_sources: query.exclude_sources,
      }, query.profile),
    }),
    detail: (id, profile) => transport.request("GET", `/api/sessions/${enc(id)}`, { query: optionalProfileQuery(transport, profile) }),
    latestDescendant: (id, profile) => transport.request("GET", `/api/sessions/${enc(id)}/latest-descendant`, { query: optionalProfileQuery(transport, profile) }),
    messages: (id, query = {}) => transport.request("GET", `/api/sessions/${enc(id)}/messages`, {
      query: transport.withProfileQuery({ limit: query.limit, offset: query.offset, order: query.order }, query.profile),
    }),
    update: (id, input) => transport.request("PATCH", `/api/sessions/${enc(id)}`, { body: transport.withProfileBody(input, input.profile) }),
    remove: (id, profile) => transport.request("DELETE", `/api/sessions/${enc(id)}`, { query: optionalProfileQuery(transport, profile) }),
    deleteMany: (input) => transport.request("POST", "/api/sessions/bulk-delete", { body: transport.withProfileBody(input, input.profile) }),
    import: (input) => transport.request("POST", "/api/sessions/import", { body: transport.withProfileBody(input, input.profile) }),
    export: (id, profile) => transport.request("GET", `/api/sessions/${enc(id)}/export`, { query: optionalProfileQuery(transport, profile) }),
    emptyCount: (profile) => transport.request("GET", "/api/sessions/empty/count", { query: optionalProfileQuery(transport, profile) }),
    deleteEmpty: (profile) => transport.request("DELETE", "/api/sessions/empty", { query: optionalProfileQuery(transport, profile) }),
    stats: (profile) => transport.request("GET", "/api/sessions/stats", { query: optionalProfileQuery(transport, profile) }),
    prune: (input) => transport.request("POST", "/api/sessions/prune", { body: transport.withProfileBody(input, input.profile) }),
  };

  const tools: HermesClient["tools"] = {
    list: (profile) => transport.request("GET", "/api/tools/toolsets", { query: optionalProfileQuery(transport, profile) }),
    config: (name, profile) => transport.request("GET", `/api/tools/toolsets/${enc(name)}/config`, { query: optionalProfileQuery(transport, profile) }),
    toggle: (name, input) => transport.request("PUT", `/api/tools/toolsets/${enc(name)}`, { body: transport.withProfileBody(input, input.profile) }),
    selectProvider: (name, input) => transport.request("PUT", `/api/tools/toolsets/${enc(name)}/provider`, { body: transport.withProfileBody(input, input.profile) }),
    models: (name, profile) => transport.request("GET", `/api/tools/toolsets/${enc(name)}/models`, { query: optionalProfileQuery(transport, profile) }),
    selectModel: (name, input) => transport.request("PUT", `/api/tools/toolsets/${enc(name)}/model`, { body: transport.withProfileBody(input, input.profile) }),
    updateEnv: (name, input) => transport.request("PUT", `/api/tools/toolsets/${enc(name)}/env`, { body: transport.withProfileBody(input, input.profile) }),
    postSetup: (name, input) => transport.request("POST", `/api/tools/toolsets/${enc(name)}/post-setup`, { body: transport.withProfileBody(input, input.profile) }),
    terminalBackends: (profile) => transport.request("GET", "/api/tools/terminal/backends", { query: optionalProfileQuery(transport, profile) }),
    selectTerminalBackend: (input) => transport.request("PUT", "/api/tools/terminal/backend", { body: transport.withProfileBody(input, input.profile) }),
    computerUseStatus: (profile) => transport.request("GET", "/api/tools/computer-use/status", { query: optionalProfileQuery(transport, profile) }),
  };

  const mcp: HermesClient["mcp"] = {
    servers: (profile) => transport.request("GET", "/api/mcp/servers", { query: optionalProfileQuery(transport, profile) }),
    create: (input) => transport.request("POST", "/api/mcp/servers", { body: transport.withProfileBody(input, input.profile) }),
    replace: (input) => transport.request("PUT", "/api/mcp/servers", { body: transport.withProfileBody(input, input.profile) }),
    remove: (name, profile) => transport.request("DELETE", `/api/mcp/servers/${enc(name)}`, { query: optionalProfileQuery(transport, profile) }),
    test: (name, profile) => transport.request("POST", `/api/mcp/servers/${enc(name)}/test`, { query: optionalProfileQuery(transport, profile) }),
    toggle: (name, input) => transport.request("PUT", `/api/mcp/servers/${enc(name)}/enabled`, { body: transport.withProfileBody(input, input.profile) }),
    auth: (name, profile) => transport.request("POST", `/api/mcp/servers/${enc(name)}/auth`, { query: optionalProfileQuery(transport, profile) }),
    oauthFlow: (flowId, profile) => transport.request("GET", `/api/mcp/oauth/flows/${enc(flowId)}`, { query: optionalProfileQuery(transport, profile) }),
    catalog: (profile) => transport.request("GET", "/api/mcp/catalog", { query: optionalProfileQuery(transport, profile) }),
    installCatalog: (input) => transport.request("POST", "/api/mcp/catalog/install", { body: transport.withProfileBody(input, input.profile) }),
  };

  const models: HermesClient["models"] = {
    info: (profile) => transport.request("GET", "/api/model/info", { query: optionalProfileQuery(transport, profile) }),
    options: (query = {}) => transport.request("GET", "/api/model/options", {
      query: transport.withProfileQuery({
        pricing: query.pricing,
        capabilities: query.capabilities,
        include_unconfigured: query.include_unconfigured,
      }, query.profile),
    }),
    set: (input) => transport.request("POST", "/api/model/set", { body: transport.withProfileBody(input, input.profile) }),
    auxiliary: (profile) => transport.request("GET", "/api/model/auxiliary", { query: optionalProfileQuery(transport, profile) }),
    moa: (profile) => transport.request("GET", "/api/model/moa", { query: optionalProfileQuery(transport, profile) }),
    saveMoa: (input, profile) => transport.request("PUT", "/api/model/moa", {
      query: optionalProfileQuery(transport, profile), body: input,
    }),
  };

  const providers: HermesClient["providers"] = {
    oauth: {
      list: () => transport.request("GET", "/api/providers/oauth"),
      disconnect: (id) => transport.request("DELETE", `/api/providers/oauth/${enc(id)}`),
      start: (id) => transport.request("POST", `/api/providers/oauth/${enc(id)}/start`),
      submit: (id, input) => transport.request("POST", `/api/providers/oauth/${enc(id)}/submit`, { body: input }),
      poll: (id, sid) => transport.request("GET", `/api/providers/oauth/${enc(id)}/poll/${enc(sid)}`),
      cancel: (sid) => transport.request("DELETE", `/api/providers/oauth/sessions/${enc(sid)}`),
    },
    custom_endpoints: {
      list: () => transport.request("GET", "/api/providers/custom-endpoints"),
      save: (input) => transport.request("POST", "/api/providers/custom-endpoints", { body: input }),
      activate: (id) => transport.request("POST", `/api/providers/custom-endpoints/${enc(id)}/activate`, { body: {} }),
      remove: (id) => transport.request("DELETE", `/api/providers/custom-endpoints/${enc(id)}`),
      validate: (input) => transport.request("POST", "/api/providers/custom-endpoints/validate", { body: input }),
    },
    validate: (input) => transport.request("POST", "/api/providers/validate", { body: input }),
  };

  const audio: HermesClient["audio"] = {
    transcribe: (input, profile) => transport.request("POST", "/api/audio/transcribe", { query: optionalProfileQuery(transport, profile), body: input, timeoutMs: 120_000 }),
    elevenLabsVoices: (profile) => transport.request("GET", "/api/audio/elevenlabs/voices", { query: optionalProfileQuery(transport, profile) }),
    speak: (input, profile) => transport.request("POST", "/api/audio/speak", { query: optionalProfileQuery(transport, profile), body: input, timeoutMs: 120_000 }),
  };

  const messaging: HermesClient["messaging"] = {
    platforms: (profile) => transport.request("GET", "/api/messaging/platforms", { query: optionalProfileQuery(transport, profile) }),
    update: (id, input) => transport.request("PUT", `/api/messaging/platforms/${enc(id)}`, { body: transport.withProfileBody(input, input.profile) }),
    test: (id, profile) => transport.request("POST", `/api/messaging/platforms/${enc(id)}/test`, { query: optionalProfileQuery(transport, profile) }),
    pairing: {
      list: (profile) => transport.request("GET", "/api/pairing", { query: optionalProfileQuery(transport, profile) }),
      approve: (input) => transport.request("POST", "/api/pairing/approve", { body: transport.withProfileBody(input, input.profile) }),
      revoke: (input) => transport.request("POST", "/api/pairing/revoke", { body: transport.withProfileBody(input, input.profile) }),
      clearPending: (profile) => transport.request("POST", "/api/pairing/clear-pending", { query: optionalProfileQuery(transport, profile), body: {} }),
    },
    onboarding: {
      telegram: {
        start: (input = {}) => transport.request("POST", "/api/messaging/telegram/onboarding/start", { query: optionalProfileQuery(transport), body: input }),
        status: (id) => transport.request("GET", `/api/messaging/telegram/onboarding/${enc(id)}`, { query: optionalProfileQuery(transport) }),
        apply: (id, input) => transport.request("POST", `/api/messaging/telegram/onboarding/${enc(id)}/apply`, { body: transport.withProfileBody(input, input.profile) }),
        cancel: (id) => transport.request("DELETE", `/api/messaging/telegram/onboarding/${enc(id)}`, { query: optionalProfileQuery(transport) }),
      },
      whatsapp: {
        start: (input = {}) => transport.request("POST", "/api/messaging/whatsapp/onboarding/start", { query: optionalProfileQuery(transport), body: input }),
        status: (id) => transport.request("GET", `/api/messaging/whatsapp/onboarding/${enc(id)}`, { query: optionalProfileQuery(transport) }),
        apply: (id, input) => transport.request("POST", `/api/messaging/whatsapp/onboarding/${enc(id)}/apply`, { body: transport.withProfileBody(input, input.profile) }),
        cancel: (id) => transport.request("DELETE", `/api/messaging/whatsapp/onboarding/${enc(id)}`, { query: optionalProfileQuery(transport) }),
      },
    },
  };

  const webhooks: HermesClient["webhooks"] = {
    list: () => transport.request("GET", "/api/webhooks"),
    enable: () => transport.request("POST", "/api/webhooks/enable"),
    create: (input) => transport.request("POST", "/api/webhooks", { body: input }),
    remove: (name) => transport.request("DELETE", `/api/webhooks/${enc(name)}`),
    setEnabled: (name, enabled) => transport.request("PUT", `/api/webhooks/${enc(name)}/enabled`, { body: { enabled } }),
  };

  const credentials: HermesClient["credentials"] = {
    pool: () => transport.request("GET", "/api/credentials/pool"),
    add: (input) => transport.request("POST", "/api/credentials/pool", { body: input }),
    remove: (provider, index) => transport.request("DELETE", `/api/credentials/pool/${enc(provider)}/${index}`),
  };

  const memory: HermesClient["memory"] = {
    status: () => transport.request("GET", "/api/memory"),
    select: (input) => transport.request("PUT", "/api/memory/provider", { body: input }),
    reset: (input = {}) => transport.request("POST", "/api/memory/reset", { body: input }),
    providerConfig: (name) => transport.request("GET", `/api/memory/providers/${enc(name)}/config`),
    setupProvider: (name, input = {}) => transport.request("POST", `/api/memory/providers/${enc(name)}/setup`, { body: input }),
    updateProviderConfig: (name, input = {}) => transport.request("PUT", `/api/memory/providers/${enc(name)}/config`, { body: input }),
  };

  const learning: HermesClient["learning"] = {
    graph: (profile) => transport.request("GET", "/api/learning/graph", { query: optionalProfileQuery(transport, profile) }),
    node: (input) => transport.request("GET", "/api/learning/node", { query: transport.withProfileQuery({ id: input.id }, input.profile) }),
    removeNode: (input) => transport.request("DELETE", "/api/learning/node", { body: transport.withProfileBody(input, input.profile) }),
    updateNode: (input) => transport.request("PUT", "/api/learning/node", { body: transport.withProfileBody(input, input.profile) }),
  };

  const curator: HermesClient["curator"] = {
    status: () => transport.request("GET", "/api/curator"),
    setPaused: (paused) => transport.request("PUT", "/api/curator/paused", { body: { paused } }),
    run: () => transport.request("POST", "/api/curator/run"),
  };

  const analytics: HermesClient["analytics"] = {
    usage: (input = {}) => transport.request("GET", "/api/analytics/usage", {
      query: transport.withProfileQuery({ days: input.days ?? 30 }, input.profile),
    }),
    models: (input = {}) => transport.request("GET", "/api/analytics/models", {
      query: transport.withProfileQuery({ days: input.days ?? 30 }, input.profile),
    }),
  };

  const filesystem: HermesClient["filesystem"] = {
    managed: {
      list: (path) => transport.request("GET", "/api/files", { query: { path } }),
      read: (path) => transport.request("GET", "/api/files/read", { query: { path } }),
      download: (path) => transport.response("GET", "/api/files/download", { query: { path }, response: "response" }),
      upload: (input) => transport.request("POST", "/api/files/upload", { body: input }),
      uploadStream: (input) => {
        const value = input as HermesManagedFileStreamUpload;
        const form = new FormData();
        form.append("path", value.path);
        form.append("overwrite", String(value.overwrite ?? true));
        form.append("file", formFile(value.file, value.filename), value.filename ?? "upload");
        return transport.request("POST", "/api/files/upload-stream", { body: form });
      },
      mkdir: (input) => transport.request("POST", "/api/files/mkdir", { body: input }),
      remove: (input) => transport.request("DELETE", "/api/files", { body: input }),
    },
    fs: {
      list: (path) => transport.request("GET", "/api/fs/list", { query: { path } }),
      readText: (path) => transport.request("GET", "/api/fs/read-text", { query: { path } }),
      writeText: (input) => transport.request("POST", "/api/fs/write-text", { body: input }),
      readDataUrl: (path) => transport.request("GET", "/api/fs/read-data-url", { query: { path } }),
      gitRoot: (path) => transport.request("GET", "/api/fs/git-root", { query: { path } }),
      defaultCwd: () => transport.request("GET", "/api/fs/default-cwd"),
    },
  };

  const git: HermesClient["git"] = {
    status: (path) => transport.request("GET", "/api/git/status", { query: { path } }),
    worktrees: (path) => transport.request("GET", "/api/git/worktrees", { query: { path } }),
    branches: (path) => transport.request("GET", "/api/git/branches", { query: { path } }),
    baseBranches: (path) => transport.request("GET", "/api/git/base-branches", { query: { path } }),
    reviewList: (input) => transport.request("GET", "/api/git/review/list", { query: input }),
    reviewDiff: (input) => transport.request("GET", "/api/git/review/diff", { query: input }),
    fileDiff: (path, file) => transport.request("GET", "/api/git/file-diff", { query: { path, file } }),
    commitContext: (path) => transport.request("GET", "/api/git/review/commit-context", { query: { path } }),
    revParse: (path, ref) => transport.request("GET", "/api/git/review/rev-parse", { query: { path, ref } }),
    shipInfo: (path) => transport.request("GET", "/api/git/review/ship-info", { query: { path } }),
    prList: (input) => transport.request("POST", "/api/git/review/pr-list", { body: input }),
    stage: (input) => transport.request("POST", "/api/git/review/stage", { body: input }),
    unstage: (input) => transport.request("POST", "/api/git/review/unstage", { body: input }),
    revert: (input) => transport.request("POST", "/api/git/review/revert", { body: input }),
    commit: (input) => transport.request("POST", "/api/git/review/commit", { body: input }),
    push: (input) => transport.request("POST", "/api/git/review/push", { body: input }),
    createPr: (input) => transport.request("POST", "/api/git/review/create-pr", { body: input }),
    addWorktree: (input) => transport.request("POST", "/api/git/worktree/add", { body: input }),
    removeWorktree: (input) => transport.request("POST", "/api/git/worktree/remove", { body: input }),
    switchBranch: (input) => transport.request("POST", "/api/git/branch/switch", { body: input }),
  };

  const cron: HermesClient["cron"] = {
    list: (profile) => transport.request("GET", "/api/cron/jobs", { query: { profile: cronProfile(profile, "all") } }),
    create: (input, profile) => transport.request("POST", "/api/cron/jobs", { query: { profile: cronProfile(profile) }, body: input }),
    update: (id, input, profile) => transport.request("PUT", `/api/cron/jobs/${enc(id)}`, { query: { profile: cronProfile(profile) }, body: input }),
    pause: (id, profile) => transport.request("POST", `/api/cron/jobs/${enc(id)}/pause`, { query: { profile: cronProfile(profile) } }),
    resume: (id, profile) => transport.request("POST", `/api/cron/jobs/${enc(id)}/resume`, { query: { profile: cronProfile(profile) } }),
    trigger: (id, profile) => transport.request("POST", `/api/cron/jobs/${enc(id)}/trigger`, { query: { profile: cronProfile(profile) } }),
    remove: (id, profile) => transport.request("DELETE", `/api/cron/jobs/${enc(id)}`, { query: { profile: cronProfile(profile) } }),
    deliveryTargets: () => transport.request("GET", "/api/cron/delivery-targets"),
    blueprints: () => transport.request("GET", "/api/cron/blueprints"),
    instantiateBlueprint: (input, profile) => transport.request("POST", "/api/cron/blueprints/instantiate", { query: { profile: cronProfile(profile) }, body: input }),
  };

  const operations: HermesClient["operations"] = {
    promptSize: () => transport.request("POST", "/api/ops/prompt-size"),
    dump: () => transport.request("POST", "/api/ops/dump"),
    migrateConfig: () => transport.request("POST", "/api/ops/config-migrate"),
    debugShare: (input = {}) => transport.request("POST", "/api/ops/debug-share", { body: input }),
    doctor: () => transport.request("POST", "/api/ops/doctor"),
    securityAudit: () => transport.request("POST", "/api/ops/security-audit"),
    backup: (input = {}) => transport.request("POST", "/api/ops/backup", { body: input }),
    backupDownload: (path) => transport.response("GET", "/api/ops/backup/download", { query: { archive: path }, response: "response" }),
    import: (input) => transport.request("POST", "/api/ops/import", { body: input }),
    importUpload: (input) => {
      const value = input as HermesImportArchiveUpload;
      const form = new FormData();
      form.append("force", String(value.force ?? false));
      form.append("file", formFile(value.file, value.filename), value.filename ?? "hermes-backup.zip");
      return transport.request("POST", "/api/ops/import-upload", { body: form });
    },
    hooks: () => transport.request("GET", "/api/ops/hooks"),
    createHook: (input) => transport.request("POST", "/api/ops/hooks", { body: input }),
    deleteHook: (input) => transport.request("DELETE", "/api/ops/hooks", { body: input }),
    checkpoints: () => transport.request("GET", "/api/ops/checkpoints"),
    pruneCheckpoints: (input = {}) => transport.request("POST", "/api/ops/checkpoints/prune", { body: input }),
    actionStatus: (name, lines = 200) => transport.request("GET", `/api/actions/${enc(name)}/status`, { query: { lines } }),
  };

  const plugins: HermesClient["plugins"] = {
    list: () => transport.request("GET", "/api/dashboard/plugins"),
    rescan: () => transport.request("GET", "/api/dashboard/plugins/rescan"),
    hub: () => transport.request("GET", "/api/dashboard/plugins/hub"),
    install: (input) => transport.request("POST", "/api/dashboard/agent-plugins/install", { body: input }),
    enable: (name) => transport.request("POST", `/api/dashboard/agent-plugins/${pluginPath(name)}/enable`),
    disable: (name) => transport.request("POST", `/api/dashboard/agent-plugins/${pluginPath(name)}/disable`),
    update: (name) => transport.request("POST", `/api/dashboard/agent-plugins/${pluginPath(name)}/update`),
    remove: (name) => transport.request("DELETE", `/api/dashboard/agent-plugins/${pluginPath(name)}`),
    setProviders: (input) => transport.request("PUT", "/api/dashboard/plugin-providers", { body: input }),
    setVisibility: (name, input) => transport.request("POST", `/api/dashboard/plugins/${pluginPath(name)}/visibility`, { body: input }),
  };

  const gateway: HermesClient["gateway"] = {
    start: () => transport.request("POST", "/api/gateway/start", { query: optionalProfileQuery(transport) }),
    stop: () => transport.request("POST", "/api/gateway/stop", { query: optionalProfileQuery(transport) }),
    restart: () => transport.request("POST", "/api/gateway/restart", { query: optionalProfileQuery(transport) }),
    drain: (input) => transport.request("POST", "/api/gateway/drain", { query: optionalProfileQuery(transport), body: input }),
  };

  const updates: HermesClient["updates"] = {
    check: (force = false) => transport.request("GET", "/api/hermes/update/check", { query: { force: force || undefined } }),
    apply: () => transport.request("POST", "/api/hermes/update"),
  };

  const logs: HermesClient["logs"] = {
    get: (input = {}) => transport.request("GET", "/api/logs", {
      query: {
        file: input.file, lines: input.lines, level: input.level,
        component: input.component, search: input.search,
      },
    }),
  };

  const portal: HermesClient["portal"] = {
    get: (profile) => transport.request("GET", "/api/portal", { query: optionalProfileQuery(transport, profile) }),
  };

  let surfaceCache: { at: number; value: HermesSurfaceAvailability } | undefined;
  const surfaceCacheMs = options.surfaceCacheMs ?? 30_000;
  const probes: Record<Exclude<keyof HermesSurfaceAvailability, number | symbol>, string> = {
    auth: "/api/auth/me",
    system: "/api/status",
    config: "/api/config",
    dashboard: "/api/dashboard/themes",
    env: "/api/env",
    profiles: "/api/profiles",
    skills: "/api/skills",
    sessions: "/api/sessions",
    tools: "/api/tools/toolsets",
    mcp: "/api/mcp/servers",
    models: "/api/model/info",
    providers: "/api/providers/oauth",
    audio: "/api/audio/elevenlabs/voices",
    messaging: "/api/messaging/platforms",
    webhooks: "/api/webhooks",
    credentials: "/api/credentials/pool",
    memory: "/api/memory",
    learning: "/api/learning/graph",
    curator: "/api/curator",
    analytics: "/api/analytics/usage",
    filesystem: "/api/files",
    git: "/api/git/status",
    cron: "/api/cron/jobs",
    operations: "/api/ops/hooks",
    plugins: "/api/dashboard/plugins",
    gateway: "/api/status",
    updates: "/api/hermes/update/check",
    logs: "/api/logs",
    portal: "/api/portal",
    kanban: `${KANBAN}/board`,
  };

  const client: HermesRuntimeClient = {
    raw,
    auth,
    system,
    config,
    dashboard,
    env,
    profiles,
    skills,
    sessions,
    tools,
    mcp,
    models,
    providers,
    audio,
    messaging,
    webhooks,
    credentials,
    memory,
    learning,
    curator,
    analytics,
    filesystem,
    git,
    cron,
    operations,
    plugins,
    gateway,
    updates,
    logs,
    portal,
    websocket,
    tuiGateway,
    ...(apiServer ? { apiServer } : {}),
    response: (method, path, request = {}) => transport.response(method, path, request),
    async surfaces() {
      if (surfaceCache && Date.now() - surfaceCache.at < surfaceCacheMs) return surfaceCache.value;
      const entries = await Promise.all(Object.entries(probes).map(async ([name, path]) => {
        let query: Record<string, string | number | boolean | undefined> | undefined;
        if (name === "git") query = { path: "." };
        if (name === "analytics") query = { days: 1 };
        if (name === "cron") query = { profile: "all" };
        return [name, await transport.probe(path, query)] as const;
      }));
      const value = Object.fromEntries(entries) as HermesSurfaceAvailability;
      surfaceCache = { at: Date.now(), value };
      return value;
    },
  };

  return client;
}

/**
 * Create a Hermes-native client and probe optional plugin surfaces.
 * Core namespaces remain available as typed methods so older/newer servers can
 * still be addressed; `surfaces()` is the authoritative reachability report.
 */
export async function createHermesClient(options: HermesClientOptions): Promise<HermesRuntimeClient> {
  const client = createCoreClient(options);
  if (options.probeOnCreate === false) {
    client.kanban = createKanbanApi(
      new HermesHttpTransport(options),
      client.websocket as ReturnType<typeof createWebSocketApi>,
    );
    return client;
  }

  const transport = new HermesHttpTransport(options);
  if (await transport.probe(`${KANBAN}/board`)) {
    client.kanban = createKanbanApi(transport, client.websocket as ReturnType<typeof createWebSocketApi>);
  }
  return client;
}

/** Create the client without any network probe. Useful for SSR/tests/bootstrap. */
export function createHermesClientUnchecked(options: HermesClientOptions): HermesRuntimeClient {
  const client = createCoreClient(options);
  const transport = new HermesHttpTransport(options);
  client.kanban = createKanbanApi(transport, client.websocket as ReturnType<typeof createWebSocketApi>);
  return client;
}
