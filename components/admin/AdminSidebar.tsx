"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/Logo";
import {
  BarcodeIcon,
  CameraIcon,
  ChevronLeftIcon,
  DashboardIcon,
  FileTextIcon,
} from "@/components/icons";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Exact match only — otherwise `/admin` would match every child route. */
  exact?: boolean;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <DashboardIcon />, exact: true },
  { href: "/admin/warranties", label: "Warranties", icon: <FileTextIcon /> },
  { href: "/admin/serials", label: "Serial Numbers", icon: <BarcodeIcon /> },
  {
    href: "/admin/photo-requirements",
    label: "Photo Requirements",
    icon: <CameraIcon />,
  },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminSidebar({
  onNavigate,
  accountSlot,
}: {
  onNavigate?: () => void;
  /** Signed-in account block, rendered above the public-site link. */
  accountSlot?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
        <Link href="/admin" onClick={onNavigate} aria-label="Admin dashboard">
          <Logo size="md" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin">
        <ul className="flex flex-col gap-1">
          {ADMIN_NAV.map((item) => {
            const active = isNavItemActive(pathname, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-brand-500 text-white"
                      : "text-ink-soft hover:bg-canvas hover:text-ink",
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {accountSlot ? (
        <div className="shrink-0 border-t border-line p-3">{accountSlot}</div>
      ) : null}

      <div className="shrink-0 border-t border-line p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] text-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <ChevronLeftIcon className="text-sm" />
          Back to Public Site
        </Link>
      </div>
    </div>
  );
}
