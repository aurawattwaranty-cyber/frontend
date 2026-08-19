import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";

/**
 * Closing band. Deliberately the only other dark surface besides the hero, so
 * the page opens and closes on the brand and stays light in between.
 */
export function HomeCta() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_0%,rgba(226,98,13,0.22),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent"
      />

      <div className="relative mx-auto w-full max-w-3xl px-4 py-18 text-center sm:px-6 sm:py-24">
        <h2 className="font-display text-[28px] leading-tight font-bold tracking-tight text-balance text-white sm:text-4xl">
          Your inverter is installed. Now make it covered.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-pretty text-white/65">
          Have your serial number and installation photos ready — registration
          takes about five minutes and you get your warranty ID immediately.
        </p>

        <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/register"
            className={buttonClasses(
              "primary",
              "lg",
              "sm:w-auto shadow-[0_14px_32px_-18px_rgba(226,98,13,0.9)]",
            )}
          >
            Register Warranty
            <ArrowRightIcon className="text-base" />
          </Link>
          <Link
            href="/status"
            className={buttonClasses(
              "dark",
              "lg",
              "border border-white/18 bg-white/8 backdrop-blur-sm hover:bg-white/14 sm:w-auto",
            )}
          >
            Check Status
            <SearchIcon className="text-base" />
          </Link>
        </div>
      </div>
    </section>
  );
}
