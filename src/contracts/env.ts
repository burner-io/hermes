import type {
  HermesEnvVarDeleteRequest,
  HermesEnvVarInfo,
  HermesEnvVarUpdateRequest,
} from "./config.js";

export type HermesEnvResponse = Record<string, HermesEnvVarInfo>;

export interface HermesEnvVarRevealRequest {
  key: string;
  profile?: string | null;
}

export interface HermesEnvVarRevealResponse {
  key: string;
  value: string;
  [key: string]: unknown;
}

/** Native Hermes environment/keys surface (`/api/env`). */
export interface HermesEnvApi {
  list(profile?: string): Promise<HermesEnvResponse>;
  set(input: HermesEnvVarUpdateRequest): Promise<{ ok: boolean; [key: string]: unknown }>;
  remove(input: HermesEnvVarDeleteRequest): Promise<{ ok: boolean; [key: string]: unknown }>;
  reveal(input: HermesEnvVarRevealRequest): Promise<HermesEnvVarRevealResponse>;
}
