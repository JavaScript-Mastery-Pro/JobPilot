const features = [
  {
    title: "Match scoring",
    body: "GPT-4o compares each role to your profile and explains why it belongs in your tracked list or review.",
  },
  {
    title: "Apply links",
    body: "JobPilot keeps source and company apply links visible so each role can be inspected before you act.",
  },
  {
    title: "Tailored materials",
    body: "Cover letters and resumes are generated from your profile, preferred tone, and the job description.",
  },
  {
    title: "Live visibility",
    body: "Dashboard stats, logs, and Browserbase recordings keep every application run observable.",
  },
];

export function Features() {
  return (
    <section className="bg-base">
      <div className="mx-auto max-w-7xl px-6 py-32 lg:py-36">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-text">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-text-primary">
              Built around the parts of applying that waste the most time.
            </h2>
            <p className="mt-4 text-sm leading-6 text-text-secondary">
              JobPilot is designed for developers who want targeted discovery,
              clear control, and records they can inspect after every run.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="min-h-64 rounded-2xl border border-default bg-elevated p-8"
              >
                <div className="mb-5 h-2 w-10 rounded-full bg-accent-primary" />
                <h3 className="text-base font-medium text-text-primary">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">
                  {feature.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
