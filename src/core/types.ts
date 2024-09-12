// type EventCaptureType = "exposure" | "click" | "conversion" | "custom" | "unknown"

export interface EventCaptureOptions {
  type: string;
  userId: string;
  sessionId: string;
  featureFlag?: string;
  experimentEpoch?: number;
  variantId?: string;
  customEventName?: string;
  metadata?: Record<string, any>;
}