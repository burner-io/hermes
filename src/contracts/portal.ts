export interface HermesPortalFeature {
  label: string;
  state: string;
  [key: string]: unknown;
}

export interface HermesPortalResponse {
  logged_in: boolean;
  portal_url?: string | null;
  inference_url?: string | null;
  provider?: string | null;
  subscription_url?: string | null;
  features?: HermesPortalFeature[];
  [key: string]: unknown;
}

export interface HermesPortalApi {
  get(profile?: string): Promise<HermesPortalResponse>;
}
