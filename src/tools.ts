import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

import { KemosoftApiClient, formatApiError, isJsonObject } from "./api-client.js";
import {
  createToolError,
  createToolSuccess,
  renderFlowMarkdown,
  renderListMarkdown,
  renderLookupMarkdown,
  renderStatusMarkdown,
} from "./format.js";
import {
  cepInputSchema,
  funnelFlowInputSchema,
  listInputSchema,
  listOutputSchema,
  lookupOutputSchema,
  phoneInputSchema,
  phoneListInputSchema,
  pipelineFlowOutputSchema,
  serviceStatusOutputSchema,
  statusByFunnelAndCpfInputSchema,
  statusByIdInputSchema,
} from "./schemas.js";
import { sanitizeForOutput } from "./security.js";
import type { JsonObject, JsonValue, ServiceStatus } from "./types.js";

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} satisfies ToolAnnotations;

function normalizeDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

function normalizeCpf(value: string): string {
  const digits = normalizeDigits(value);
  if (digits.length !== 11) {
    throw new Error("CPF must have exactly 11 digits after removing punctuation.");
  }
  return digits;
}

function normalizeCep(value: string): string {
  const digits = normalizeDigits(value);
  if (digits.length !== 8) {
    throw new Error("CEP must have exactly 8 digits after removing punctuation.");
  }
  return digits;
}

function normalizePhone(value: string): string {
  const digits = normalizeDigits(value);
  if (digits.length < 10 || digits.length > 13) {
    throw new Error("Phone must have between 10 and 13 digits after removing punctuation.");
  }
  return digits;
}

function ensureArray(value: JsonValue, context: string): JsonValue[] {
  if (!Array.isArray(value)) {
    throw new Error(`Unexpected API response for ${context}: expected an array.`);
  }

  return value;
}

function ensureStatus(value: JsonValue, context: string): ServiceStatus {
  if (!isJsonObject(value)) {
    throw new Error(`Unexpected API response for ${context}: expected an object.`);
  }

  return value as ServiceStatus;
}

function sliceItems(items: JsonValue[], limit: number): {
  items: JsonValue[];
  count: number;
  total_count: number;
  truncated: boolean;
} {
  const sliced = items.slice(0, limit);
  return {
    items: sliced,
    count: sliced.length,
    total_count: items.length,
    truncated: items.length > sliced.length,
  };
}

export function registerKemosoftTools(server: McpServer, client: KemosoftApiClient): void {
  server.registerTool(
    "kemosoft_list_active_pipelines",
    {
      title: "List Active Pipelines",
      description: "List active customer service funnels/pipelines configured in the Kemosoft API.",
      inputSchema: listInputSchema,
      outputSchema: listOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ limit, response_format }) => {
      try {
        const raw = await client.get<JsonValue>("/v1/atendimento/funis-ativos");
        const payload = sliceItems(
          ensureArray(raw, "list active pipelines").map((item) => sanitizeForOutput(item, "generic")),
          limit,
        );
        return createToolSuccess(
          response_format,
          payload,
          renderListMarkdown("Active Pipelines", payload.items, payload.total_count, payload.truncated),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_list_lost_reasons",
    {
      title: "List Lost Reasons",
      description: "List available lost/closing reasons for customer service records in Kemosoft.",
      inputSchema: listInputSchema,
      outputSchema: listOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ limit, response_format }) => {
      try {
        const raw = await client.get<JsonValue>("/v1/atendimento/motivos-encerramento");
        const payload = sliceItems(
          ensureArray(raw, "list lost reasons").map((item) => sanitizeForOutput(item, "generic")),
          limit,
        );
        return createToolSuccess(
          response_format,
          payload,
          renderListMarkdown("Lost Reasons", payload.items, payload.total_count, payload.truncated),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_list_events",
    {
      title: "List Events",
      description: "List customer service events available in the Kemosoft API.",
      inputSchema: listInputSchema,
      outputSchema: listOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ limit, response_format }) => {
      try {
        const raw = await client.get<JsonValue>("/v1/atendimento/eventos");
        const payload = sliceItems(
          ensureArray(raw, "list events").map((item) => sanitizeForOutput(item, "generic")),
          limit,
        );
        return createToolSuccess(
          response_format,
          payload,
          renderListMarkdown("Events", payload.items, payload.total_count, payload.truncated),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_list_tags",
    {
      title: "List Tags",
      description: "List customer service tags configured in the Kemosoft API.",
      inputSchema: listInputSchema,
      outputSchema: listOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ limit, response_format }) => {
      try {
        const raw = await client.get<JsonValue>("/v1/atendimento/etiquetas");
        const payload = sliceItems(
          ensureArray(raw, "list tags").map((item) => sanitizeForOutput(item, "generic")),
          limit,
        );
        return createToolSuccess(
          response_format,
          payload,
          renderListMarkdown("Tags", payload.items, payload.total_count, payload.truncated),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_validate_phone",
    {
      title: "Validate Phone",
      description: "Validate whether a phone number exists on WhatsApp according to the Kemosoft API.",
      inputSchema: phoneInputSchema,
      outputSchema: lookupOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ phone, response_format }) => {
      try {
        const normalizedPhone = normalizePhone(phone);
        const result = await client.get<JsonValue>(
          `/v1/atendimento/validar-telefone/${encodeURIComponent(normalizedPhone)}`,
        );
        const payload = {
          input: sanitizeForOutput(normalizedPhone, "customer"),
          result: sanitizeForOutput(result, "generic"),
        };
        return createToolSuccess(
          response_format,
          payload,
          renderLookupMarkdown("Validate Phone", "Phone", String(payload.input), payload.result),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_search_address_by_cep",
    {
      title: "Search Address by CEP",
      description: "Resolve a CEP into address data using the Kemosoft API.",
      inputSchema: cepInputSchema,
      outputSchema: lookupOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ cep, response_format }) => {
      try {
        const normalizedCep = normalizeCep(cep);
        const result = await client.get<JsonValue>(
          `/v1/atendimento/buscar-endereco/${encodeURIComponent(normalizedCep)}`,
        );
        const payload = {
          input: normalizedCep,
          result: sanitizeForOutput(result, "generic"),
        };
        return createToolSuccess(
          response_format,
          payload,
          renderLookupMarkdown("Address Lookup by CEP", "CEP", normalizedCep, payload.result),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_find_services_by_phone",
    {
      title: "Find Services by Phone",
      description: "Find existing customer service records by phone number, grouped by CPF in the Kemosoft API.",
      inputSchema: phoneListInputSchema,
      outputSchema: listOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ phone, limit, response_format }) => {
      try {
        const normalizedPhone = normalizePhone(phone);
        const raw = await client.get<JsonValue>(
          `/v1/atendimento/funil/${encodeURIComponent(normalizedPhone)}`,
        );
        const payload = sliceItems(
          ensureArray(raw, "find services by phone").map((item) => sanitizeForOutput(item, "customer")),
          limit,
        );
        return createToolSuccess(
          response_format,
          payload,
          renderListMarkdown("Services by Phone", payload.items, payload.total_count, payload.truncated),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_get_pipeline_flow",
    {
      title: "Get Pipeline Flow",
      description: "Fetch workspace and flow data for a given Kemosoft funnel/pipeline slug.",
      inputSchema: funnelFlowInputSchema,
      outputSchema: pipelineFlowOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ funnel, include_images, response_format }) => {
      try {
        const result = await client.get<JsonValue>(
          `/v1/atendimento/${encodeURIComponent(funnel)}/fluxo`,
          { imagens: include_images },
        );
        const payload = {
          funnel,
          include_images,
          result: sanitizeForOutput(result, "generic"),
        };
        return createToolSuccess(
          response_format,
          payload,
          renderFlowMarkdown("Pipeline Flow", funnel, include_images, payload.result),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_get_service_status_by_id",
    {
      title: "Get Service Status by ID",
      description: "Fetch the current status of a customer service record by atendimento ID.",
      inputSchema: statusByIdInputSchema,
      outputSchema: serviceStatusOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ service_id, include_customer_data, response_format }) => {
      try {
        const status = ensureStatus(
          await client.get<JsonValue>(
            `/v1/atendimento/${encodeURIComponent(service_id)}/status`,
            { dadosCliente: include_customer_data },
          ),
          "get service status by id",
        );

        const payload: JsonObject = { status: sanitizeForOutput(status, "customer") };
        return createToolSuccess(
          response_format,
          payload,
          renderStatusMarkdown(
            "Service Status by ID",
            payload.status as ServiceStatus,
            include_customer_data,
          ),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );

  server.registerTool(
    "kemosoft_get_service_status_by_funnel_and_cpf",
    {
      title: "Get Service Status by Funnel and CPF",
      description: "Fetch the current status of a customer service record by funnel slug and CPF.",
      inputSchema: statusByFunnelAndCpfInputSchema,
      outputSchema: serviceStatusOutputSchema,
      annotations: READ_ONLY_ANNOTATIONS,
    },
    async ({ funnel, cpf, include_customer_data, response_format }) => {
      try {
        const normalizedCpf = normalizeCpf(cpf);
        const status = ensureStatus(
          await client.get<JsonValue>(
            `/v1/atendimento/${encodeURIComponent(funnel)}/${encodeURIComponent(normalizedCpf)}/status`,
            { dadosCliente: include_customer_data },
          ),
          "get service status by funnel and cpf",
        );

        const payload: JsonObject = { status: sanitizeForOutput(status, "customer") };
        return createToolSuccess(
          response_format,
          payload,
          renderStatusMarkdown(
            "Service Status by Funnel and CPF",
            payload.status as ServiceStatus,
            include_customer_data,
          ),
        );
      } catch (error) {
        return createToolError(formatApiError(error));
      }
    },
  );
}
