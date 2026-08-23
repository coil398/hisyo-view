declare module "virtual:grok-og-identity" {
  export type GrokOgIdentity = {
    name: string;
    tagline: string;
    description: string;
  };
  const value: GrokOgIdentity;
  export default value;
}
