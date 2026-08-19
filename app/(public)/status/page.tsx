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
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(226,98,13,0.09),transparent_70%)]"
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Suspense fallback={<LookupFallback />}>
          <StatusLookup />
        </Suspense>
      </div>
    </div>
  );
}

function LookupFallback() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}
