import { DEFAULT_BASE_URL, FIXED_TIMEOUT_MS } from "./constants.js";
import { validateApiBaseUrl } from "./security.js";
import type { ApiClientConfig } from "./types.js";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Environment variable ${name} is required.`);
  }
  return value;
}

export function loadApiConfig(): ApiClientConfig {
  const baseUrl = validateApiBaseUrl(DEFAULT_BASE_URL);
  const apiKey = getRequiredEnv("HEYMAX_CRM_API_KEY");
  const source = process.env.HEYMAX_CRM_API_SOURCE?.trim() || undefined;

  const config: ApiClientConfig = {
    baseUrl,
    apiKey,
    timeoutMs: FIXED_TIMEOUT_MS,
  };

  if (source) {
    config.source = source;
  }

  return config;
}
