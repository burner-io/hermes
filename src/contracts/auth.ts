export interface HermesAuthMeResponse {
  user_id: string;
  email: string;
  display_name: string;
  org_id: string;
  provider: string;
  expires_at: number;
  [key: string]: unknown;
}

export interface HermesWsTicketResponse {
  ticket: string;
  ttl_seconds: number;
  [key: string]: unknown;
}

/** Native dashboard authentication endpoints. */
export interface HermesAuthApi {
  me(): Promise<HermesAuthMeResponse>;
  wsTicket(): Promise<HermesWsTicketResponse>;
  /** `/auth/logout` is a native dashboard route rather than `/api/*`. */
  logout(): Promise<unknown>;
}
