export interface HermesDashboardThemeInfo extends Record<string, unknown> {
  name?: string;
}

export interface HermesDashboardThemesResponse extends Record<string, unknown> {
  themes?: HermesDashboardThemeInfo[];
  current?: string;
}

export interface HermesDashboardFontResponse extends Record<string, unknown> {
  font?: string;
}

export interface HermesDashboardApi {
  themes(): Promise<HermesDashboardThemesResponse>;
  setTheme(name: string): Promise<{ ok: boolean; theme: string; [key: string]: unknown }>;
  font(): Promise<HermesDashboardFontResponse>;
  setFont(font: string): Promise<{ ok: boolean; font: string; [key: string]: unknown }>;
}
