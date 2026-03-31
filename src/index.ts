#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { HeymaxCrmApiClient } from "./api-client.js";
import { loadApiConfig } from "./config.js";
import { SERVER_INFO } from "./constants.js";
import { registerHeymaxCrmTools } from "./tools.js";

async function main(): Promise<void> {
  const config = loadApiConfig();
  const client = new HeymaxCrmApiClient(config);

  const server = new McpServer({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
  });

  registerHeymaxCrmTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`${SERVER_INFO.name} connected over stdio\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Fatal error: ${message}\n`);
  process.exit(1);
});
