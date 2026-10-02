import type { Metadata } from "next";

import { TextPage, type TextPageSection } from "~/components/text-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using the diagram studio and its local MCP server.",
  alternates: { canonical: "/terms" },
};

const sections: TextPageSection[] = [
  {
    heading: "What this is",
    body: [
      "gnu.in.labs / diagram studio is free software that turns GitHub repositories into interactive architecture diagrams and written explanations. It runs on your own machine, and exposes the same diagrams to AI assistants through a local MCP endpoint. It is not a hosted service: there is no account, no subscription and no operator behind it watching usage.",
      "The source is free and open under the MIT License at https://github.com/tension-atoi/diagram.studio.",
    ],
  },
  {
    heading: "Repositories you are reading",
    body: [
      "Use this only for repositories you are allowed to read, and follow GitHub's terms when you do. Requests to GitHub's API come from your IP address and are subject to its rate limits and acceptable-use policy.",
      "Because the diagram cache lives on your disk and not on a server, a diagram of a public repository is readable by anyone who uses your copy of the app and opens the same repository name. That is a property of a local application, not a published service.",
    ],
  },
  {
    heading: "AI-generated content",
    body: [
      "Diagrams and explanations are written by AI models from a repository's files. They can be incomplete, wrong, or confidently misreading the code, so check anything that matters against the source itself. They exist to help you understand a codebase, not as professional advice.",
      "The repositories belong to their owners. Using a hosted model provider sends parts of a repository to that provider; which one, and under what terms, is described in the privacy policy and chosen in the settings.",
    ],
  },
  {
    heading: "No warranty",
    body: [
      "This software is provided as is and as available, without warranties of any kind. To the extent the law allows, the authors are not liable for indirect or consequential loss arising from its use.",
    ],
  },
  {
    heading: "Changes",
    body: [
      "This software can change, and so can these terms. When the terms change, the date above changes too.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Questions and issues belong in the repository's issue tracker: https://github.com/tension-atoi/diagram.studio. See also the privacy policy.",
    ],
  },
];

export default function TermsPage() {
  return (
    <TextPage
      title="Terms of Service"
      updated="October 2, 2026"
      sections={sections}
    />
  );
}
