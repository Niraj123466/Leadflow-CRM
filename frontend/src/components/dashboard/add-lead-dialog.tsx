"use client";

import * as React from "react";
import { X, Loader2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadFormSchema, type LeadFormValues } from "@/schemas/lead";
import { useCreateLead } from "@/hooks/use-leads";
import { toast } from "sonner";

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const createLead = useCreateLead();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: { name: "", company: "", phone: "" },
    mode: "onBlur",
  });

  const [submitted, setSubmitted] = React.useState(false);

  const onSubmit = async (data: LeadFormValues) => {
    try {
      await createLead.mutateAsync(data);
      form.reset({ name: "", company: "", phone: "" });
      setSubmitted(false);
      onOpenChange(false);
    } catch {
      // Error toast shown by the mutation hook
      setSubmitted(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 p-1.5 text-primary">
              <UserPlus className="size-4" aria-hidden />
            </span>
            Add lead
          </DialogTitle>
          <DialogDescription>
            Create a new lead in your pipeline. Name is required; company and phone
            are optional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Priya Sharma"
              {...form.register("name")}
              autoFocus
              disabled={createLead.isPending}
              aria-invalid={form.formState.errors.name ? "true" : "false"}
            />
            {form.formState.errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="e.g., Northwind Analytics"
              {...form.register("company")}
              disabled={createLead.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 415 555 0132"
              {...form.register("phone")}
              disabled={createLead.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createLead.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending || submitted}>
              {createLead.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                  Adding…
                </>
              ) : (
                "Add lead"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}