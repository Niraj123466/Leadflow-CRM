"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import { makeQueryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures a single client instance survives re-renders.
  const [queryClient] = React.useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast:
              "border border-border bg-popover text-popover-foreground shadow-lg",
          },
        }}
      />
    </QueryClientProvider>
  );
}
