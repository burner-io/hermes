export interface HermesStarmapNode {
  id: string;
  label: string;
  kind: "memory" | "skill";
  memorySource?: "memory" | "profile";
  timestamp?: number | null;
  category: string;
  useCount: number;
  state: string;
  createdBy: string | null;
  pinned: boolean;
  [key: string]: unknown;
}

export interface HermesStarmapEdge {
  source: string;
  target: string;
  [key: string]: unknown;
}

export interface HermesStarmapCluster {
  category: string;
  count: number;
  [key: string]: unknown;
}

export interface HermesStarmapMemoryCard {
  source: "memory" | "profile";
  timestamp?: number | null;
  title: string;
  body: string;
  [key: string]: unknown;
}

export interface HermesStarmapGraph {
  nodes: HermesStarmapNode[];
  edges: HermesStarmapEdge[];
  clusters: HermesStarmapCluster[];
  memory: HermesStarmapMemoryCard[];
  stats: Record<string, unknown>;
  [key: string]: unknown;
}

export interface HermesLearningNodeRefRequest {
  id: string;
  profile?: string | null;
}

export interface HermesLearningNodeEditRequest extends HermesLearningNodeRefRequest {
  content: string;
}

export interface HermesCuratorStatusResponse {
  enabled: boolean;
  paused: boolean;
  interval_hours: number | null;
  last_run_at: string | null;
  min_idle_hours: number | null;
  stale_after_days: number | null;
  archive_after_days: number | null;
  [key: string]: unknown;
}

export interface HermesLearningApi {
  graph(profile?: string): Promise<HermesStarmapGraph>;
  node(input: HermesLearningNodeRefRequest): Promise<unknown>;
  removeNode(input: HermesLearningNodeRefRequest): Promise<unknown>;
  updateNode(input: HermesLearningNodeEditRequest): Promise<unknown>;
}

export interface HermesCuratorApi {
  status(): Promise<HermesCuratorStatusResponse>;
  setPaused(paused: boolean): Promise<unknown>;
  run(): Promise<unknown>;
}
