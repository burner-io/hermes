export interface HermesSkillInfo {
  category: string;
  description: string;
  enabled: boolean;
  name: string;
  usage?: number;
  provenance?: "agent" | "bundled" | "hub";
  [key: string]: unknown;
}

export interface HermesSkillToggleRequest {
  name: string;
  enabled: boolean;
  profile?: string | null;
}

export interface HermesSkillCreateRequest {
  name: string;
  content: string;
  category?: string | null;
  profile?: string | null;
}

export interface HermesSkillContentUpdateRequest {
  name: string;
  content: string;
  profile?: string | null;
}

export interface HermesSkillContentResponse {
  name: string;
  content: string;
  path: string;
  [key: string]: unknown;
}

export interface HermesSkillHubSource {
  id: string;
  label: string;
  available?: boolean;
  rate_limited?: boolean;
  searchable?: boolean;
  [key: string]: unknown;
}

export interface HermesSkillHubResult {
  name: string;
  description: string;
  source: string;
  identifier: string;
  trust_level: string;
  repo: string | null;
  tags: string[];
  [key: string]: unknown;
}

export interface HermesSkillHubInstalledEntry {
  name: string | null;
  trust_level: string | null;
  scan_verdict: string | null;
  [key: string]: unknown;
}

export interface HermesSkillHubSourcesResponse {
  sources: HermesSkillHubSource[];
  index_available: boolean;
  featured: HermesSkillHubResult[];
  installed: Record<string, HermesSkillHubInstalledEntry>;
  [key: string]: unknown;
}

export interface HermesSkillHubSearchResponse {
  results: HermesSkillHubResult[];
  source_counts: Record<string, number>;
  timed_out: string[];
  installed: Record<string, HermesSkillHubInstalledEntry>;
  [key: string]: unknown;
}

export interface HermesSkillHubPreview {
  name: string;
  description: string;
  source: string;
  identifier: string;
  trust_level: string;
  repo: string | null;
  tags: string[];
  skill_md: string;
  files: string[];
  [key: string]: unknown;
}

export interface HermesSkillHubScanFinding {
  severity: string;
  category: string;
  file: string;
  line: number | null;
  description: string;
  [key: string]: unknown;
}

export interface HermesSkillHubScanResult {
  name: string;
  identifier: string;
  source: string;
  trust_level: string;
  verdict: string;
  summary: string;
  policy: "allow" | "ask" | "block";
  policy_reason: string | null;
  findings: HermesSkillHubScanFinding[];
  severity_counts: Record<string, number>;
  [key: string]: unknown;
}

export interface HermesSkillInstallRequest {
  identifier: string;
  profile?: string | null;
}

export interface HermesSkillUninstallRequest {
  name: string;
  profile?: string | null;
}

export interface HermesSkillsUpdateRequest {
  profile?: string | null;
}

export interface HermesSkillHubActionResponse {
  ok: boolean;
  pid: number;
  name: string;
  [key: string]: unknown;
}

export interface HermesSkillHubApi {
  sources(profile?: string): Promise<HermesSkillHubSourcesResponse>;
  search(input: { q: string; source?: string; limit?: number; profile?: string }): Promise<HermesSkillHubSearchResponse>;
  preview(identifier: string, profile?: string): Promise<HermesSkillHubPreview>;
  scan(identifier: string, profile?: string): Promise<HermesSkillHubScanResult>;
  install(input: HermesSkillInstallRequest): Promise<HermesSkillHubActionResponse>;
  uninstall(input: HermesSkillUninstallRequest): Promise<HermesSkillHubActionResponse>;
  update(input?: HermesSkillsUpdateRequest): Promise<HermesSkillHubActionResponse>;
}

export interface HermesSkillsApi {
  list(profile?: string): Promise<HermesSkillInfo[]>;
  toggle(input: HermesSkillToggleRequest): Promise<{ ok: boolean; name: string; enabled: boolean }>;
  content(name: string, profile?: string): Promise<HermesSkillContentResponse>;
  create(input: HermesSkillCreateRequest): Promise<Record<string, unknown>>;
  updateContent(input: HermesSkillContentUpdateRequest): Promise<Record<string, unknown>>;
  hub: HermesSkillHubApi;
}
