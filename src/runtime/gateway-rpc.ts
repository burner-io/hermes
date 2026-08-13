import type {
  HermesGatewayRpcEvent,
  HermesGatewayRpcPromptSubmitRequest,
  HermesGatewayRpcSessionCreateRequest,
  HermesGatewayRpcSessionCreateResponse,
} from "../contracts/programmatic.js";
import type {
  HermesGatewayRpcConnection,
  HermesTuiGatewayApi,
  HermesWebSocketApi,
  HermesWebSocketFactory,
  HermesWebSocketLike,
} from "./types.js";

type RpcResponse = {
  id?: string | number;
  result?: unknown;
  error?: { code?: number; message?: string; data?: unknown };
  method?: string;
  params?: { type?: string; payload?: unknown; [key: string]: unknown };
};

function defaultFactory(url: string): HermesWebSocketLike {
  const Ctor = (globalThis as { WebSocket?: new (url: string) => HermesWebSocketLike }).WebSocket;
  if (!Ctor) throw new Error("No WebSocket implementation is available; pass websocketFactory");
  return new Ctor(url);
}

function bind(socket: HermesWebSocketLike, type: string, listener: (event: any) => void): () => void {
  if (socket.addEventListener) {
    socket.addEventListener(type, listener);
    return () => socket.removeEventListener?.(type, listener);
  }
  const key = `on${type}` as "onopen" | "onmessage" | "onerror" | "onclose";
  (socket as any)[key] = listener;
  return () => {
    if ((socket as any)[key] === listener) (socket as any)[key] = null;
  };
}

export class HermesGatewayRpcError extends Error {
  readonly code: number | undefined;
  readonly data: unknown;

  constructor(input: { message: string; code?: number; data?: unknown }) {
    super(input.message);
    this.name = "HermesGatewayRpcError";
    this.code = input.code;
    this.data = input.data;
  }
}

export function createTuiGatewayApi(
  websocket: HermesWebSocketApi,
  websocketFactory?: HermesWebSocketFactory,
): HermesTuiGatewayApi {
  const factory = websocketFactory ?? defaultFactory;

  return {
    async connect(): Promise<HermesGatewayRpcConnection> {
      const url = await websocket.buildUrl("/api/ws");
      const socket = factory(url);
      if (!socket.send) throw new Error("WebSocket implementation must provide send() for Hermes TUI Gateway RPC");

      let state: "connecting" | "open" | "closed" = "connecting";
      let seq = 0;
      const pending = new Map<string | number, {
        resolve: (value: unknown) => void;
        reject: (error: unknown) => void;
      }>();
      const listeners = new Map<string, Set<(event: HermesGatewayRpcEvent) => void>>();
      const cleanups: Array<() => void> = [];

      const opened = new Promise<void>((resolve, reject) => {
        cleanups.push(bind(socket, "open", () => {
          state = "open";
          resolve();
        }));
        cleanups.push(bind(socket, "error", (event) => {
          if (state === "connecting") reject(event instanceof Error ? event : new Error("Hermes TUI Gateway WebSocket connection failed"));
        }));
      });

      cleanups.push(bind(socket, "message", (event) => {
        let frame: RpcResponse;
        try {
          const raw = typeof event?.data === "string" ? event.data : String(event?.data ?? "");
          frame = JSON.parse(raw) as RpcResponse;
        } catch {
          return;
        }

        if (frame.id !== undefined && pending.has(frame.id)) {
          const item = pending.get(frame.id)!;
          pending.delete(frame.id);
          if (frame.error) {
            item.reject(new HermesGatewayRpcError({
              message: frame.error.message ?? "Hermes TUI Gateway RPC error",
              ...(frame.error.code !== undefined ? { code: frame.error.code } : {}),
              ...(frame.error.data !== undefined ? { data: frame.error.data } : {}),
            }));
          } else {
            item.resolve(frame.result);
          }
          return;
        }

        if (frame.method === "event" && frame.params?.type) {
          const rpcEvent: HermesGatewayRpcEvent = {
            type: frame.params.type,
            ...(frame.params.payload !== undefined ? { payload: frame.params.payload } : {}),
          };
          for (const listener of listeners.get(frame.params.type) ?? []) listener(rpcEvent);
          for (const listener of listeners.get("*") ?? []) listener(rpcEvent);
        }
      }));

      cleanups.push(bind(socket, "close", () => {
        state = "closed";
        const error = new Error("Hermes TUI Gateway WebSocket closed");
        for (const item of pending.values()) item.reject(error);
        pending.clear();
      }));

      await opened;

      const connection: HermesGatewayRpcConnection = {
        get state() { return state; },
        request<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
          if (state !== "open") return Promise.reject(new Error("Hermes TUI Gateway is not connected"));
          const id = `sdk-${++seq}`;
          return new Promise<T>((resolve, reject) => {
            pending.set(id, { resolve: (value) => resolve(value as T), reject });
            try {
              socket.send!(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
            } catch (error) {
              pending.delete(id);
              reject(error);
            }
          });
        },
        on<T = unknown>(event: string, listener: (event: HermesGatewayRpcEvent<T>) => void): () => void {
          const set = listeners.get(event) ?? new Set();
          const erased = listener as (event: HermesGatewayRpcEvent) => void;
          set.add(erased);
          listeners.set(event, set);
          return () => {
            set.delete(erased);
            if (!set.size) listeners.delete(event);
          };
        },
        createSession(input: HermesGatewayRpcSessionCreateRequest = {}): Promise<HermesGatewayRpcSessionCreateResponse> {
          return connection.request("session.create", input);
        },
        submitPrompt(input: HermesGatewayRpcPromptSubmitRequest): Promise<unknown> {
          return connection.request("prompt.submit", input);
        },
        interrupt(sessionId: string): Promise<unknown> {
          return connection.request("session.interrupt", { session_id: sessionId });
        },
        close(code = 1000, reason = "Hermes SDK close") {
          if (state === "closed") return;
          state = "closed";
          for (const cleanup of cleanups) cleanup();
          socket.close(code, reason);
          const error = new Error("Hermes TUI Gateway connection closed");
          for (const item of pending.values()) item.reject(error);
          pending.clear();
        },
      };

      return connection;
    },
  };
}
