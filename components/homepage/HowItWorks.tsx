const steps = [
  {
    number: "01",
    title: "Set up your profile",
    body: "Tell JobPilot what you're looking for — your skills, experience level, and job preferences.",
  },
  {
    number: "02",
    title: "Find jobs",
    body: "Enter a job title and location. The agent browses LinkedIn and scores every listing against your profile.",
  },
  {
    number: "03",
    title: "AI applies",
    body: "Matched jobs are applied to automatically. Below-threshold jobs go to your review queue.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-14 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-primary text-center mb-7">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-elevated rounded-2xl border border-border-subtle p-6"
            >
              <p className="text-accent-primary font-mono text-sm font-bold mb-3">
                {step.number}
              </p>
              <h3 className="text-base font-semibold text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
