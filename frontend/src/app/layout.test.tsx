import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";

import RootLayout from "./layout";

// next/font is compiled by Next's build pipeline, not available under Vitest.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

/** Throws unless a QueryClientProvider is mounted above it. */
function QueryProbe() {
  const query = useQuery({ queryKey: ["layout-probe"], queryFn: async () => "ok" });
  return <div data-testid="layout-probe">{query.data ?? "pending"}</div>;
}

describe("RootLayout", () => {
  it("wraps children in QueryClientProvider", () => {
    render(
      <RootLayout>
        <QueryProbe />
      </RootLayout>,
    );
    expect(screen.getByTestId("layout-probe")).toBeTruthy();
  });
});
