import { z } from "zod";

import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT } from "./constants.js";

export const responseFormatSchema = z.enum(["markdown", "json"]);
export type ResponseFormat = z.infer<typeof responseFormatSchema>;

const responseFormatField = responseFormatSchema
  .default("markdown")
  .describe("Response format. Use 'markdown' for readability or 'json' for structured output.");

const listLimitField = z
  .number()
  .int()
  .min(1)
  .max(MAX_LIST_LIMIT)
  .default(DEFAULT_LIST_LIMIT)
  .describe(`Maximum number of items to return, between 1 and ${MAX_LIST_LIMIT}.`);

const phoneField = z
  .string()
  .min(8)
  .max(20)
  .describe("Phone number with or without punctuation.");

const cepField = z
  .string()
  .min(8)
  .max(9)
  .describe("CEP with or without punctuation.");

const cpfField = z
  .string()
  .min(11)
  .max(18)
  .describe("CPF with or without punctuation.");

const funnelField = z
  .string()
  .min(1)
  .max(100)
  .describe("Pipeline/funnel slug used by the API.");

const serviceIdField = z
  .string()
  .min(1)
  .max(100)
  .describe("Atendimento identifier.");

export const listInputSchema = z
  .object({
    limit: listLimitField,
    response_format: responseFormatField,
  })
  .strict();

export const phoneInputSchema = z
  .object({
    phone: phoneField,
    response_format: responseFormatField,
  })
  .strict();

export const phoneListInputSchema = z
  .object({
    phone: phoneField,
    limit: listLimitField,
    response_format: responseFormatField,
  })
  .strict();

export const cepInputSchema = z
  .object({
    cep: cepField,
    response_format: responseFormatField,
  })
  .strict();

export const funnelFlowInputSchema = z
  .object({
    funnel: funnelField,
    include_images: z
      .boolean()
      .default(false)
      .describe("Include base64 image fields when the API supports them."),
    response_format: responseFormatField,
  })
  .strict();

export const statusByIdInputSchema = z
  .object({
    service_id: serviceIdField,
    include_customer_data: z
      .boolean()
      .default(false)
      .describe("Include customer data in the API response."),
    response_format: responseFormatField,
  })
  .strict();

export const statusByFunnelAndCpfInputSchema = z
  .object({
    funnel: funnelField,
    cpf: cpfField,
    include_customer_data: z
      .boolean()
      .default(false)
      .describe("Include customer data in the API response."),
    response_format: responseFormatField,
  })
  .strict();

export const listOutputSchema = z
  .object({
    items: z.array(z.unknown()),
    count: z.number().int().nonnegative(),
    total_count: z.number().int().nonnegative(),
    truncated: z.boolean(),
  })
  .strict();

export const lookupOutputSchema = z
  .object({
    input: z.string(),
    result: z.unknown(),
  })
  .strict();

export const pipelineFlowOutputSchema = z
  .object({
    funnel: z.string(),
    include_images: z.boolean(),
    result: z.unknown(),
  })
  .strict();

export const serviceStatusOutputSchema = z
  .object({
    status: z.unknown(),
  })
  .strict();
