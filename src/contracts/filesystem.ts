export interface HermesManagedFileEntry {
  name: string;
  path: string;
  is_directory: boolean;
  size: number | null;
  mtime: number;
  mime_type: string | null;
  [key: string]: unknown;
}

export interface HermesManagedFilesResponse {
  root: string | null;
  path: string;
  parent: string | null;
  locked_root: string | null;
  can_change_path: boolean;
  entries: HermesManagedFileEntry[];
  [key: string]: unknown;
}

export interface HermesManagedFileReadResponse {
  name: string;
  path: string;
  size: number;
  mime_type: string;
  data_url: string;
  root: string | null;
  locked_root: string | null;
  can_change_path: boolean;
  [key: string]: unknown;
}

export interface HermesManagedFileWriteResponse {
  ok: boolean;
  path: string;
  entry: HermesManagedFileEntry;
  root: string | null;
  locked_root: string | null;
  can_change_path: boolean;
  [key: string]: unknown;
}

export interface HermesManagedFileUploadRequest {
  path: string;
  data_url: string;
  overwrite?: boolean;
}

export interface HermesManagedDirectoryCreateRequest {
  path: string;
}

export interface HermesManagedFileDeleteRequest {
  path: string;
  recursive?: boolean;
}

export interface HermesFsEntry extends Record<string, unknown> {
  name?: string;
  path?: string;
}

export interface HermesFsListResponse extends Record<string, unknown> {
  entries?: HermesFsEntry[];
  path?: string;
}

export interface HermesFsReadTextResponse extends Record<string, unknown> {
  path?: string;
  content?: string;
  text?: string;
}

export interface HermesFsWriteTextRequest {
  path: string;
  content: string;
}

export interface HermesFsDataUrlResponse extends Record<string, unknown> {
  path?: string;
  data_url?: string;
  mime_type?: string;
}

export interface HermesFilesystemApi {
  managed: {
    list(path?: string): Promise<HermesManagedFilesResponse>;
    read(path: string): Promise<HermesManagedFileReadResponse>;
    download(path: string): Promise<unknown>;
    upload(input: HermesManagedFileUploadRequest): Promise<HermesManagedFileWriteResponse>;
    /** Multipart streaming transport shape is intentionally opaque at the contract boundary; V0.3 implements it in the runtime transport. */
    uploadStream(input: unknown): Promise<HermesManagedFileWriteResponse | unknown>;
    mkdir(input: HermesManagedDirectoryCreateRequest): Promise<HermesManagedFileWriteResponse | unknown>;
    remove(input: HermesManagedFileDeleteRequest): Promise<unknown>;
  };
  fs: {
    list(path: string): Promise<HermesFsListResponse>;
    readText(path: string): Promise<HermesFsReadTextResponse>;
    writeText(input: HermesFsWriteTextRequest): Promise<unknown>;
    readDataUrl(path: string): Promise<HermesFsDataUrlResponse>;
    gitRoot(path: string): Promise<unknown>;
    defaultCwd(): Promise<unknown>;
  };
}
