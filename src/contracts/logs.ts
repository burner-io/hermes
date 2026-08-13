export interface HermesLogsResponse {
  file: string;
  lines: string[];
  [key: string]: unknown;
}

export interface HermesLogsQuery {
  file?: string;
  lines?: number;
  level?: string;
  component?: string;
  search?: string;
}

export interface HermesLogsApi {
  get(input?: HermesLogsQuery): Promise<HermesLogsResponse>;
}
