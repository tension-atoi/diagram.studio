import { llmsText } from "~/features/guide/llms";

// https://llmstxt.org: what diagram studio is and how agents use it. Built once.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsText(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
