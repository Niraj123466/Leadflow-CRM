import { AlertCircle, SearchX, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LeadListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border/70" aria-hidden data-testid="lead-list-loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="hidden h-4 w-56 lg:block" />
          <Skeleton className="hidden h-4 w-28 lg:block" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="rounded-full bg-muted p-3 text-muted-foreground">
        <SearchX className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function NoLeadsYet({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="rounded-full bg-primary/10 p-3 text-primary">
        <UserPlus className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium">No leads yet</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Add your first lead to start tracking discussions and follow-ups.
        </p>
      </div>
      <Button onClick={onAdd}>Add lead</Button>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <span className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertCircle className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium">Could not load leads</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
