import type { HermesStatusResponse } from "../contracts/system.js";
import type { HermesWebSocketApi, HermesWebSocketFactory, HermesWebSocketLike } from "./types.js";
import { buildHttpUrl, HermesHttpTransport, resolveToken } from "./http.js";

function defaultFactory(url: string): HermesWebSocketLike {
  const Ctor = (globalThis as { WebSocket?: new (url: string) => HermesWebSocketLike }).WebSocket;
  if (!Ctor) throw new Error("No WebSocket implementation is available; pass websocketFactory");
  return new Ctor(url);
}

function toWsUrl(httpUrl: string): URL {
  const url = new URL(httpUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url;
}

function bind(socket: HermesWebSocketLike, type: string, listener: (event: any) => void): () => void {
  if (socket.addEventListener) {
    socket.addEventListener(type, listener);
    return () => socket.removeEventListener?.(type, listener);
  }
  const key = `on${type}` as "onopen" | "onmessage" | "onerror" | "onclose";
  (socket as any)[key] = listener;
  return () => { if ((socket as any)[key] === listener) (socket as any)[key] = null; };
}

export function createWebSocketApi(
  transport: HermesHttpTransport,
  options: {
    websocketFactory?: HermesWebSocketFactory;
    websocketAuth?: "auto" | "session-token" | "ticket" | "none";
    sessionToken?: string | (() => string | undefined | Promise<string | undefined>);
    internalWebSocketToken?: string;
  },
): HermesWebSocketApi {
  const factory = options.websocketFactory ?? defaultFactory;

  async function authParam(): Promise<[string, string] | undefined> {
    if (options.internalWebSocketToken) return ["internal", options.internalWebSocketToken];
    const mode = options.websocketAuth ?? "auto";
    if (mode === "none") return undefined;
    if (mode === "ticket") {
      const ticket = await transport.request<{ ticket: string }>("POST", "/api/auth/ws-ticket");
      return ["ticket", ticket.ticket];
    }
    if (mode === "session-token") {
      const token = await resolveToken(options.sessionToken);
      return token ? ["token", token] : undefined;
    }

    let status: HermesStatusResponse | undefined;
    try { status = await transport.request<HermesStatusResponse>("GET", "/api/status"); } catch { /* fallback below */ }
    if (status?.auth_required) {
      const ticket = await transport.request<{ ticket: string }>("POST", "/api/auth/ws-ticket");
      return ["ticket", ticket.ticket];
    }
    const token = await resolveToken(options.sessionToken);
    return token ? ["token", token] : undefined;
  }

  return {
    async buildUrl(path, query) {
      const url = toWsUrl(buildHttpUrl(transport.baseUrl, path, query));
      const auth = await authParam();
      if (auth) url.searchParams.set(auth[0], auth[1]);
      return url.toString();
    },

    async connectJson<T>(
      path: string,
      listener: (value: T) => void,
      connectOptions: {
        query?: Record<string, string | number | boolean | undefined>;
        onOpen?: () => void;
        onError?: (error: unknown) => void;
        onClose?: (event: unknown) => void;
      } = {},
    ) {
      const url = await this.buildUrl(path, connectOptions.query);
      const socket = factory(url);
      const cleanups: Array<() => void> = [];
      cleanups.push(bind(socket, "message", (event) => {
        try {
          const raw = typeof event?.data === "string" ? event.data : String(event?.data ?? "");
          listener(JSON.parse(raw) as T);
        } catch (error) {
          connectOptions.onError?.(error);
        }
      }));
      if (connectOptions.onOpen) cleanups.push(bind(socket, "open", () => connectOptions.onOpen?.()));
      if (connectOptions.onError) cleanups.push(bind(socket, "error", (event) => connectOptions.onError?.(event)));
      if (connectOptions.onClose) cleanups.push(bind(socket, "close", (event) => connectOptions.onClose?.(event)));
      return () => {
        for (const cleanup of cleanups) cleanup();
        socket.close(1000, "Hermes SDK unsubscribe");
      };
    },
  };
}
