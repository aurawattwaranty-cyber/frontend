import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/admin/LoginForm";
import { Skeleton } from "@/components/ui/Feedback";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Aurawatt Warranty home">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-5 font-display text-xl font-bold tracking-tight">
            Admin Login
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Sign in to manage warranty registrations and inventory.
          </p>
        </div>

        <Suspense fallback={<Skeleton className="mt-6 h-72 w-full rounded-xl" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
