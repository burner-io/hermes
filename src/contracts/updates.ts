export interface HermesBackendUpdateCommit {
  sha: string;
  summary: string;
  author: string;
  at: number;
  [key: string]: unknown;
}

export interface HermesBackendUpdateCheckResponse {
  install_method: string;
  current_version: string;
  behind: number | null;
  update_available: boolean;
  can_apply: boolean;
  update_command: string | null;
  message: string | null;
  commits?: HermesBackendUpdateCommit[];
  [key: string]: unknown;
}

export interface HermesUpdatesApi {
  check(force?: boolean): Promise<HermesBackendUpdateCheckResponse>;
  apply(): Promise<unknown>;
}
