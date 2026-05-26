import Link from "next/link";

const activityItems = [
  {
    company: "Northstar Labs",
    role: "Frontend Engineer",
    score: "92",
    status: "Applied",
  },
  {
    company: "Signal Forge",
    role: "Full Stack Developer",
    score: "86",
    status: "Tracked",
  },
  {
    company: "Orbit Systems",
    role: "Product Engineer",
    score: "64",
    status: "Review",
  },
];

export function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-6 py-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:py-16">
      <div className="max-w-2xl">
        <p className="mb-4 inline-flex rounded-full border border-accent-border bg-accent-dim px-3 py-1 text-xs font-medium text-accent-text">
          Job discovery and match tracking for technical job seekers
        </p>
        <h1 className="text-4xl font-semibold leading-tight text-text-primary md:text-5xl xl:text-6xl">
          JobPilot finds the right roles while you stay focused.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary">
          Set up your profile once, then let the agent find public company and
          ATS jobs, score every listing against your experience, and keep apply
          links and tailored materials organized.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-accent-primary px-4 text-sm font-medium text-bg-base transition-colors hover:bg-accent-hover hover:shadow-accent">
            {isLoggedIn ? "View Dashboard" : "Get Started"}
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-default bg-surface shadow-elevated">
        <div className="border-b border-default px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-text-muted">Agent run</p>
              <h2 className="mt-1 text-base font-medium text-text-primary">
                Senior React Engineer
              </h2>
            </div>
            <span className="inline-flex rounded-full border border-state-success/20 bg-state-success-dim px-2.5 py-1 text-xs font-medium text-state-success">
              Running
            </span>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-default bg-elevated p-4">
              <p className="text-2xl font-bold text-text-primary">24</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
                Found
              </p>
            </div>
            <div className="rounded-2xl border border-default bg-elevated p-4">
              <p className="text-2xl font-bold text-text-primary">14</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
                Matched
              </p>
            </div>
            <div className="rounded-2xl border border-default bg-elevated p-4">
              <p className="text-2xl font-bold text-text-primary">8</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
                Saved
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-default bg-elevated">
            {activityItems.map((item) => (
              <div
                key={item.company}
                className="grid grid-cols-[1fr_auto] gap-4 border-b border-default px-4 py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {item.role}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">{item.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-state-success">
                    {item.score}%
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {item.status}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-accent-border bg-accent-dim p-4">
            <p className="text-sm font-medium text-accent-text">
              Reviewing Northstar Labs
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Source link, company apply page, match score, and tailored
              materials are ready to inspect.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
