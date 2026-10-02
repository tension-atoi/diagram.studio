import { handleMcpRequest } from "~/server/mcp/handler";

// The studio's MCP server, served at /mcp on the local port the app listens on
// (see src/server/mcp/). Stateless streamable HTTP; read-only.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export {
  handleMcpRequest as GET,
  handleMcpRequest as POST,
  handleMcpRequest as DELETE,
  handleMcpRequest as OPTIONS,
};
