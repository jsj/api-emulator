import { describe, expect, it } from "vitest";
import { openApiPathToHonoPath, registerOpenApiMockAdapter } from "../openapi-mock.js";

describe("OpenAPI mock adapter", () => {
  it("converts OpenAPI paths to Hono paths", () => {
    expect(openApiPathToHonoPath("/accounts/{account_id}/vectorize/v2/indexes/{index_name}/query")).toBe(
      "/accounts/:accountId/vectorize/v2/indexes/:indexName/query",
    );
  });

  it("registers explicit operations when a manifest is provided", async () => {
    const routes = new Map<string, (context: any) => Promise<Response> | Response>();
    registerOpenApiMockAdapter(
      {
        post: (path, handler) => routes.set(`POST ${path}`, handler),
      },
      {
        basePath: "/client/v4",
        operations: [{ method: "POST", path: "/accounts/{account_id}/ai/run/{model_name}" }],
        responseFactory: (context) => ({ path: context.path, method: context.method }),
      },
    );

    expect(routes.has("POST /client/v4/accounts/:accountId/ai/run/:modelName")).toBe(true);
  });

  it("registers a wildcard adapter when no manifest is provided", () => {
    const routes = new Map<string, (context: any) => Promise<Response> | Response>();
    registerOpenApiMockAdapter(
      {
        all: (path, handler) => routes.set(`ALL ${path}`, handler),
      },
      {
        basePath: "/client/v4",
        responseFactory: () => ({ ok: true }),
      },
    );

    expect(routes.has("ALL /client/v4/*")).toBe(true);
  });
});
