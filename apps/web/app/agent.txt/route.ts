import { agentReferenceText } from "@/lib/agent-reference";

export function GET(): Response {
  return new Response(agentReferenceText, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
