import { createApiEmulatorWorker, createKVState } from "@api-emulator/adapter-cloudflare";
// The private plugin remains the contract of record for the Mercor prototype.
// @ts-expect-error The private JavaScript plugin intentionally has no public type declaration.
import { plugin } from "../../../../../api-emulator-internal/@mercor/api-emulator.mjs";

interface Env {
  MERCOR_STATE: KVNamespace;
}

export default createApiEmulatorWorker<Env>({
  emulator: { plugin },
  state: (environment) => createKVState(environment.MERCOR_STATE, "mercor:store:v1"),
});
