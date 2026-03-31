import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeForOutput, validateApiBaseUrl } from "../dist/security.js";

test("validateApiBaseUrl accepts only the canonical upstream host", () => {
  assert.equal(
    validateApiBaseUrl("https://ms-crm-az.kemosoft.com.br"),
    "https://ms-crm-az.kemosoft.com.br/",
  );

  assert.throws(
    () => validateApiBaseUrl("https://evil.example.com"),
    /host is fixed/i,
  );

  assert.throws(
    () => validateApiBaseUrl("http://ms-crm-az.kemosoft.com.br"),
    /must use HTTPS/i,
  );
});

test("sanitizeForOutput redacts customer PII", () => {
  const result = sanitizeForOutput(
    {
      cpf: "12345678901",
      telefone: "85999999999",
      email: "fulano@example.com",
      nome: "Fulano da Silva",
      cliente: {
        cpfRepresentante: "98765432100",
      },
    },
    "customer",
  );

  assert.deepEqual(result, {
    cpf: "*******8901",
    telefone: "*******9999",
    email: "f***@example.com",
    nome: "F*** d*** S***",
    cliente: {
      cpfRepresentante: "*******2100",
    },
  });
});

test("sanitizeForOutput strips large content and truncates collections", () => {
  const largeBase64 = "A".repeat(1024);
  const result = sanitizeForOutput(
    {
      imageBase64: largeBase64,
      contratos: Array.from({ length: 25 }, (_, index) => ({ id: index + 1 })),
    },
    "generic",
  );

  assert.equal(result.imageBase64, "[redacted large content]");
  assert.equal(result.contratos.length, 21);
  assert.equal(result.contratos.at(-1), "[truncated 5 item(s)]");
});
