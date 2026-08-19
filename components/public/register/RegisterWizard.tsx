"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  ProductModel,
  RegistrationDraft,
  SerialNumber,
  WarrantyPhoto,
  WarrantyRegistration,
} from "@/lib/types";
import { createWarrantyRegistration } from "@/lib/services/warranties";
import { getProductModels } from "@/lib/services/products";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { useToast } from "@/components/ui/Toast";
import { useCustomerExperience } from "@/lib/hooks/useCustomerExperience";
import { RegistrationStepper } from "@/components/public/RegistrationStepper";
import { SerialStep, VerifiedSerialSummary } from "./SerialStep";
import { DetailsStep, EMPTY_DETAILS, type DetailsFormValue } from "./DetailsStep";
import { PhotosStep } from "./PhotosStep";
import { ReviewStep } from "./ReviewStep";
import { SuccessScreen } from "./SuccessScreen";

type Phase = "verify" | "details" | "photos" | "review" | "success";

const STEP_INDEX: Record<Phase, number> = {
  verify: 0,
  details: 1,
  photos: 2,
  review: 3,
  success: 3,
};

export function RegisterWizard() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const experience = useCustomerExperience();

  const [phase, setPhase] = useState<Phase>("verify");
  const [serial, setSerial] = useState<SerialNumber | null>(null);
  const [details, setDetails] = useState<DetailsFormValue>(EMPTY_DETAILS);
  const [photos, setPhotos] = useState<Record<string, WarrantyPhoto>>({});
  const [submitted, setSubmitted] = useState<WarrantyRegistration | null>(null);

  const models = useAsync<ProductModel[]>(() => getProductModels(), []);
  const submit = useMutation(createWarrantyRegistration);

  const installationAddress = useMemo(() => {
    const { customer, installation } = details;
    if (!installation.sameAsCustomerAddress) {
      return installation.installationAddress;
    }
    return [customer.address, customer.city, customer.state, customer.pincode]
      .filter((part) => part.trim())
      .join(", ");
  }, [details]);

  const batteryModel = useMemo(
    () =>
      (models.data ?? []).find(
        (model) => model.id === details.installation.batteryModelId,
      ),
    [models.data, details.installation.batteryModelId],
  );

  const photoList = useMemo(() => Object.values(photos), [photos]);

  async function handleSubmit() {
    if (!serial) return;

    const draft: RegistrationDraft = {
      serial: serial.serial,
      modelId: serial.modelId,
      modelName: serial.modelName,
      capacityKw: serial.capacityKw,
      productType: serial.productType,
      customer: details.customer,
      installer: {
        ...details.installer,
        installerId: details.installer.installerId?.trim() || undefined,
      },
      installation: {
        installationDate: details.installation.installationDate,
        installationAddress,
        productType: serial.productType,
        modelId: serial.modelId,
        modelName: serial.modelName,
        capacityKw: serial.capacityKw,
        batteryInstalled: details.installation.batteryInstalled,
        batteryModel: details.installation.batteryInstalled
          ? batteryModel?.name
          : undefined,
        batterySerial: details.installation.batteryInstalled
          ? details.installation.batterySerial
          : undefined,
      },
      photos: photoList,
    };

    const created = await submit.run(draft);
    if (created) {
      setSubmitted(created);
      setPhase("success");
      toast.success(
        "Registration submitted",
        `Your registration ID is #${created.id}.`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function goTo(next: Phase) {
    setPhase(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (phase === "success" && submitted) {
    return <SuccessScreen registration={submitted} />;
  }

  return (
    <div className="animate-fade-up">
      <header className="text-center">
        <h1 className="font-display text-[28px] font-bold tracking-tight text-balance sm:text-4xl">
          {experience?.register.heading ?? "Register Warranty"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[14px] text-pretty text-muted">
          {experience?.register.subheading ??
            "Complete the 3-step process to activate your hybrid inverter warranty."}
        </p>
      </header>

      <RegistrationStepper
        current={STEP_INDEX[phase]}
        className="mx-auto mt-7 max-w-md"
      />

      <div className="mt-7 flex flex-col gap-4">
        {serial && phase !== "verify" ? (
          <VerifiedSerialSummary
            serial={serial}
            onChange={() => goTo("verify")}
          />
        ) : null}

        {phase === "verify" ? (
          <SerialStep
            initialSerial={serial?.serial ?? searchParams.get("serial") ?? ""}
            onVerified={(verified) => {
              setSerial(verified);
              goTo("details");
            }}
          />
        ) : null}

        {phase === "details" && serial ? (
          <DetailsStep
            serial={serial}
            value={details}
            onChange={setDetails}
            onBack={() => goTo("verify")}
            onContinue={() => goTo("photos")}
          />
        ) : null}

        {phase === "photos" && serial ? (
          <PhotosStep
            photos={photos}
            onPhotosChange={setPhotos}
            onBack={() => goTo("details")}
            onContinue={() => goTo("review")}
          />
        ) : null}

        {phase === "review" && serial ? (
          <ReviewStep
            serial={serial}
            details={details}
            photos={photoList}
            installationAddress={installationAddress}
            batteryModelName={batteryModel?.name}
            onEditSerial={() => goTo("verify")}
            onEditDetails={() => goTo("details")}
            onEditPhotos={() => goTo("photos")}
            onSubmit={() => void handleSubmit()}
            submitting={submit.pending}
            error={submit.error}
          />
        ) : null}
      </div>
    </div>
  );
}
