export default function Hero() {
  return (
    <div className="mb-8 flex flex-col items-center space-y-3 text-center select-none">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#3F5E36]/80 bg-[#1c241a] px-3.5 py-1 font-mono text-xs text-[#8DA982] shadow-[0_0_15px_rgba(95,127,82,0.15)]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#5F7F52]" />
        <span className="font-semibold tracking-wider uppercase">
          gnu.in.labs · architecture studio
        </span>
      </div>

      <h1 className="max-w-2xl font-sans text-3xl leading-tight font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
        Inspect, map, and navigate{" "}
        <span className="text-[#8DA982] dark:text-[#8DA982]">any codebase</span>
        .
      </h1>

      <p className="max-w-xl font-sans text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
        Deterministic component graphs, subsystem topologies, and cross-crate
        dataflows generated directly from source files with zero cloud lock-in.
      </p>
    </div>
  );
}
