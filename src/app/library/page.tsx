import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HardDrive, Lock, Globe } from "lucide-react";

import { listLocalDiagrams } from "~/server/storage/local-disk";

export const metadata: Metadata = {
  title: "Library",
  description: "Every diagram stored on this machine.",
  robots: { index: false, follow: false },
};

// The listing is the cache directory itself, so it must never be cached
// itself: a generation writes the file this page reads.
export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function LibraryPage() {
  const entries = listLocalDiagrams();

  return (
    <main className="container mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-balance">Library</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Every diagram this machine has drawn, newest first. Nothing here is on
          a server — these are files in{" "}
          <code className="font-mono text-xs">
            ~/.cache/gnu-in-labs-diagram-studio
          </code>
          .
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="rounded border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
          Nothing stored yet.{" "}
          <Link href="/" className="underline underline-offset-4">
            Draw a diagram
          </Link>{" "}
          and it will appear here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={`${entry.username}/${entry.repo}`}>
              <Link
                href={`/${entry.username}/${entry.repo}`}
                className="group flex items-center justify-between gap-4 rounded border border-[#2B3037] bg-[#181c22] px-4 py-3 transition-colors hover:border-[#3A414B] [data-theme=light]:border-[#d0d7de] [data-theme=light]:bg-[#f6f8fa]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <HardDrive className="h-4 w-4 shrink-0 text-[#8DA982]" />
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm text-white [data-theme=light]:text-[#333]">
                      {entry.username}/{entry.repo}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-neutral-500">
                      <span>{formatDate(entry.lastSuccessfulAt)}</span>
                      {entry.visibility === "private" && (
                        <span className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          private
                        </span>
                      )}
                      {entry.visibility === "public" && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          public
                        </span>
                      )}
                    </span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-neutral-500 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
