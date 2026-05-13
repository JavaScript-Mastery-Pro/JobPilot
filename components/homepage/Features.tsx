import { Sparkles, Bot, Activity, FileText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "AI Job Matching",
    body: "Every listing is scored 0–100 against your profile so only the best matches get your application.",
  },
  {
    icon: Bot,
    title: "Auto Apply",
    body: "The agent opens company career pages, fills every form field, and submits — no clicking required.",
  },
  {
    icon: Activity,
    title: "Live Dashboard",
    body: "Watch a real-time feed of every action the agent takes, with a live browser session recording.",
  },
  {
    icon: FileText,
    title: "Resume Generation",
    body: "GPT-4o formats your profile into an ATS-ready resume PDF. Tailor it per job in one click.",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6 bg-surface">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-primary text-center mb-12">
          Built for serious job seekers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-elevated rounded-2xl border border-border-default p-6">
              <feature.icon
                className="h-8 w-8 text-accent-primary mb-3"
                strokeWidth={1.5}
              />
              <h3 className="text-base font-semibold text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
