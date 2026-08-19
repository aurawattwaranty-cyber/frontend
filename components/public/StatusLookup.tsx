"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { WarrantyRegistration } from "@/lib/types";
import { getWarrantyStatus } from "@/lib/services/warranties";
import { toUserMessage } from "@/lib/services/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import { SearchIcon } from "@/components/icons";
import { useCustomerExperience } from "@/lib/hooks/useCustomerExperience";
import { WarrantyStatusResult } from "@/components/warranty/WarrantyStatusResult";

export function StatusLookup() {
  const experience = useCustomerExperience();
  const copy = experience?.status;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") ?? "";

  const [value, setValue] = useState(initialId);
  const [registration, setRegistration] = useState<WarrantyRegistration | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const lastLookup = useRef<string | null>(null);

  async function lookup(warrantyId: string) {
    const id = warrantyId.trim();
    if (!id) {
      setError("Enter your warranty ID to continue.");
      setRegistration(null);
      return;
    }

    lastLookup.current = id;
    setSearching(true);
    setError(null);

    try {
      setRegistration(await getWarrantyStatus(id));
    } catch (cause) {
      setRegistration(null);
      setError(toUserMessage(cause));
    } finally {
      setSearching(false);
    }
  }

  // Deep links from registration success and the admin screens land here.
  const runInitialLookup = useEffectEvent((id: string) => {
    setValue(id);
    void lookup(id);
  });

  useEffect(() => {
    if (!initialId || lastLookup.current === initialId) return;
    runInitialLookup(initialId);
  }, [initialId]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const id = value.trim();
    // Keep the URL shareable and in step with what is on screen.
    router.replace(id ? `/status?id=${encodeURIComponent(id)}` : "/status", {
      scroll: false,
    });
    void lookup(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-[38px]">
          {copy?.heading ?? "Check Warranty Status"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-pretty text-muted">
          {copy?.subheading ??
            "Enter your Warranty ID to check the current status of your registration, validity period and coverage details."}
        </p>
      </header>

      <Card>
        <CardBody className="p-3 sm:p-3">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 sm:flex-row"
            noValidate
          >
            <Input
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                if (error) setError(null);
              }}
              placeholder={copy?.searchPlaceholder || "Enter Warranty ID (e.g. 1024)"}
              aria-label="Warranty ID"
              leading={<SearchIcon />}
              containerClassName="flex-1"
              inputMode="numeric"
              autoComplete="off"
            />
            <Button
              type="submit"
              size="md"
              loading={searching}
              loadingText="Checking…"
              className="sm:h-10"
            >
              Check Status
            </Button>
          </form>
        </CardBody>
      </Card>

      {error ? (
        <Alert tone="danger" title="Warranty not found">
          {error}
        </Alert>
      ) : null}

      {searching && !registration ? (
        <div aria-hidden="true" className="flex flex-col gap-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : null}

      {registration && !searching ? (
        <WarrantyStatusResult
          registration={registration}
          onUpdated={() => void lookup(registration.id)}
        />
      ) : null}

      {!registration && !error && !searching ? (
        <p className="text-center text-[13px] text-pretty text-muted">
          {copy?.helpText ??
            "Your warranty ID was sent to you when the registration was submitted. It also appears on your warranty certificate."}
        </p>
      ) : null}
    </div>
  );
}
