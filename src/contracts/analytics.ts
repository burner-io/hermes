export interface HermesContextUsageCategory {
  color: string;
  id: string;
  label: string;
  tokens: number;
  [key: string]: unknown;
}

export interface HermesContextBreakdown {
  categories: HermesContextUsageCategory[];
  context_max: number;
  context_percent: number;
  context_used: number;
  estimated_total: number;
  model?: string;
  [key: string]: unknown;
}

export interface HermesAnalyticsDailyEntry {
  actual_cost: number;
  api_calls: number;
  cache_read_tokens: number;
  day: string;
  estimated_cost: number;
  input_tokens: number;
  output_tokens: number;
  reasoning_tokens: number;
  sessions: number;
  [key: string]: unknown;
}

export interface HermesAnalyticsModelEntry {
  api_calls: number;
  estimated_cost: number;
  input_tokens: number;
  model: string;
  output_tokens: number;
  sessions: number;
  [key: string]: unknown;
}

export interface HermesAnalyticsToolEntry {
  count: number;
  percentage: number;
  tool: string;
  [key: string]: unknown;
}

export interface HermesAnalyticsSkillEntry {
  last_used_at: number | null;
  manage_count: number;
  percentage: number;
  skill: string;
  total_count: number;
  view_count: number;
  [key: string]: unknown;
}

export interface HermesAnalyticsSkillsSummary {
  distinct_skills_used: number;
  total_skill_actions: number;
  total_skill_edits: number;
  total_skill_loads: number;
  [key: string]: unknown;
}

export interface HermesAnalyticsTotals {
  total_actual_cost: number;
  total_api_calls: number | null;
  total_cache_read: number | null;
  total_estimated_cost: number;
  total_input: number | null;
  total_output: number | null;
  total_reasoning: number | null;
  total_sessions: number;
  [key: string]: unknown;
}

export interface HermesAnalyticsResponse {
  by_model: HermesAnalyticsModelEntry[];
  daily: HermesAnalyticsDailyEntry[];
  period_days: number;
  skills: {
    summary: HermesAnalyticsSkillsSummary;
    top_skills: HermesAnalyticsSkillEntry[];
    [key: string]: unknown;
  };
  tools?: HermesAnalyticsToolEntry[];
  totals: HermesAnalyticsTotals;
  [key: string]: unknown;
}

export interface HermesAnalyticsApi {
  usage(input?: { days?: number; profile?: string }): Promise<HermesAnalyticsResponse>;
  models(input?: { days?: number; profile?: string }): Promise<unknown>;
}
