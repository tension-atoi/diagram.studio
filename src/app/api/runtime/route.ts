import { NextResponse } from "next/server";

import { checkRuntime } from "~/server/runtime-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports the local engine's reachability and whether the semantic verifier is
 * configured. It always answers 200 with the verdict in the body: "not
 * running" and "not configured" are states, not failed requests.
 */
export async function GET() {
  const status = await checkRuntime();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
