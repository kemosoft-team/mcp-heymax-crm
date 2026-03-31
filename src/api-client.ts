import type { ApiClientConfig, ApiRequestOptions, JsonObject, JsonValue } from "./types.js";

export class KemosoftApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: JsonValue,
  ) {
    super(message);
    this.name = "KemosoftApiError";
  }
}

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseResponseBody(rawText: string, contentType: string | null): JsonValue {
  if (!rawText) {
    return null;
  }

  const shouldTryJson = contentType?.includes("application/json") ?? true;
  if (shouldTryJson) {
    try {
      return JSON.parse(rawText) as JsonValue;
    } catch {
      return rawText;
    }
  }

  return rawText;
}

function extractErrorMessage(body: JsonValue): string | undefined {
  if (typeof body === "string" && body.trim().length > 0) {
    return body.trim();
  }

  if (!isJsonObject(body)) {
    return undefined;
  }

  const candidates = [body.message, body.error, body.detail];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return undefined;
}

export function formatApiError(error: unknown): string {
  if (error instanceof KemosoftApiError) {
    const baseMessage = extractErrorMessage(error.body) ?? error.message;

    switch (error.status) {
      case 401:
        return `Authentication failed with the Kemosoft API: ${baseMessage}. Check HEYMAX_CRM_API_KEY.`;
      case 404:
        return `Kemosoft resource not found: ${baseMessage}. Confirm the provided identifiers.`;
      case 422:
        return `Kemosoft rejected the request payload: ${baseMessage}. Review the sent parameters.`;
      case 429:
        return `Kemosoft rate limit reached: ${baseMessage}. Retry later.`;
      default:
        return `Kemosoft API request failed with status ${error.status}: ${baseMessage}`;
    }
  }

  if (error instanceof DOMException && error.name === "TimeoutError") {
    return "Kemosoft API request timed out after 30 seconds. Retry with a narrower query.";
  }

  if (error instanceof Error) {
    return `Unexpected error while calling Kemosoft API: ${error.message}`;
  }

  return `Unexpected error while calling Kemosoft API: ${String(error)}`;
}

export class KemosoftApiClient {
  private readonly baseUrl: URL;

  constructor(private readonly config: ApiClientConfig) {
    const normalizedBaseUrl = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;
    this.baseUrl = new URL(normalizedBaseUrl);
  }

  async request<T extends JsonValue>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    const url = new URL(normalizedPath, this.baseUrl);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    const headers = new Headers({
      accept: "application/json",
      "api-key": this.config.apiKey,
    });

    for (const [key, value] of Object.entries(options.extraHeaders ?? {})) {
      if (value) {
        headers.set(key, value);
      }
    }

    const source = options.source ?? this.config.source;
    if (source) {
      headers.set("x-source", source);
    }

    let body: string | undefined;
    if (options.body !== undefined) {
      headers.set("content-type", "application/json");
      body = JSON.stringify(options.body);
    }

    const requestInit: RequestInit = {
      method: options.method ?? "GET",
      headers,
      signal: AbortSignal.timeout(this.config.timeoutMs),
    };

    if (body !== undefined) {
      requestInit.body = body;
    }

    const response = await fetch(url, requestInit);

    const rawText = await response.text();
    const parsedBody = parseResponseBody(rawText, response.headers.get("content-type"));

    if (!response.ok) {
      const message = extractErrorMessage(parsedBody) ?? "Request failed";
      throw new KemosoftApiError(message, response.status, parsedBody);
    }

    return parsedBody as T;
  }

  async get<T extends JsonValue>(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    const requestOptions: ApiRequestOptions = {
      method: "GET",
    };

    if (query) {
      requestOptions.query = query;
    }

    return this.request<T>(path, {
      ...requestOptions,
    });
  }
}
