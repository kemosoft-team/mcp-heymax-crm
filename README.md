# mcp-heymax-crm

MCP server em TypeScript para a API de atendimento do HeyMax CRM hospedada em `ms-crm-az.kemosoft.com.br`.

## Estado atual

Esta primeira versão expõe apenas ferramentas read-only. Foi uma decisão deliberada.

Revisão adversarial:
- A OpenAPI da API está incompleta para operações de escrita.
- Publicar tools destrutivas agora aumentaria risco operacional sem garantia de contrato estável.
- O servidor já é útil para consulta, mas ainda não é um conector "completo" de CRM.

## Fluxo

```mermaid
sequenceDiagram
    participant Cliente as Cliente MCP
    participant Servidor as mcp-heymax-crm
    participant API as HeyMax CRM API

    Cliente->>Servidor: chama tool
    Servidor->>Servidor: valida input com Zod
    Servidor->>API: envia request com api-key
    API-->>Servidor: retorna JSON ou erro HTTP
    Servidor->>Servidor: normaliza resposta/erro
    Servidor-->>Cliente: structuredContent + texto
```

## Requisitos

- Node.js `>= 22`
- `npm`
- Credencial válida em `KEMOSOFT_API_KEY`

## Variáveis de ambiente

Copie `.env.example` para `.env` ou exporte as variáveis no shell:

- `KEMOSOFT_API_KEY`: obrigatório
- `KEMOSOFT_API_BASE_URL`: opcional, default `https://ms-crm-az.kemosoft.com.br`
- `KEMOSOFT_TIMEOUT_MS`: opcional, default `20000`
- `KEMOSOFT_API_SOURCE`: opcional nesta versão; será usado nas futuras operações de escrita

## Instalação

```bash
npm install
npm run build
```

## Execução

Modo local via stdio:

```bash
npm start
```

Desenvolvimento:

```bash
npm run dev
```

## Tools disponíveis

- `kemosoft_list_active_pipelines`
- `kemosoft_list_lost_reasons`
- `kemosoft_list_events`
- `kemosoft_list_tags`
- `kemosoft_validate_phone`
- `kemosoft_search_address_by_cep`
- `kemosoft_find_services_by_phone`
- `kemosoft_get_pipeline_flow`
- `kemosoft_get_service_status_by_id`
- `kemosoft_get_service_status_by_funnel_and_cpf`

## Exemplo de configuração em cliente MCP

Exemplo genérico de comando:

```json
{
  "command": "node",
  "args": ["C:/caminho/para/mcp-heymax-crm/dist/index.js"],
  "env": {
    "KEMOSOFT_API_KEY": "sua-chave",
    "KEMOSOFT_TIMEOUT_MS": "20000"
  }
}
```

## Estrutura do projeto

```text
src/
  api-client.ts
  config.ts
  constants.ts
  format.ts
  index.ts
  schemas.ts
  tools.ts
  types.ts
```

## Verificação

```bash
npm run build
npm run typecheck
```

## Limitações atuais

- Sem tools de escrita
- Sem transporte HTTP
- Sem paginação real no backend; o limite atual corta o array retornado pela API
- Alguns endpoints da API não possuem schema de resposta confiável na documentação
