import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT_MS } from "./constants.js";
import type { ApiClientConfig } from "./types.js";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Environment variable ${name} is required.`);
  }
  return value;
}

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable value "${rawValue}" must be a positive integer.`);
  }

  return parsed;
}

export function loadApiConfig(): ApiClientConfig {
  const baseUrl = process.env.KEMOSOFT_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const apiKey = getRequiredEnv("KEMOSOFT_API_KEY");
  const timeoutMs = parsePositiveInt(process.env.KEMOSOFT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
  const source = process.env.KEMOSOFT_API_SOURCE?.trim() || undefined;

  const config: ApiClientConfig = {
    baseUrl,
    apiKey,
    timeoutMs,
  };

  if (source) {
    config.source = source;
  }

  return config;
}
