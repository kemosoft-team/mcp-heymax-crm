import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  cwd: process.cwd(),
  env: {
    ...process.env,
    KEMOSOFT_API_KEY: process.env.KEMOSOFT_API_KEY || "smoke-test-key",
  },
  stderr: "pipe",
});

if (transport.stderr) {
  transport.stderr.on("data", (chunk) => {
    process.stderr.write(String(chunk));
  });
}

const client = new Client(
  { name: "mcp-heymax-crm-smoke", version: "0.1.0" },
  { capabilities: {} },
);

try {
  await client.connect(transport);
  const toolsResponse = await client.listTools();
  const toolNames = toolsResponse.tools.map((tool) => tool.name).sort();

  if (toolNames.length < 10) {
    throw new Error(`Expected at least 10 tools, got ${toolNames.length}.`);
  }

  const expectedTools = [
    "kemosoft_find_services_by_phone",
    "kemosoft_get_pipeline_flow",
    "kemosoft_get_service_status_by_funnel_and_cpf",
    "kemosoft_get_service_status_by_id",
    "kemosoft_list_active_pipelines",
    "kemosoft_list_events",
    "kemosoft_list_lost_reasons",
    "kemosoft_list_tags",
    "kemosoft_search_address_by_cep",
    "kemosoft_validate_phone",
  ];

  for (const expectedTool of expectedTools) {
    if (!toolNames.includes(expectedTool)) {
      throw new Error(`Missing expected tool: ${expectedTool}`);
    }
  }

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        toolCount: toolNames.length,
        tools: toolNames,
      },
      null,
      2,
    ),
  );
  process.stdout.write("\n");
} finally {
  await client.close();
}
