type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

type RouteApp = {
  all?: (path: string, handler: (context: any) => Response | Promise<Response>) => void;
  get?: (path: string, handler: (context: any) => Response | Promise<Response>) => void;
  post?: (path: string, handler: (context: any) => Response | Promise<Response>) => void;
  put?: (path: string, handler: (context: any) => Response | Promise<Response>) => void;
  patch?: (path: string, handler: (context: any) => Response | Promise<Response>) => void;
  delete?: (path: string, handler: (context: any) => Response | Promise<Response>) => void;
};

export type OpenApiMockOperation = {
  method: HttpMethod;
  path: string;
  operationId?: string;
  tags?: string[];
};

export type OpenApiMockContext = {
  method: HttpMethod;
  path: string;
  params: Record<string, string | undefined>;
  query: Record<string, string>;
  operation?: OpenApiMockOperation;
  requestBody?: unknown;
};

export type OpenApiMockResponseFactory = (context: OpenApiMockContext) => unknown | Promise<unknown>;

export type OpenApiMockEnvelope = (result: unknown, context: OpenApiMockContext) => unknown;

export type RegisterOpenApiMockOptions = {
  basePath?: string;
  operations?: OpenApiMockOperation[];
  responseFactory: OpenApiMockResponseFactory;
  envelope?: OpenApiMockEnvelope;
};

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

export function registerOpenApiMockAdapter(app: RouteApp, options: RegisterOpenApiMockOptions): void {
  const basePath = normalizeBasePath(options.basePath ?? "");
  const handler = createOpenApiMockHandler(options);

  if (options.operations?.length) {
    for (const operation of options.operations) {
      const routePath = `${basePath}${openApiPathToHonoPath(operation.path)}`;
      registerMethod(app, operation.method, routePath, handler);
    }
    return;
  }

  if (app.all) {
    app.all(`${basePath}/*`, handler);
    return;
  }

  for (const method of METHODS) registerMethod(app, method, `${basePath}/*`, handler);
}

export function createOpenApiMockHandler(options: RegisterOpenApiMockOptions) {
  return async (c: any) => {
    const context = await buildMockContext(c, options);
    const result = await options.responseFactory(context);
    const payload = options.envelope ? options.envelope(result, context) : result;
    return c.json(payload);
  };
}

export function openApiPathToHonoPath(path: string): string {
  return path.replace(/\{([^}]+)\}/g, (_match, name: string) => `:${toCamelCase(name)}`);
}

function normalizeBasePath(path: string): string {
  if (!path) return "";
  return path.startsWith("/") ? path.replace(/\/$/, "") : `/${path.replace(/\/$/, "")}`;
}

async function buildMockContext(c: any, options: RegisterOpenApiMockOptions): Promise<OpenApiMockContext> {
  const method = String(c.req.method ?? "GET").toUpperCase() as HttpMethod;
  const url = new URL(c.req.url);
  const path = stripBasePath(url.pathname, options.basePath ?? "");
  const params = c.req.param?.() ?? {};
  const query = Object.fromEntries(url.searchParams.entries());
  const operation = findOperation(options.operations ?? [], method, path);
  const requestBody = await readRequestBody(c);
  return { method, path, params, query, operation, requestBody };
}

function stripBasePath(path: string, basePath: string): string {
  const normalized = normalizeBasePath(basePath);
  if (!normalized) return path;
  return path.startsWith(normalized) ? path.slice(normalized.length) || "/" : path;
}

function findOperation(operations: OpenApiMockOperation[], method: HttpMethod, path: string) {
  return operations.find((operation) => operation.method === method && pathMatches(operation.path, path));
}

function registerMethod(
  app: RouteApp,
  method: HttpMethod,
  path: string,
  handler: (context: any) => Response | Promise<Response>,
): void {
  switch (method) {
    case "GET":
      app.get?.(path, handler);
      return;
    case "POST":
      app.post?.(path, handler);
      return;
    case "PUT":
      app.put?.(path, handler);
      return;
    case "PATCH":
      app.patch?.(path, handler);
      return;
    case "DELETE":
      app.delete?.(path, handler);
      return;
    case "HEAD":
    case "OPTIONS":
      app.all?.(path, handler);
      return;
  }
}

function pathMatches(openApiPath: string, actualPath: string): boolean {
  const pattern = new RegExp(
    `^${openApiPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{[^}]+\\\}/g, "[^/]+")}$`,
  );
  return pattern.test(actualPath);
}

async function readRequestBody(c: any): Promise<unknown> {
  if (c.req.method === "GET" || c.req.method === "HEAD") return undefined;
  return c.req.json?.().catch(() => undefined);
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_match, char: string) => char.toUpperCase());
}
