export interface HermesDashboardPluginInfo extends Record<string, unknown> {
  name?: string;
  enabled?: boolean;
  hidden?: boolean;
}

export interface HermesDashboardPluginsResponse extends Record<string, unknown> {
  plugins?: HermesDashboardPluginInfo[];
}

export interface HermesAgentPluginInstallRequest {
  identifier: string;
  force?: boolean;
  enable?: boolean;
}

export interface HermesPluginProvidersUpdateRequest {
  memory_provider?: string | null;
  context_engine?: string | null;
}

export interface HermesPluginVisibilityRequest {
  hidden: boolean;
}

export interface HermesPluginsApi {
  list(): Promise<HermesDashboardPluginsResponse>;
  rescan(): Promise<HermesDashboardPluginsResponse | unknown>;
  hub(): Promise<unknown>;
  install(input: HermesAgentPluginInstallRequest): Promise<unknown>;
  enable(name: string): Promise<unknown>;
  disable(name: string): Promise<unknown>;
  update(name: string): Promise<unknown>;
  remove(name: string): Promise<unknown>;
  setProviders(input: HermesPluginProvidersUpdateRequest): Promise<unknown>;
  setVisibility(name: string, input: HermesPluginVisibilityRequest): Promise<unknown>;
}
