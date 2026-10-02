import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({
  after: () => {
    throw new Error("outside a request");
  },
}));

import { indexNowKey, notifyIndexNow } from "./indexnow";

import { siteUrl } from "~/test-support/site";

const KEY = "0123456789abcdef0123456789abcdef";
const originalEnv = { ...process.env };
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
  process.env.INDEXNOW_KEY = KEY;
  process.env.VERCEL_ENV = "production";
});
afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("IndexNow", () => {
  it("submits this site's changed pages with the key and its location", async () => {
    await notifyIndexNow([
      siteUrl("/acme/demo"),
      siteUrl("/acme/demo"),
      "https://example.com/elsewhere",
      "not a url",
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.indexnow.org/indexnow");
    expect(JSON.parse(init.body as string)).toEqual({
      host: new URL(siteUrl()).host,
      key: KEY,
      keyLocation: siteUrl(`/${KEY}.txt`),
      urlList: [siteUrl("/acme/demo")],
    });
  });

  it("stays quiet outside production and without a valid key", async () => {
    process.env.VERCEL_ENV = "preview";
    await notifyIndexNow([siteUrl("/a/b")]);
    process.env.VERCEL_ENV = "production";
    process.env.INDEXNOW_KEY = "short";
    await notifyIndexNow([siteUrl("/a/b")]);
    expect(indexNowKey()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when the endpoint fails", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    await expect(notifyIndexNow([siteUrl("/a/b")])).resolves.toBeUndefined();
    fetchMock.mockResolvedValue(new Response("slow down", { status: 429 }));
    await expect(notifyIndexNow([siteUrl("/a/b")])).resolves.toBeUndefined();
  });
});
