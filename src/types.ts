export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  source?: string;
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: JsonValue;
  extraHeaders?: Record<string, string | undefined>;
  source?: string;
}

export interface CustomerData extends JsonObject {
  nome?: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  cpf?: string;
  nomeMae?: string;
  nomeRepresentante?: string;
  cpfRepresentante?: string;
  matriculas?: string[];
}

export interface ServiceStatus extends JsonObject {
  id?: string;
  protocolo?: string;
  categoriaCliente?: string;
  convenio?: string;
  funil?: string;
  etapaFunil?: string;
  etapaAtendimento?: string;
  atendimentos7dias?: number;
  motivoEncerramento?: string;
  acaoAgente?: string;
  respostaAgente?: string;
  respostaAgenteBotoes?: JsonValue[] | null;
  situacaoAtendimento?: string;
  situacaoCredito?: string;
  minutos?: number;
  dias?: number;
  pedirInfos?: string[];
  confirmarInfos?: string[];
  bancosSimulados?: string[];
  oportunidades?: string[];
  creditoTotal?: number;
  creditoEmContratacao?: number;
  saldo?: number;
  cliente?: CustomerData;
}
