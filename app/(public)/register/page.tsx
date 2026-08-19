import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterWizard } from "@/components/public/register/RegisterWizard";
import { Skeleton } from "@/components/ui/Feedback";

export const metadata: Metadata = {
  title: "Register Warranty",
  description:
    "Register your Aurawatt hybrid inverter in three steps to activate its warranty.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<WizardFallback />}>
        <RegisterWizard />
      </Suspense>
    </div>
  );
}

function WizardFallback() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mx-auto h-8 w-56" />
      <Skeleton className="mx-auto mt-3 h-4 w-80" />
      <Skeleton className="mt-8 h-10 w-full" />
      <Skeleton className="mt-6 h-56 w-full rounded-xl" />
    </div>
  );
}
