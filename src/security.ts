import { DEFAULT_BASE_URL } from "./constants.js";
import type { JsonObject, JsonValue } from "./types.js";

export type RedactionProfile = "generic" | "customer";

const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 25;
const MAX_STRING_LENGTH = 240;
const BINARY_STRING_LENGTH = 512;

const EXACT_SENSITIVE_KEYS = new Set([
  "cpf",
  "cpfrepresentante",
  "email",
  "telefone",
  "phone",
  "pixkey",
  "nome",
  "name",
  "nomemae",
  "mother",
  "nascimento",
  "datanascimento",
  "birthdate",
  "nomerepresentante",
  "representativename",
  "federalid",
  "cpfmasc",
  "nomemasc",
]);

const PARTIAL_SENSITIVE_KEY_PATTERNS = [
  "cpf",
  "phone",
  "telefone",
  "email",
  "federalid",
  "birth",
  "nascimento",
  "mother",
  "mae",
  "representante",
  "pix",
  "matricula",
];

const LARGE_CONTENT_KEY_PATTERNS = [
  "image",
  "imagem",
  "base64",
  "blob",
  "arquivo",
  "file",
  "document",
  "proof",
  "paycheck",
  "statement",
];

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksLikeBinaryContent(value: string): boolean {
  if (value.length < BINARY_STRING_LENGTH) {
    return false;
  }

  return /^[A-Za-z0-9+/=\r\n]+$/.test(value);
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated ${value.length - MAX_STRING_LENGTH} chars]`;
}

function maskDigits(value: string, visibleDigits = 4): string {
  const digits = value.replace(/\D+/g, "");
  if (digits.length === 0) {
    return "[redacted]";
  }

  const visible = digits.slice(-Math.min(visibleDigits, digits.length));
  return `${"*".repeat(Math.max(0, digits.length - visible.length))}${visible}`;
}

function maskEmail(value: string): string {
  const [localPart, domain] = value.split("@");
  if (!localPart || !domain) {
    return "[redacted email]";
  }

  const localPreview = localPart.slice(0, 1);
  return `${localPreview}***@${domain}`;
}

function maskName(value: string): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return "[redacted name]";
  }

  return words
    .map((word) => `${word.slice(0, 1)}***`)
    .join(" ");
}

function maskSensitiveString(key: string, value: string): string {
  if (key.includes("email")) {
    return maskEmail(value);
  }

  if (
    key.includes("cpf") ||
    key.includes("federalid") ||
    key.includes("telefone") ||
    key.includes("phone") ||
    key.includes("matricula") ||
    key.includes("pix")
  ) {
    return maskDigits(value);
  }

  if (
    key.includes("nome") ||
    key.includes("name") ||
    key.includes("mae") ||
    key.includes("mother") ||
    key.includes("representante")
  ) {
    return maskName(value);
  }

  if (key.includes("birth") || key.includes("nascimento")) {
    return "[redacted date]";
  }

  return "[redacted]";
}

function shouldRedactKey(normalizedKey: string, profile: RedactionProfile): boolean {
  if (profile !== "customer") {
    return false;
  }

  if (EXACT_SENSITIVE_KEYS.has(normalizedKey)) {
    return true;
  }

  return PARTIAL_SENSITIVE_KEY_PATTERNS.some((pattern) => normalizedKey.includes(pattern));
}

function shouldStripLargeContent(normalizedKey: string): boolean {
  return LARGE_CONTENT_KEY_PATTERNS.some((pattern) => normalizedKey.includes(pattern));
}

function sanitizeObject(
  value: JsonObject,
  profile: RedactionProfile,
  depth: number,
): JsonObject {
  const entries = Object.entries(value);
  const limitedEntries = entries.slice(0, MAX_OBJECT_KEYS);
  const sanitized: JsonObject = {};

  for (const [key, rawChild] of limitedEntries) {
    const normalizedKey = normalizeKey(key);

    if (shouldStripLargeContent(normalizedKey)) {
      sanitized[key] = "[redacted large content]";
      continue;
    }

    if (typeof rawChild === "string" && shouldRedactKey(normalizedKey, profile)) {
      sanitized[key] = maskSensitiveString(normalizedKey, rawChild);
      continue;
    }

    sanitized[key] = sanitizeForOutput(rawChild, profile, depth + 1, normalizedKey);
  }

  if (entries.length > limitedEntries.length) {
    sanitized._truncatedKeys = entries.length - limitedEntries.length;
  }

  return sanitized;
}

export function sanitizeForOutput(
  value: JsonValue,
  profile: RedactionProfile,
  depth = 0,
  parentKey = "",
): JsonValue {
  if (depth >= MAX_DEPTH) {
    return "[truncated depth]";
  }

  if (value === null) {
    return null;
  }

  if (typeof value === "string") {
    if (shouldStripLargeContent(parentKey) || looksLikeBinaryContent(value)) {
      return "[redacted large content]";
    }

    if (shouldRedactKey(parentKey, profile)) {
      return maskSensitiveString(parentKey, value);
    }

    return truncateString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const limitedItems = value.slice(0, MAX_ARRAY_ITEMS).map((item) =>
      sanitizeForOutput(item, profile, depth + 1, parentKey),
    );

    if (value.length > limitedItems.length) {
      limitedItems.push(`[truncated ${value.length - limitedItems.length} item(s)]`);
    }

    return limitedItems;
  }

  if (isJsonObject(value)) {
    return sanitizeObject(value, profile, depth);
  }

  return "[unsupported value]";
}

export function validateApiBaseUrl(baseUrl: string): string {
  const canonical = new URL(DEFAULT_BASE_URL);
  const candidate = new URL(baseUrl);

  if (candidate.protocol !== "https:") {
    throw new Error("HeyMax CRM API base URL must use HTTPS.");
  }

  if (candidate.hostname !== canonical.hostname || candidate.port !== canonical.port) {
    throw new Error("HeyMax CRM API base URL host is fixed and cannot be changed.");
  }

  return canonical.toString();
}
