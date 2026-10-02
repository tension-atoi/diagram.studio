// @vitest-environment node
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A fresh module per test: the route keeps the live choice in module state, so
 * a shared instance would leak the previous test's language into the next one.
 */
async function loadRoute() {
  vi.resetModules();
  return await import("~/app/api/settings/lang/route");
}

function postRequest(body: unknown): Request {
  return new Request("https://gitdiagram.com/api/settings/lang", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

let configDir = "";
let envPath = "";

beforeEach(async () => {
  configDir = await mkdtemp(join(tmpdir(), "diagram-lang-"));
  envPath = join(configDir, ".env.local");
  // Never let the ambient environment decide what the route reports.
  vi.stubEnv("APP_LANG", "");
  vi.stubEnv("DIAGRAM_USER_DATA", configDir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(configDir, { recursive: true, force: true });
});

describe("/api/settings/lang", () => {
  it("reports English until a language is chosen", async () => {
    const { GET } = await loadRoute();

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ lang: "en" });
  });

  it("reports a language persisted in the environment", async () => {
    vi.stubEnv("APP_LANG", "fr");
    const { GET } = await loadRoute();

    await expect((await GET()).json()).resolves.toEqual({ lang: "fr" });
  });

  it("persists a valid language into the writable config directory", async () => {
    const { POST, GET } = await loadRoute();

    const response = await POST(postRequest({ lang: "fr" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      lang: "fr",
    });
    await expect(readFile(envPath, "utf-8")).resolves.toBe("APP_LANG=fr\n");
    // The file also holds API keys, so it must stay owner-only.
    expect((await stat(envPath)).mode & 0o777).toBe(0o600);
    await expect((await GET()).json()).resolves.toEqual({ lang: "fr" });
  });

  it("replaces an existing APP_LANG line and leaves the other keys alone", async () => {
    await writeFile(
      envPath,
      "ACTIVE_MODEL=qwen3.6:35b-studio\nOPENROUTER_API_KEY=sk-test\nAPP_LANG=en\n",
    );
    const { POST } = await loadRoute();

    await POST(postRequest({ lang: "fr" }));

    const contents = await readFile(envPath, "utf-8");
    expect(contents).toBe(
      "ACTIVE_MODEL=qwen3.6:35b-studio\nOPENROUTER_API_KEY=sk-test\nAPP_LANG=fr\n",
    );
  });

  it("rejects an unsupported language without writing anything", async () => {
    const { POST } = await loadRoute();

    for (const body of [{ lang: "de" }, { lang: "" }, {}, { lang: 42 }]) {
      const response = await POST(postRequest(body));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toHaveProperty("error");
    }
    await expect(readFile(envPath, "utf-8")).rejects.toThrow();
  });

  it("rejects a body that is not JSON", async () => {
    const { POST } = await loadRoute();

    const response = await POST(postRequest("{oops"));

    expect(response.status).toBe(400);
  });
});
