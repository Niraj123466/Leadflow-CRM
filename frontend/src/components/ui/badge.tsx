import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-muted-foreground",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
        slate: "border-slate-500/25 bg-slate-400/10 text-slate-300",
        cyan: "border-cyan-500/25 bg-cyan-400/10 text-cyan-300",
        violet: "border-violet-500/25 bg-violet-400/10 text-violet-300",
        amber: "border-amber-500/25 bg-amber-400/10 text-amber-300",
        emerald: "border-emerald-500/25 bg-emerald-400/10 text-emerald-300",
        rose: "border-rose-500/25 bg-rose-400/10 text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
