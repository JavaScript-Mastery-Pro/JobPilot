const steps = [
  {
    number: "01",
    title: "Set up your profile",
    body: "Add your experience, target role, skills, preferences, and links once.",
  },
  {
    number: "02",
    title: "Find qualified jobs",
    body: "The agent searches public job results and keeps company or ATS apply links.",
  },
  {
    number: "03",
    title: "Let AI apply",
    body: "Strong matches get tailored documents and company career forms filled for you.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-default bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-32 lg:py-36">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-accent-text">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-text-primary">
            One profile becomes a repeatable application workflow.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className="min-h-64 rounded-2xl border border-default bg-elevated p-8"
            >
              <p className="text-sm font-medium text-accent-text">
                {step.number}
              </p>
              <h3 className="mt-5 text-base font-medium text-text-primary">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
