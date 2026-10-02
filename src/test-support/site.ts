import { SITE_URL } from "~/lib/site";

/**
 * The address the studio considers itself reachable at.
 *
 * Tests use this instead of a hardcoded host, so a change to SITE_URL's default
 * cannot silently invalidate every URL a test asserts on. It is the loopback
 * origin the desktop app serves on, never a public one.
 */
export const ORIGIN = SITE_URL.replace(/\/+$/, "");

/** `${ORIGIN}/path`, for building a URL in an assertion. */
export function siteUrl(path = ""): string {
  return `${ORIGIN}${path}`;
}
