import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

import { CACHE_ROOT } from "~/server/storage/local-disk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { username, repo } = await request.json();
    if (!username || !repo) {
      return NextResponse.json(
        { error: "Missing username or repo" },
        { status: 400 },
      );
    }

    const safeUser = username.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    const safeRepo = repo.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    const file = path.join(CACHE_ROOT, safeUser, `${safeRepo}.json`);

    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }

    return NextResponse.json({ success: true, message: "Local cache purged" });
  } catch {
    return NextResponse.json(
      { error: "Failed to purge cache" },
      { status: 500 },
    );
  }
}
