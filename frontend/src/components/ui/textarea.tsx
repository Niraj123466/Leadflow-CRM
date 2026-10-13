import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm shadow-sm transition-colors",
        "placeholder:text-muted-foreground/70",
        "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
