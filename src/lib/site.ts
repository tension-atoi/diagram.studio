/**
 * The studio's own identity.
 *
 * `SITE_URL` is read at runtime rather than baked in: the packaged desktop app
 * passes the local origin it listens on (Electron derives it from the confirmed
 * port), so canonical links, the MCP app frame and Open Graph metadata can
 * never point at somebody else's site. The constant below is only the fallback
 * for a hosted deployment that was started without SITE_URL set.
 *
 * `GITHUB_REPO_URL` is this project's own repository.
 */
function originFromEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : undefined;
}

/**
 * With nothing configured, the studio considers itself to be the local service
 * it is: the same address the desktop app hands its server. A deployment
 * reachable by others sets SITE_URL.
 */
export const SITE_URL =
  originFromEnv(process.env.SITE_URL) ??
  `http://127.0.0.1:${process.env.PORT?.trim() || "3000"}`;

export const GITHUB_REPO_URL = "https://github.com/tension-atoi/diagram.studio";

/**
 * Where agents reach this studio's MCP server: local, on the port the app is
 * actually listening on. Electron sets PORT when it spawns the server, so this
 * resolves to the same endpoint the first-launch dialog confirmed.
 */
export const MCP_URL = `${
  originFromEnv(process.env.MCP_URL) ??
  `http://127.0.0.1:${process.env.PORT?.trim() || "3000"}`
}/mcp`;
