/**
 * The upstream identity providers this app offers for sign-in (via the broker).
 * Source of truth for both server and client provider lists.
 */
export type GrokProvider = { providerId: string; idp: string; label: string };
export const GROK_PROVIDERS: readonly GrokProvider[] = [
  { providerId: "grok-google", idp: "google", label: "Google" },
  { providerId: "grok-x", idp: "twitter", label: "X" },
];
