"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { MenuIcon, XIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/status", label: "Check Status" },
  { href: "/admin", label: "Admin" },
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  // Storing the route alongside the flag closes the menu on navigation without
  // a state-syncing effect.
  const [menu, setMenu] = useState({ open: false, path: pathname });
  const menuOpen = menu.open && menu.path === pathname;
  const setMenuOpen = (open: boolean) => setMenu({ open, path: pathname });

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-md"
          aria-label="Aurawatt Warranty home"
        >
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                isActive(link.href)
                  ? "text-brand-600"
                  : "text-ink-soft hover:bg-canvas hover:text-ink",
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/register"
            className={buttonClasses("primary", "sm", "ml-2")}
          >
            Register Warranty
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="public-mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="-mr-2 rounded-lg p-2 text-xl text-ink-soft transition-colors hover:bg-canvas sm:hidden"
        >
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {menuOpen ? (
        <nav
          id="public-mobile-nav"
          aria-label="Main"
          className="animate-fade-in border-t border-line bg-surface px-4 py-3 sm:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-brand-50 text-brand-600"
                      : "text-ink-soft hover:bg-canvas",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-1">
              <Link
                href="/register"
                className={buttonClasses("primary", "md", "w-full")}
              >
                Register Warranty
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
