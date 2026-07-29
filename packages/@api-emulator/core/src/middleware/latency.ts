import type { MiddlewareHandler } from "hono";

export function latencyMiddleware(latencyMs: number): MiddlewareHandler {
  if (!Number.isFinite(latencyMs) || latencyMs < 0) {
    throw new RangeError("latencyMs must be a non-negative finite number");
  }

  return async (_context, next) => {
    if (latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
    }
    await next();
  };
}
