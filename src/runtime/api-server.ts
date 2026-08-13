import type {
  HermesApiRun,
  HermesApiRunApprovalRequest,
  HermesApiRunCreateRequest,
  HermesApiRunCreateResponse,
  HermesApiRunEvent,
  HermesApiServerCapabilities,
  HermesApiServerModelsResponse,
} from "../contracts/programmatic.js";
import { buildHttpUrl, HermesHttpError, resolveToken } from "./http.js";
import type {
  HermesApiServerApi,
  HermesApiServerClientOptions,
  HermesApiServerRunEventsOptions,
  HermesApiServerWaitOptions,
} from "./types.js";

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function withProfilePath(path: string, profile?: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const value = profile?.trim();
  return value ? `/p/${encodeURIComponent(value)}${normalized}` : normalized;
}

function isNativeBody(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof Blob ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body)
  );
}

async function errorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    try { return await response.clone().json(); } catch { /* fall through */ }
  }
  try { return await response.clone().text(); } catch { return undefined; }
}

async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

function parseSseData(raw: string, eventName?: string): HermesApiRunEvent {
  if (!raw) return eventName ? { event: eventName } : {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        ...(parsed as Record<string, unknown>),
        ...(eventName && !("event" in (parsed as Record<string, unknown>)) ? { event: eventName } : {}),
      };
    }
    return {
      ...(eventName ? { event: eventName } : {}),
      data: parsed,
    };
  } catch {
    return {
      ...(eventName ? { event: eventName } : {}),
      data: raw,
    };
  }
}

async function consumeSse(
  response: Response,
  listener: (event: HermesApiRunEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  if (!response.body) throw new Error("Hermes API Server SSE response has no body");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName: string | undefined;
  let dataLines: string[] = [];

  const dispatch = () => {
    if (!dataLines.length && !eventName) return;
    const raw = dataLines.join("\n");
    if (raw !== "[DONE]") listener(parseSseData(raw, eventName));
    eventName = undefined;
    dataLines = [];
  };

  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      while (true) {
        const newline = buffer.indexOf("\n");
        if (newline < 0) break;
        let line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line) {
          dispatch();
          continue;
        }
        if (line.startsWith(":")) continue;
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
    }
    if (buffer || dataLines.length || eventName) {
      const line = buffer.replace(/\r$/, "");
      if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      dispatch();
    }
  } finally {
    try { await reader.cancel(); } catch { /* noop */ }
  }
}

export function createApiServerApi(options: HermesApiServerClientOptions): HermesApiServerApi {
  if (!options.baseUrl) throw new TypeError("Hermes API Server baseUrl is required");
  const baseUrl = trimSlash(options.baseUrl);
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (!fetchImpl) throw new Error("No fetch implementation is available");

  async function response(
    method: string,
    path: string,
    input: {
      query?: Record<string, string | number | boolean | undefined | null>;
      body?: unknown;
      headers?: HeadersInit;
      signal?: AbortSignal;
      timeoutMs?: number;
    } = {},
  ): Promise<Response> {
    const url = buildHttpUrl(baseUrl, withProfilePath(path, options.profile), input.query);
    const headers = new Headers(options.headers);
    new Headers(input.headers).forEach((value, key) => headers.set(key, value));
    const apiKey = await resolveToken(options.apiKey);
    if (apiKey && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${apiKey}`);

    let body: BodyInit | undefined;
    if (input.body !== undefined) {
      if (isNativeBody(input.body)) body = input.body;
      else {
        body = JSON.stringify(input.body);
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      }
    }

    const controller = new AbortController();
    const forwardAbort = () => controller.abort(input.signal?.reason);
    if (input.signal) {
      if (input.signal.aborted) forwardAbort();
      else input.signal.addEventListener("abort", forwardAbort, { once: true });
    }
    const timeoutMs = input.timeoutMs ?? options.timeoutMs ?? 30_000;
    const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
    try {
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
        ...(body !== undefined ? { body } : {}),
      };
      const result = await fetchImpl(url, init);
      if (!result.ok) {
        throw new HermesHttpError({
          status: result.status,
          statusText: result.statusText,
          url,
          body: await errorBody(result),
        });
      }
      return result;
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
      input.signal?.removeEventListener("abort", forwardAbort);
    }
  }

  async function request<T>(
    method: string,
    path: string,
    input: {
      query?: Record<string, string | number | boolean | undefined | null>;
      body?: unknown;
      headers?: HeadersInit;
      signal?: AbortSignal;
      timeoutMs?: number;
    } = {},
  ): Promise<T> {
    const result = await response(method, path, input);
    if (result.status === 204) return undefined as T;
    const contentType = result.headers.get("content-type") ?? "";
    if (contentType.includes("json")) return result.json() as Promise<T>;
    const text = await result.text();
    if (!text) return undefined as T;
    try { return JSON.parse(text) as T; } catch { return text as T; }
  }

  const api: HermesApiServerApi = {
    capabilities: () => request<HermesApiServerCapabilities>("GET", "/v1/capabilities"),
    models: () => request<HermesApiServerModelsResponse>("GET", "/v1/models"),
    health: (detailed = false) => request("GET", detailed ? "/health/detailed" : "/health"),
    runs: {
      create: (input: HermesApiRunCreateRequest) => request<HermesApiRunCreateResponse>("POST", "/v1/runs", { body: input }),
      get: (runId: string) => request<HermesApiRun>("GET", `/v1/runs/${encodeURIComponent(runId)}`),
      stop: (runId: string) => request("POST", `/v1/runs/${encodeURIComponent(runId)}/stop`, { body: {} }),
      approve: (runId: string, input: HermesApiRunApprovalRequest) => request("POST", `/v1/runs/${encodeURIComponent(runId)}/approval`, { body: input }),
      async events(
        runId: string,
        listener: (event: HermesApiRunEvent) => void,
        eventsOptions: HermesApiServerRunEventsOptions = {},
      ): Promise<() => void> {
        const controller = new AbortController();
        const forwardAbort = () => controller.abort(eventsOptions.signal?.reason);
        if (eventsOptions.signal) {
          if (eventsOptions.signal.aborted) forwardAbort();
          else eventsOptions.signal.addEventListener("abort", forwardAbort, { once: true });
        }
        const stream = await response("GET", `/v1/runs/${encodeURIComponent(runId)}/events`, {
          headers: { Accept: "text/event-stream" },
          signal: controller.signal,
          timeoutMs: 0,
        });
        void consumeSse(stream, listener, controller.signal).catch((error) => {
          if (!controller.signal.aborted) eventsOptions.onError?.(error);
        }).finally(() => {
          eventsOptions.signal?.removeEventListener("abort", forwardAbort);
        });
        return () => controller.abort();
      },
      async wait(runId: string, waitOptions: HermesApiServerWaitOptions = {}): Promise<HermesApiRun> {
        const started = Date.now();
        const timeoutMs = waitOptions.timeoutMs ?? 10 * 60_000;
        const interval = Math.max(50, waitOptions.pollIntervalMs ?? 500);
        while (true) {
          if (waitOptions.signal?.aborted) {
            throw waitOptions.signal.reason ?? new DOMException("Aborted", "AbortError");
          }
          const run = await api.runs.get(runId);
          if (["completed", "failed", "cancelled"].includes(run.status)) return run;
          if (timeoutMs > 0 && Date.now() - started >= timeoutMs) {
            throw new Error(`Timed out waiting for Hermes run ${runId}`);
          }
          await sleep(interval, waitOptions.signal);
        }
      },
    },
    raw<T = unknown>(method: string, path: string, input = {}): Promise<T> {
      return request<T>(method, path, input);
    },
  };

  return api;
}
