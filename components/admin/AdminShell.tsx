"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/lib/services/auth";
import { resetDemoData } from "@/lib/services/admin";
import { useSession } from "@/lib/hooks/useSession";
import { initialsOf } from "@/lib/utils/format";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { LogOutIcon, MenuIcon, RefreshIcon, XIcon } from "@/components/icons";
import { AdminSidebar } from "./AdminSidebar";

/**
 * Admin application shell.
 *
 * Route protection is enforced here so every admin screen inherits it. The
 * session check is the single place to swap for a server-side guard (proxy or
 * layout-level cookie read) once the auth API exists.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const user = useSession();
  const [drawer, setDrawer] = useState({ open: false, path: pathname });
  const [resetOpen, setResetOpen] = useState(false);

  // Navigation is a side effect, not state — the redirect is the only thing
  // this effect does.
  useEffect(() => {
    if (user === null) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [user, router, pathname]);

  // Closes the drawer on navigation without syncing state in an effect.
  const drawerOpen = drawer.open && drawer.path === pathname;
  const setDrawerOpen = (open: boolean) => setDrawer({ open, path: pathname });

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas">
        <span className="sr-only" role="status">
          Checking your session
        </span>
        <Logo size="lg" className="opacity-40" />
      </div>
    );
  }

  const accountSlot = (
    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-semibold text-brand-600">
        {initialsOf(user.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">
          {user.name}
        </span>
        <span className="block truncate text-[11px] text-muted">
          {user.email}
        </span>
      </span>
      <button
        type="button"
        onClick={() => {
          void logout().finally(() => {
            toast.info("Signed out", "You have been signed out of the admin.");
            router.replace("/admin/login");
          });
        }}
        aria-label="Sign out"
        className="rounded-lg p-1.5 text-base text-muted transition-colors hover:bg-canvas hover:text-ink"
      >
        <LogOutIcon />
      </button>
    </div>
  );

  return (
    <div className="flex flex-1 bg-canvas">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <AdminSidebar accountSlot={accountSlot} />
        </div>
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-navy-950/45"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-fade-in absolute inset-y-0 left-0 w-64 shadow-overlay">
            <AdminSidebar
              onNavigate={() => setDrawerOpen(false)}
              accountSlot={accountSlot}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={drawerOpen}
            className="-ml-2 rounded-lg p-2 text-xl text-ink-soft transition-colors hover:bg-canvas"
          >
            {drawerOpen ? <XIcon /> : <MenuIcon />}
          </button>
          <Logo size="sm" />
          <span className="w-9" aria-hidden="true" />
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>

          <div className="mx-auto mt-10 flex w-full max-w-5xl justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResetOpen(true)}
              icon={<RefreshIcon />}
              className="text-faint"
            >
              Reset demo data
            </Button>
          </div>
        </main>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          void resetDemoData()
            .then(() => {
              setResetOpen(false);
              toast.success(
                "Demo data restored",
                "Registrations, serials and photo requirements are back to their starting state.",
              );
            })
            .catch(() => {
              toast.error(
                "Reset failed",
                "The backend could not restore the demo data right now.",
              );
            });
        }}
        title="Reset demo data?"
        description="Every registration, serial number and photo requirement returns to the seeded state."
        confirmLabel="Reset data"
        tone="danger"
      >
        <p className="text-[13px] leading-relaxed text-muted">
          This affects the preview dataset stored in this browser only. Anything
          you submitted or approved during this session will be discarded.
        </p>
      </ConfirmDialog>
    </div>
  );
}
