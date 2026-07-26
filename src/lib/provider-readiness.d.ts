export type ProviderStatus = "ready" | "missing" | "invalid";
export type ProviderReadiness = {
  status: "ready" | "incomplete";
  providers: Array<{
    id: string;
    status: ProviderStatus;
    missing: string[];
    invalid: string[];
  }>;
};

export const providerDefinitions: Array<{
  id: string;
  variables: Array<[string, string]>;
}>;
export function evaluateProviderReadiness(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  options?: { production?: boolean },
): ProviderReadiness;
export function publicProviderReadiness(
  readiness: ProviderReadiness,
): Record<string, ProviderStatus>;
