import Link from "next/link";
import { Logo } from "@/components/Logo";

const FOOTER_LINKS = [
  { href: "/register", label: "Register Warranty" },
  { href: "/status", label: "Check Status" },
  { href: "/admin", label: "Admin" },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:px-6">
        <Logo size="sm" />
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded text-[13px] text-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-faint">
          © {new Date().getFullYear()} Aurawatt Energy Systems. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
