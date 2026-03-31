import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import type { ResponseFormat } from "./schemas.js";
import type { JsonObject, JsonValue, ServiceStatus } from "./types.js";

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function formatScalar(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return String(value);
}

function appendIfPresent(lines: string[], label: string, value: unknown): void {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return;
  }

  if (Array.isArray(value) && value.length === 0) {
    return;
  }

  lines.push(`- **${label}**: ${formatScalar(value)}`);
}

function pickDisplayLabel(item: JsonValue, index: number): string {
  if (!isJsonObject(item)) {
    return `Item ${index + 1}`;
  }

  const candidates = [
    item.nome,
    item.name,
    item.slug,
    item.descricao,
    item.id,
    item.atendimentoId,
    item.cpfMasc,
    item.cpf,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return `Item ${index + 1}`;
}

export function createToolSuccess(
  responseFormat: ResponseFormat,
  structuredContent: JsonObject,
  markdownText: string,
): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: responseFormat === "json" ? stringifyJson(structuredContent) : markdownText,
      },
    ],
    structuredContent,
  };
}

export function createToolError(message: string): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: message,
      },
    ],
  };
}

export function renderListMarkdown(
  title: string,
  items: readonly JsonValue[],
  totalCount: number,
  truncated: boolean,
): string {
  const lines = [
    `# ${title}`,
    "",
    `- **Returned**: ${items.length}`,
    `- **Total considered**: ${totalCount}`,
  ];

  if (truncated) {
    lines.push(`- **Truncated**: yes, returning only the first ${items.length} item(s)`);
  }

  lines.push("");

  if (items.length === 0) {
    lines.push("No items returned by the API.");
  } else {
    items.forEach((item, index) => {
      lines.push(`- ${pickDisplayLabel(item, index)}`);
    });
  }

  lines.push("", "Use `response_format=json` to inspect the sanitized structured payload.");
  return lines.join("\n");
}

export function renderLookupMarkdown(title: string, inputLabel: string, inputValue: string, result: JsonValue): string {
  const lines = [
    `# ${title}`,
    "",
    `- **${inputLabel}**: ${inputValue}`,
  ];

  if (isJsonObject(result)) {
    for (const [key, value] of Object.entries(result).slice(0, 8)) {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        lines.push(`- **${key}**: ${String(value)}`);
      }
    }
  }

  lines.push("", "Use `response_format=json` to inspect the sanitized structured payload.");

  return lines.join("\n");
}

export function renderFlowMarkdown(
  title: string,
  funnel: string,
  includeImages: boolean,
  result: JsonValue,
): string {
  return [
    `# ${title}`,
    "",
    `- **Funnel**: ${funnel}`,
    `- **Include images**: ${String(includeImages)}`,
    "",
    "Use `response_format=json` to inspect the sanitized structured payload.",
  ].join("\n");
}

export function renderStatusMarkdown(
  title: string,
  status: ServiceStatus,
  includeCustomerData: boolean,
): string {
  const lines = [`# ${title}`, ""];

  appendIfPresent(lines, "Atendimento ID", status.id);
  appendIfPresent(lines, "Protocolo", status.protocolo);
  appendIfPresent(lines, "Funil", status.funil);
  appendIfPresent(lines, "Etapa do funil", status.etapaFunil);
  appendIfPresent(lines, "Etapa do atendimento", status.etapaAtendimento);
  appendIfPresent(lines, "Situação do atendimento", status.situacaoAtendimento);
  appendIfPresent(lines, "Situação do crédito", status.situacaoCredito);
  appendIfPresent(lines, "Ação do agente", status.acaoAgente);
  appendIfPresent(lines, "Resposta do agente", status.respostaAgente);
  appendIfPresent(lines, "Atendimentos em 7 dias", status.atendimentos7dias);
  appendIfPresent(lines, "Dias", status.dias);
  appendIfPresent(lines, "Minutos", status.minutos);
  appendIfPresent(lines, "Oportunidades", status.oportunidades);

  if (includeCustomerData && status.cliente) {
    lines.push("", "## Cliente");
    appendIfPresent(lines, "Nome", status.cliente.nome);
    appendIfPresent(lines, "Telefone", status.cliente.telefone);
    appendIfPresent(lines, "Email", status.cliente.email);
    appendIfPresent(lines, "CPF", status.cliente.cpf);
  }

  lines.push("", "Use `response_format=json` to inspect the sanitized structured payload.");
  return lines.join("\n");
}
