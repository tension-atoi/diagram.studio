import type { Metadata } from "next";

import { TextPage, type TextPageSection } from "~/components/text-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What the diagram studio reads, where it stores it, and what it sends.",
  alternates: { canonical: "/privacy" },
};

const sections: TextPageSection[] = [
  {
    heading: "This app runs on your machine",
    body: [
      "gnu.in.labs / diagram studio is a desktop application. The server that draws diagrams is started by the app itself and listens only on 127.0.0.1, so other devices on your network cannot reach it. Nothing about your use of it is visible to us, because there is no service on our side to see it.",
      "This policy describes the two things that genuinely leave your computer, and where everything else is kept.",
    ],
  },
  {
    heading: "What is read from GitHub",
    body: [
      "When you ask for a diagram, the app reads that repository through GitHub's API: its file tree, its README, and the individual source files the diagram links to. GitHub receives those requests from your IP address, under GitHub's own terms.",
      "For a private repository you supply a GitHub token. It is held by the app for the session and never written to a server, because there is no server to write it to.",
    ],
  },
  {
    heading: "What is sent to an AI provider",
    body: [
      "Drawing a diagram means sending parts of the repository to the model that writes it. By default that model is Ollama running on 127.0.0.1:11434 on your own machine, in which case the repository content does not leave the computer at all.",
      "If you choose a hosted provider in the settings — OpenRouter, or an OpenAI-compatible service — the relevant parts of the repository are sent to that provider to produce the diagram, under that provider's terms. This is the one place where repository content can leave the machine, and it is a choice made in the settings.",
      "The optional TypeSafe/Jev semantic verifier, when a key is configured, also receives a bounded extract of the repository for verification: at most 20 edge snippets of 300 characters each, a 1500-character README excerpt, a 2000-character manifest excerpt, and at most 60 file paths. It is off unless a key is set, and the packaged app ships without one.",
    ],
  },
  {
    heading: "Where your diagrams are stored",
    body: [
      "Diagrams are written to your own disk, under ~/.cache/gnu-in-labs-diagram-studio/, one JSON file per repository. There is no hosted database, no object storage bucket, and no CDN copy.",
      "The application also keeps a port choice, a signing secret and a log file under the platform's application-data directory for gnu.in.labs Diagram Studio. The signing secret is generated on first launch, stored readable only by your user account, and never leaves the machine.",
      "Deleting the cache directory removes your stored diagrams; the application offers no remote copy to restore them from.",
    ],
  },
  {
    heading: "Keys you enter",
    body: [
      "GitHub tokens, OpenRouter keys and TypeSafe keys are written to the application-data directory, readable only by your user account, so they survive a restart. They are passed to the server process through its environment and are never written into the application bundle.",
      "Removing a key from the settings removes it from that file.",
    ],
  },
  {
    heading: "Analytics",
    body: [
      "There is no analytics in this build. No page-view tracker is mounted and no analytics key is configured, so the analytics library is never loaded and no event is sent. Code for optional product analytics remains in the tree but is unreachable; see docs/operations/posthog.md.",
    ],
  },
  {
    heading: "Rate limiting",
    body: [
      "Generation requests are limited in-process. The counters are held in memory or on your disk, they expire at the end of their window, and no counter leaves the machine. No external rate-limiting service is configured.",
    ],
  },
  {
    heading: "Payments, email and hosting",
    body: [
      "None of these are active. There is no payment provider configured, no transactional email service, and no hosting platform behind this application. The integrations that would use them remain in the code but are unreachable without credentials.",
    ],
  },
  {
    heading: "How long data is kept",
    body: [
      "Repository content sent to a provider is governed by that provider's retention. Locally: diagrams stay in the cache directory until you delete them, keys stay in the application-data directory until you remove them, and the signing secret persists for the life of the install.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "This application is free software. Questions and bug reports belong in the repository's issue tracker: https://github.com/tension-atoi/diagram.studio.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <TextPage
      title="Privacy Policy"
      updated="October 2, 2026"
      sections={sections}
    />
  );
}
