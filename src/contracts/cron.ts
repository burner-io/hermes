export interface HermesCronJobSchedule {
  display?: string;
  expr?: string;
  kind?: string;
  [key: string]: unknown;
}

export interface HermesCronJob {
  deliver?: string | null;
  enabled: boolean;
  id: string;
  last_error?: string | null;
  last_run_at?: string | null;
  model?: string | null;
  name?: string | null;
  next_run_at?: string | null;
  no_agent?: boolean;
  prompt?: string | null;
  provider?: string | null;
  schedule?: HermesCronJobSchedule;
  schedule_display?: string | null;
  script?: string | null;
  state?: string | null;
  [key: string]: unknown;
}

export interface HermesCronJobCreateRequest {
  prompt?: string;
  schedule: string;
  name?: string;
  deliver?: string;
  skills?: string[] | null;
  model?: string | null;
  provider?: string | null;
  base_url?: string | null;
  script?: string | null;
  context_from?: unknown;
  enabled_toolsets?: string[] | null;
  workdir?: string | null;
  no_agent?: boolean;
}

export interface HermesCronJobUpdateRequest {
  updates: Record<string, unknown>;
}

export interface HermesCronDeliveryTarget {
  home_env_var: string | null;
  home_target_set: boolean;
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface HermesCronDeliveryTargetsResponse {
  targets: HermesCronDeliveryTarget[];
  [key: string]: unknown;
}

export interface HermesAutomationBlueprintField {
  name: string;
  type: "enum" | "text" | "time" | "weekdays";
  label: string;
  default: string | null;
  options: string[];
  optional: boolean;
  strict?: boolean;
  help: string;
  [key: string]: unknown;
}

export interface HermesAutomationBlueprint {
  key: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  fields: HermesAutomationBlueprintField[];
  command: string;
  appUrl: string;
  [key: string]: unknown;
}

export interface HermesAutomationBlueprintsResponse {
  blueprints: HermesAutomationBlueprint[];
  [key: string]: unknown;
}

export interface HermesAutomationBlueprintInstantiateRequest {
  blueprint: string;
  values?: Record<string, unknown>;
}

export interface HermesCronApi {
  list(profile?: string): Promise<HermesCronJob[]>;
  create(input: HermesCronJobCreateRequest, profile?: string): Promise<HermesCronJob>;
  update(id: string, input: HermesCronJobUpdateRequest, profile?: string): Promise<HermesCronJob>;
  pause(id: string, profile?: string): Promise<HermesCronJob>;
  resume(id: string, profile?: string): Promise<HermesCronJob>;
  trigger(id: string, profile?: string): Promise<HermesCronJob>;
  remove(id: string, profile?: string): Promise<{ ok: boolean; [key: string]: unknown }>;
  deliveryTargets(): Promise<HermesCronDeliveryTargetsResponse>;
  blueprints(): Promise<HermesAutomationBlueprintsResponse>;
  instantiateBlueprint(input: HermesAutomationBlueprintInstantiateRequest, profile?: string): Promise<HermesCronJob>;
}
