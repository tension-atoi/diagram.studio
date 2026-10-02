import type { Metadata } from "next";
import MainCard from "~/components/main-card";
import Hero from "~/components/hero";

export const metadata: Metadata = {
  title: "gnu.in.labs / diagram studio",
  description:
    "Inspect, map, and navigate any codebase with deterministic architecture diagrams.",
};

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8">
      <div className="flex w-full max-w-4xl flex-col items-center">
        <Hero />
        <MainCard />
      </div>
    </main>
  );
}
