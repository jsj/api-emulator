import type { ServicePlugin } from "@api-emulator/core";

export const plugin: ServicePlugin = {
  name: "github",
  register() {},
};

export const endpoints = "GitHub OpenAPI fallback";
export const contract = {
  fidelity: "stateful-core-plus-openapi-compatible-generic-fallback",
};
