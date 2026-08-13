import type { HermesClientOptions, HermesRequestOptions, HermesTokenResolver } from "./types.js";

const SESSION_HEADER = "X-Hermes-Session-Token";

export class HermesHttpError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly body: unknown;

  constructor(input: { status: number; statusText: string; url: string; body: unknown }) {
    const detail = typeof input.body === "string"
      ? input.body
      : (() => {
          try { return JSON.stringify(input.body); } catch { return String(input.body); }
        })();
    super(`Hermes HTTP ${input.status} ${input.statusText}${detail ? `: ${detail}` : ""}`);
    this.name = "HermesHttpError";
    this.status = input.status;
    this.statusText = input.statusText;
    this.url = input.url;
    this.body = input.body;
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensurePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export async function resolveToken(token?: HermesTokenResolver): Promise<string | undefined> {
  if (typeof token === "function") return token();
  return token;
}

export function buildHttpUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
): string {
  const base = trimSlash(baseUrl);
  const url = new URL(`${base}${ensurePath(path)}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function readErrorBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try { return await response.clone().json(); } catch { /* fall through */ }
  }
  try { return await response.clone().text(); } catch { return undefined; }
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

export class HermesHttpTransport {
  readonly baseUrl: string;
  readonly defaultProfile: string | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly options: HermesClientOptions;

  constructor(options: HermesClientOptions) {
    if (!options.baseUrl) throw new TypeError("Hermes baseUrl is required");
    this.baseUrl = trimSlash(options.baseUrl);
    this.defaultProfile = options.profile?.trim() || undefined;
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) throw new Error("No fetch implementation is available");
    this.options = options;
  }

  profile(explicit?: string | null): string | undefined {
    return explicit?.trim() || this.defaultProfile;
  }

  withProfileQuery(
    query: Record<string, string | number | boolean | undefined | null> = {},
    explicit?: string | null,
  ): Record<string, string | number | boolean | undefined | null> {
    const profile = this.profile(explicit);
    return profile ? { ...query, profile } : query;
  }

  withProfileBody<T extends object>(body: T, explicit?: string | null): T {
    const existing = "profile" in body ? (body as { profile?: unknown }).profile : undefined;
    if (typeof existing === "string" && existing.trim()) return body;
    const profile = this.profile(explicit);
    return profile ? { ...body, profile } : body;
  }

  async response(method: string, path: string, request: HermesRequestOptions = {}): Promise<Response> {
    const url = buildHttpUrl(this.baseUrl, path, request.query);
    const headers = new Headers(this.options.headers);
    new Headers(request.headers).forEach((value, key) => headers.set(key, value));

    const sessionToken = await resolveToken(this.options.sessionToken);
    if (sessionToken && !headers.has(SESSION_HEADER)) headers.set(SESSION_HEADER, sessionToken);
    const bearer = await resolveToken(this.options.bearerToken);
    if (bearer && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${bearer}`);

    let body: BodyInit | undefined;
    if (request.body !== undefined) {
      if (isNativeBody(request.body)) {
        body = request.body;
      } else {
        body = JSON.stringify(request.body);
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      }
    }

    const controller = new AbortController();
    const timeoutMs = request.timeoutMs ?? this.options.timeoutMs ?? 30_000;
    const timeout = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
    try {
      const init: RequestInit = {
        method,
        headers,
        credentials: this.options.credentials ?? "include",
        signal: controller.signal,
        ...(body !== undefined ? { body } : {}),
      };
      const response = await this.fetchImpl(url, init);
      if (!response.ok) {
        throw new HermesHttpError({
          status: response.status,
          statusText: response.statusText,
          url,
          body: await readErrorBody(response),
        });
      }
      return response;
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
    }
  }

  async request<T>(method: string, path: string, request: HermesRequestOptions = {}): Promise<T> {
    const response = await this.response(method, path, request);
    if (request.response === "response") return response as T;
    if (request.response === "text") return (await response.text()) as T;
    if (response.status === 204) return undefined as T;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      const text = await response.text();
      if (!text) return undefined as T;
      try { return JSON.parse(text) as T; } catch { return text as T; }
    }
    return response.json() as Promise<T>;
  }

  async probe(path: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<boolean> {
    try {
      await this.response("GET", path, {
        ...(query ? { query } : {}),
        timeoutMs: Math.min(this.options.timeoutMs ?? 5000, 5000),
      });
      return true;
    } catch (error) {
      if (error instanceof HermesHttpError) return error.status !== 404;
      return false;
    }
  }
}
