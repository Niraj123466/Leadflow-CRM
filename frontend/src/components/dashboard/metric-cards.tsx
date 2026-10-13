import { CalendarClock, CircleDollarSign, Target, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/lead";

interface MetricConfig {
  key: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  hint: string;
}

/** Summary metrics derived from the currently loaded lead set. */
export function MetricCards({ leads }: { leads: Lead[] }) {
  const todayCount = leads.filter((lead) => lead.is_today).length;
  const qualifiedCount = leads.filter((lead) => lead.status === "qualified").length;
  const wonCount = leads.filter((lead) => lead.status === "won").length;

  const metrics: MetricConfig[] = [
    {
      key: "total",
      label: "Total leads",
      value: leads.length,
      icon: Users,
      accent: "text-primary bg-primary/10",
      hint: "in your pipeline",
    },
    {
      key: "today",
      label: "Today's follow-ups",
      value: todayCount,
      icon: CalendarClock,
      accent: "text-warning bg-warning/10",
      hint: "due today",
    },
    {
      key: "qualified",
      label: "Qualified",
      value: qualifiedCount,
      icon: Target,
      accent: "text-violet-300 bg-violet-400/10",
      hint: "ready to advance",
    },
    {
      key: "won",
      label: "Won",
      value: wonCount,
      icon: CircleDollarSign,
      accent: "text-success bg-success/10",
      hint: "closed-won",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Card key={metric.key} className="p-4" data-testid={`metric-${metric.key}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {metric.label}
              </p>
              <span className={cn("rounded-md p-1.5", metric.accent)}>
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
          </Card>
        );
      })}
    </div>
  );
}
