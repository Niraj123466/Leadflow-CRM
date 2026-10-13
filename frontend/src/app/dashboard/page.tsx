import { Suspense } from "react";
import Dashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading dashboard…</div>}>
      <Dashboard />
    </Suspense>
  );
}