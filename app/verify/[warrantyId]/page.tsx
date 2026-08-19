import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { VerificationCard } from "@/components/warranty/VerificationCard";

export async function generateMetadata({
  params,
}: PageProps<"/verify/[warrantyId]">): Promise<Metadata> {
  const { warrantyId } = await params;
  return {
    title: `Verify warranty ${warrantyId}`,
    description: `Public verification for Aurawatt warranty ${warrantyId}.`,
    robots: { index: false },
  };
}

export default async function VerifyPage({
  params,
}: PageProps<"/verify/[warrantyId]">) {
  const { warrantyId } = await params;

  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-center px-4">
          <Link href="/" aria-label="Aurawatt Warranty home">
            <Logo size="md" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 sm:py-12">
        <VerificationCard warrantyId={warrantyId} />
      </main>

      <footer className="px-4 pb-8 text-center">
        <p className="text-[12px] text-faint">
          Scanned from an Aurawatt warranty certificate or product label.
        </p>
      </footer>
    </div>
  );
}
