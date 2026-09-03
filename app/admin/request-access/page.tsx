import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { RequestAccessForm } from "@/components/admin/RequestAccessForm";

export const metadata: Metadata = {
  title: "Request Admin Access",
  robots: { index: false },
};

export default function RequestAccessPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Link href="/admin/login" aria-label="Back to admin login">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-5 font-display text-xl font-bold tracking-tight">
            Request Admin Access
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">
            An existing admin must authorize your account before you can sign in.
          </p>
        </div>
        <RequestAccessForm />
      </div>
    </div>
  );
}
