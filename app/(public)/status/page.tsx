import { Suspense } from "react";
import type { Metadata } from "next";
import { StatusLookup } from "@/components/public/StatusLookup";
import { Skeleton } from "@/components/ui/Feedback";

export const metadata: Metadata = {
  title: "Check Warranty Status",
  description:
    "Enter your Aurawatt warranty ID to check registration status, validity period and coverage details.",
};

export default function StatusPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[32px]">
          Check Warranty Status
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-muted">
          Enter your Warranty ID to check the current status of your
          registration, validity period and coverage details.
        </p>
      </header>

      <Suspense
        fallback={<Skeleton className="mx-auto mt-8 h-20 w-full rounded-xl" />}
      >
        <StatusLookup />
      </Suspense>
    </div>
  );
}
