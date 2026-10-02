import { llmsFullText } from "~/features/guide/llms";

// /llms.txt plus the whole /visualize-codebase guide, in one file. Built once.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsFullText(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
