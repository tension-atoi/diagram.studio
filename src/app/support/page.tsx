import type { Metadata } from "next";

import { TextPage, type TextPageSection } from "~/components/text-page";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with diagram studio and its local MCP server.",
  alternates: { canonical: "/support" },
};

const sections: TextPageSection[] = [
  {
    heading: "Reporting a problem",
    body: [
      "Bugs and feature requests belong in the issue tracker at https://github.com/tension-atoi/diagram.studio. Include what you ran, what you expected, and what happened instead.",
      "If the app showed an error dialog about the embedded server, the details are in the server log: logs/server.log under the application-data directory for gnu.in.labs Diagram Studio. That file is the fastest route to a diagnosis.",
    ],
  },
  {
    heading: "The status bar",
    body: [
      "The bar at the bottom reports what is actually running, not what it hopes is running. If it reads CHECKING ENGINE, the app has not answered yet. OLLAMA NOT REACHING means the daemon is not answering on 127.0.0.1:11434 — start it with ollama serve. MODEL NOT PULLED means Ollama is up but the configured model is absent; fetch it with ollama pull qwen3.6:35b-studio.",
      "JEV VERIFIER OFF means no TypeSafe key is configured, so semantic verification is not running. That is the expected state of a fresh install.",
    ],
  },
  {
    heading: "Connecting an AI assistant",
    body: [
      "The studio serves an MCP endpoint on the port confirmed at first launch, by default http://127.0.0.1:7421/mcp. The endpoint is local, needs no sign-in, and only answers while the app is running.",
      "In Claude Code: claude mcp add --transport http diagram-studio http://127.0.0.1:7421/mcp. In Codex: codex mcp add diagram-studio --url http://127.0.0.1:7421/mcp.",
      "The port is recorded in config.json in the application-data directory and is shown in the first-launch dialog; edit it there and relaunch to move it.",
    ],
  },
  {
    heading: "Common questions",
    body: [
      "“Ollama is not answering”: the daemon is stopped, or listening on a different port. The expected base URL is http://127.0.0.1:11434/v1.",
      "“The local server did not answer in time”: the embedded Next.js server failed to start within 90 seconds. Read logs/server.log; a missing CACHE_KEY_SECRET or an unreadable standalone build appears there.",
    ],
  },
];

export default function SupportPage() {
  return (
    <TextPage title="Support" updated="October 2, 2026" sections={sections} />
  );
}
