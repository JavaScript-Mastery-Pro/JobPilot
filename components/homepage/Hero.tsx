import Link from "next/link";

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-5xl font-bold text-primary leading-tight max-w-2xl">
        Apply to jobs while you sleep.
      </h1>
      <p className="mt-4 text-lg text-secondary max-w-xl">
        JobPilot browses LinkedIn, scores every listing against your profile,
        and submits applications — automatically.
      </p>
      <Link
        href="/login"
        className="mt-8 h-11 px-6 rounded-xl bg-accent-primary hover:bg-accent-hover hover:shadow-accent text-bg-base text-base font-medium transition-colors duration-150 inline-flex items-center"
      >
        Get Started
      </Link>

      <div className="bg-surface border border-border-default border-t-2 border-t-accent-primary rounded-2xl p-5 max-w-lg w-full mx-auto mt-10 text-left">
        <div className="flex items-center gap-3 py-2.5 border-b border-border-default">
          <span className="text-xs text-faint font-mono w-12 shrink-0">09:41</span>
          <span className="h-2 w-2 rounded-full bg-state-success shrink-0" />
          <span className="text-sm text-secondary flex-1">
            Applied to{" "}
            <span className="text-accent-text font-medium">Stripe</span>{" "}
            — Frontend Engineer
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-state-success-dim text-state-success border border-state-success/20">
            91%
          </span>
        </div>

        <div className="flex items-center gap-3 py-2.5 border-b border-border-default">
          <span className="text-xs text-faint font-mono w-12 shrink-0">09:43</span>
          <span className="h-2 w-2 rounded-full bg-state-success shrink-0" />
          <span className="text-sm text-secondary flex-1">
            Applied to{" "}
            <span className="text-accent-text font-medium">Vercel</span>{" "}
            — React Developer
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-state-success-dim text-state-success border border-state-success/20">
            87%
          </span>
        </div>

        <div className="flex items-center gap-3 py-2.5 border-b border-border-default">
          <span className="text-xs text-faint font-mono w-12 shrink-0">09:44</span>
          <span className="h-2 w-2 rounded-full bg-state-warning shrink-0 animate-pulse" />
          <span className="text-sm text-secondary flex-1">
            Applying to{" "}
            <span className="text-accent-text font-medium">Linear</span>{" "}
            — UI Engineer
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-state-warning-dim text-state-warning border border-state-warning/20">
            83%
          </span>
        </div>

        <div className="flex items-center gap-3 py-2.5">
          <span className="text-xs text-faint font-mono w-12 shrink-0">09:45</span>
          <span className="h-2 w-2 rounded-full bg-state-neutral shrink-0" />
          <span className="text-sm text-muted flex-1">
            Scanning LinkedIn for React Developer roles...
          </span>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <span className="w-12 shrink-0" />
          <span className="inline-block h-3.5 w-0.5 bg-accent-primary animate-pulse" />
        </div>
      </div>
    </section>
  );
}
