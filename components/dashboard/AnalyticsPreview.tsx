import { BarChart3, LineChart, PieChart } from "lucide-react";

const previewItems = [
  {
    label: "Funnel",
    caption: "Found to matched to applied",
    icon: BarChart3,
  },
  {
    label: "Applications",
    caption: "Submissions over time",
    icon: LineChart,
  },
  {
    label: "Match scores",
    caption: "Distribution by score band",
    icon: PieChart,
  },
];

export function AnalyticsPreview() {
  return (
    <section className="rounded-2xl border border-default bg-surface">
      <div className="border-b border-default px-5 py-4">
        <p className="text-sm text-accent-text">Analytics</p>
        <h2 className="mt-1 text-xl font-semibold text-text-primary">
          Performance trends
        </h2>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-3">
        {previewItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl border border-default bg-elevated p-4"
            >
              <span className="inline-flex rounded-xl border border-accent-border bg-accent-dim p-2 text-accent-text">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-medium text-text-primary">
                {item.label}
              </h3>
              <p className="mt-1 text-sm text-text-muted">{item.caption}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
