export interface HermesCredentialPoolEntry {
  index: number;
  id?: string | null;
  label?: string | null;
  auth_type?: string | null;
  source?: string | null;
  priority: number;
  last_status?: string | null;
  request_count: number;
  token_preview: string;
  has_refresh: boolean;
  [key: string]: unknown;
}

export interface HermesCredentialPoolProvider {
  provider: string;
  entries: HermesCredentialPoolEntry[];
  [key: string]: unknown;
}

export interface HermesCredentialPoolResponse {
  providers: HermesCredentialPoolProvider[];
  [key: string]: unknown;
}

export interface HermesCredentialPoolAddRequest {
  provider: string;
  api_key: string;
  label?: string | null;
}

export interface HermesCredentialsApi {
  pool(): Promise<HermesCredentialPoolResponse>;
  add(input: HermesCredentialPoolAddRequest): Promise<unknown>;
  remove(provider: string, index: number): Promise<unknown>;
}
