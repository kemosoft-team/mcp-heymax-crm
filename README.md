# @kemosoft/mcp-heymax-crm

[![CI](https://github.com/kemosoft-team/mcp-heymax-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/kemosoft-team/mcp-heymax-crm/actions/workflows/ci.yml)

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

## Para quem isso é utilizável

Hoje o servidor é utilizável por qualquer pessoa que tenha:

- Node.js `>= 22`
- acesso a um cliente MCP compatível com `stdio`
- uma credencial válida em `HEYMAX_CRM_API_KEY`

Revisão adversarial:
- Sem credencial válida, o pacote instala mas não entrega valor real.
- Portanto o produto ainda não é "aberto para qualquer pessoa" no sentido de acesso irrestrito à API.

## Requisitos

- Node.js `>= 22`
- `npm`
- Credencial válida em `HEYMAX_CRM_API_KEY`

## Variáveis de ambiente

Copie `.env.example` para `.env` ou exporte as variáveis no shell:

- `HEYMAX_CRM_API_KEY`: obrigatório
- `HEYMAX_CRM_API_SOURCE`: opcional nesta versão; será usado nas futuras operações de escrita

O timeout de request nao e configuravel pelo usuario. Ele e fixo em `30s`.
O host da API tambem nao e configuravel. O servidor so fala com `https://ms-crm-az.kemosoft.com.br`.

## Guardrails de seguranca

- respostas de erro upstream sao sanitizadas
- payloads retornados ao modelo passam por redacao de campos sensiveis
- conteudos potencialmente binarios ou base64 sao removidos do output
- o markdown nao inclui mais dumps brutos de JSON

## Instalação

Via npm local:

```bash
npm install
npm run build
```

Via `npx` depois da publicação no npm:

```bash
npx -y @kemosoft/mcp-heymax-crm
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

## Pipeline de publicação

O release agora é automatizado pelo GitHub Actions quando commits convencionais chegam em `main`.

- `fix:` gera patch
- `feat:` gera minor
- `feat!:` ou `BREAKING CHANGE` gera major
- commits que não alteram versão não disparam release

O fluxo faz:

- `semantic-release` calcula a próxima versão
- gera `CHANGELOG.md`
- publica no npm como `@kemosoft/mcp-heymax-crm`
- cria release no GitHub
- commita os arquivos de release com `[skip ci]` para evitar loop

Secrets necessários no repositório:

- `NPM_TOKEN`: token granular com permissão de publish no scope `@kemosoft`
- `GITHUB_TOKEN`: o GitHub Actions fornece automaticamente

Para validar localmente antes de subir:

```bash
npm run prepack
```

Se você quiser publicar manualmente fora do pipeline, use o fluxo do semantic-release em vez de `npm publish` direto.

## Tools disponíveis

- `heymax_crm_list_active_pipelines`
- `heymax_crm_list_lost_reasons`
- `heymax_crm_list_events`
- `heymax_crm_list_tags`
- `heymax_crm_validate_phone`
- `heymax_crm_search_address_by_cep`
- `heymax_crm_find_services_by_phone`
- `heymax_crm_get_pipeline_flow`
- `heymax_crm_get_service_status_by_id`
- `heymax_crm_get_service_status_by_funnel_and_cpf`

## Exemplo de configuração em cliente MCP

Exemplo genérico de comando:

```json
{
  "command": "node",
  "args": ["C:/caminho/para/mcp-heymax-crm/dist/index.js"],
  "env": {
    "HEYMAX_CRM_API_KEY": "sua-chave"
  }
}
```

### Claude Desktop

```json
{
  "mcpServers": {
    "heymax-crm": {
      "command": "npx",
      "args": ["-y", "@kemosoft/mcp-heymax-crm"],
      "env": {
        "HEYMAX_CRM_API_KEY": "sua-chave"
      }
    }
  }
}
```

### Codex

```json
{
  "mcpServers": {
    "heymax-crm": {
      "command": "npx",
      "args": ["-y", "@kemosoft/mcp-heymax-crm"],
      "env": {
        "HEYMAX_CRM_API_KEY": "sua-chave"
      }
    }
  }
}
```

### Cursor

```json
{
  "mcpServers": {
    "heymax-crm": {
      "command": "node",
      "args": ["/caminho/para/mcp-heymax-crm/dist/index.js"],
      "env": {
        "HEYMAX_CRM_API_KEY": "sua-chave"
      }
    }
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
npm run smoke
```

## Limitações atuais

- Sem tools de escrita
- Sem transporte HTTP
- Sem paginação real no backend; o limite atual corta o array retornado pela API
- Alguns endpoints da API não possuem schema de resposta confiável na documentação
- A utilidade prática ainda depende de distribuição controlada de `HEYMAX_CRM_API_KEY`
