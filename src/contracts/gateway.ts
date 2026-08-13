export interface HermesGatewayDrainRequest {
  action: "drain" | "cancel";
  suppress_notification?: boolean;
}

export interface HermesGatewayApi {
  start(): Promise<unknown>;
  stop(): Promise<unknown>;
  restart(): Promise<unknown>;
  drain(input: HermesGatewayDrainRequest): Promise<unknown>;
}
