"use client";

import { useMemo, useState } from "react";
import type {
  CustomerDetails,
  InstallerDetails,
  ProductModel,
  SerialNumber,
} from "@/lib/types";
import { getProductModels } from "@/lib/services/products";
import { normaliseSerial } from "@/lib/services/serials";
import { useAsync } from "@/lib/hooks/useAsync";
import { STATE_OPTIONS } from "@/lib/data/states";
import { formatCapacity } from "@/lib/utils/format";
import { toIsoDate } from "@/lib/warranty/dates";
import {
  hasErrors,
  required,
  validateEmail,
  validateInstallationDate,
  validateName,
  validatePhone,
  validatePincode,
  type Errors,
} from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { ArrowLeftIcon, ChevronRightIcon } from "@/components/icons";

export interface InstallationFormValue {
  installationDate: string;
  installationAddress: string;
  sameAsCustomerAddress: boolean;
  batteryInstalled: boolean;
  batteryModelId: string;
  batterySerial: string;
}

export interface DetailsFormValue {
  customer: CustomerDetails;
  installer: InstallerDetails;
  installation: InstallationFormValue;
}

export const EMPTY_DETAILS: DetailsFormValue = {
  customer: {
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  },
  installer: {
    companyName: "",
    contactName: "",
    contactNumber: "",
    email: "",
    installerId: "",
  },
  installation: {
    installationDate: "",
    installationAddress: "",
    sameAsCustomerAddress: true,
    batteryInstalled: false,
    batteryModelId: "",
    batterySerial: "",
  },
};

function composeCustomerAddress(customer: CustomerDetails): string {
  return [customer.address, customer.city, customer.state, customer.pincode]
    .filter((part) => part.trim())
    .join(", ");
}

export function DetailsStep({
  serial,
  value,
  onChange,
  onBack,
  onContinue,
}: {
  serial: SerialNumber;
  value: DetailsFormValue;
  onChange: (value: DetailsFormValue) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [customerErrors, setCustomerErrors] = useState<Errors<CustomerDetails>>({});
  const [installerErrors, setInstallerErrors] = useState<Errors<InstallerDetails>>({});
  const [installationErrors, setInstallationErrors] = useState<
    Errors<InstallationFormValue>
  >({});

  const batteryModels = useAsync<ProductModel[]>(
    () => getProductModels({ activeOnly: true, productType: "battery" }),
    [],
  );

  const batteryOptions = useMemo(
    () =>
      (batteryModels.data ?? []).map((model) => ({
        value: model.id,
        label: `${model.name} (${formatCapacity(model.capacityKw, "battery")})`,
      })),
    [batteryModels.data],
  );

  const today = toIsoDate(new Date());

  function setCustomer<K extends keyof CustomerDetails>(
    key: K,
    fieldValue: CustomerDetails[K],
  ) {
    onChange({ ...value, customer: { ...value.customer, [key]: fieldValue } });
    if (customerErrors[key]) {
      setCustomerErrors((errors) => ({ ...errors, [key]: undefined }));
    }
  }

  function setInstaller<K extends keyof InstallerDetails>(
    key: K,
    fieldValue: InstallerDetails[K],
  ) {
    onChange({ ...value, installer: { ...value.installer, [key]: fieldValue } });
    if (installerErrors[key]) {
      setInstallerErrors((errors) => ({ ...errors, [key]: undefined }));
    }
  }

  function setInstallation<K extends keyof InstallationFormValue>(
    key: K,
    fieldValue: InstallationFormValue[K],
  ) {
    onChange({
      ...value,
      installation: { ...value.installation, [key]: fieldValue },
    });
    if (installationErrors[key]) {
      setInstallationErrors((errors) => ({ ...errors, [key]: undefined }));
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const { customer, installer, installation } = value;

    const nextCustomerErrors: Errors<CustomerDetails> = {
      fullName: validateName(customer.fullName),
      phone: validatePhone(customer.phone),
      email: validateEmail(customer.email),
      address: required(customer.address, "Address"),
      city: required(customer.city, "City"),
      state: required(customer.state, "State"),
      pincode: validatePincode(customer.pincode),
    };

    const nextInstallerErrors: Errors<InstallerDetails> = {
      companyName: required(installer.companyName, "Installer name or company"),
      contactName: required(installer.contactName, "Contact person"),
      contactNumber: validatePhone(installer.contactNumber, "Contact number"),
      email: validateEmail(installer.email, "Installer email"),
    };

    const nextInstallationErrors: Errors<InstallationFormValue> = {
      installationDate: validateInstallationDate(installation.installationDate),
      installationAddress: installation.sameAsCustomerAddress
        ? undefined
        : required(installation.installationAddress, "Installation address"),
      batteryModelId: installation.batteryInstalled
        ? installation.batteryModelId
          ? undefined
          : "Select the battery model that was installed."
        : undefined,
      batterySerial: installation.batteryInstalled
        ? required(installation.batterySerial, "Battery serial number")
        : undefined,
    };

    setCustomerErrors(nextCustomerErrors);
    setInstallerErrors(nextInstallerErrors);
    setInstallationErrors(nextInstallationErrors);

    if (
      hasErrors(nextCustomerErrors) ||
      hasErrors(nextInstallerErrors) ||
      hasErrors(nextInstallationErrors)
    ) {
      document
        .querySelector('[aria-invalid="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onContinue();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Card>
        <CardHeader
          title="Customer Information"
          description="The warranty certificate is issued in this name."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Full Name"
            value={value.customer.fullName}
            onChange={(event) => setCustomer("fullName", event.target.value)}
            error={customerErrors.fullName}
            autoComplete="name"
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            inputMode="numeric"
            value={value.customer.phone}
            onChange={(event) => setCustomer("phone", event.target.value)}
            error={customerErrors.phone}
            placeholder="10 digit mobile number"
            autoComplete="tel"
            required
          />
          <Input
            label="Email"
            type="email"
            value={value.customer.email}
            onChange={(event) => setCustomer("email", event.target.value)}
            error={customerErrors.email}
            placeholder="name@example.com"
            autoComplete="email"
            containerClassName="sm:col-span-2"
            required
          />
          <Input
            label="Address"
            value={value.customer.address}
            onChange={(event) => setCustomer("address", event.target.value)}
            error={customerErrors.address}
            placeholder="House / flat number, street, area"
            autoComplete="street-address"
            containerClassName="sm:col-span-2"
            required
          />
          <Input
            label="City"
            value={value.customer.city}
            onChange={(event) => setCustomer("city", event.target.value)}
            error={customerErrors.city}
            autoComplete="address-level2"
            required
          />
          <Select
            label="State"
            value={value.customer.state}
            onChange={(event) => setCustomer("state", event.target.value)}
            error={customerErrors.state}
            options={STATE_OPTIONS}
            placeholder="Select state"
            required
          />
          <Input
            label="PIN Code"
            inputMode="numeric"
            maxLength={6}
            value={value.customer.pincode}
            onChange={(event) => setCustomer("pincode", event.target.value)}
            error={customerErrors.pincode}
            autoComplete="postal-code"
            required
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Installer Information"
          description="Details of the certified partner who installed the unit."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Installer Name / Company"
            value={value.installer.companyName}
            onChange={(event) => setInstaller("companyName", event.target.value)}
            error={installerErrors.companyName}
            containerClassName="sm:col-span-2"
            required
          />
          <Input
            label="Contact Person"
            value={value.installer.contactName}
            onChange={(event) => setInstaller("contactName", event.target.value)}
            error={installerErrors.contactName}
            required
          />
          <Input
            label="Contact Number"
            type="tel"
            inputMode="numeric"
            value={value.installer.contactNumber}
            onChange={(event) =>
              setInstaller("contactNumber", event.target.value)
            }
            error={installerErrors.contactNumber}
            required
          />
          <Input
            label="Email"
            type="email"
            value={value.installer.email}
            onChange={(event) => setInstaller("email", event.target.value)}
            error={installerErrors.email}
            required
          />
          <Input
            label="Installer ID / Registration Number"
            value={value.installer.installerId ?? ""}
            onChange={(event) => setInstaller("installerId", event.target.value)}
            hint="Optional — printed on the Aurawatt partner certificate."
            placeholder="AW-INST-0000"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Installation Details"
          description="Product details are taken from the serial you entered and the model you selected."
        />
        <CardBody className="flex flex-col gap-4">
          <div className="grid gap-4 rounded-lg border border-line bg-canvas-soft p-4 sm:grid-cols-3">
            <ReadOnlyField label="Product Type" value="Hybrid Inverter" />
            <ReadOnlyField label="Model" value={serial.modelName} />
            <ReadOnlyField
              label="Capacity"
              value={formatCapacity(serial.capacityKw, serial.productType)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Installation Date"
              type="date"
              max={today}
              min="2010-01-01"
              value={value.installation.installationDate}
              onChange={(event) =>
                setInstallation("installationDate", event.target.value)
              }
              error={installationErrors.installationDate}
              hint="Warranty coverage is calculated from this date."
              required
            />
          </div>

          <Checkbox
            label="Installation address is the same as the customer address"
            checked={value.installation.sameAsCustomerAddress}
            onChange={(event) =>
              setInstallation("sameAsCustomerAddress", event.target.checked)
            }
          />

          {value.installation.sameAsCustomerAddress ? (
            <p className="rounded-lg border border-line bg-canvas-soft px-3 py-2.5 text-[13px] text-muted">
              {composeCustomerAddress(value.customer) ||
                "Complete the customer address above and it will be used here."}
            </p>
          ) : (
            <Textarea
              label="Installation Address"
              rows={3}
              value={value.installation.installationAddress}
              onChange={(event) =>
                setInstallation("installationAddress", event.target.value)
              }
              error={installationErrors.installationAddress}
              placeholder="Full address of the site where the inverter is installed"
              required
            />
          )}

          <div className="border-t border-line pt-4">
            <Checkbox
              label="A battery system was installed with this inverter"
              hint="Battery packs are covered by their own warranty term."
              checked={value.installation.batteryInstalled}
              onChange={(event) =>
                setInstallation("batteryInstalled", event.target.checked)
              }
            />

            {value.installation.batteryInstalled ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Select
                  label="Battery Model"
                  value={value.installation.batteryModelId}
                  onChange={(event) =>
                    setInstallation("batteryModelId", event.target.value)
                  }
                  error={installationErrors.batteryModelId}
                  options={batteryOptions}
                  placeholder={
                    batteryModels.loading ? "Loading models…" : "Select battery model"
                  }
                  disabled={batteryModels.loading}
                  required
                />
                <Input
                  label="Battery Serial Number"
                  value={value.installation.batterySerial}
                  onChange={(event) =>
                    setInstallation(
                      "batterySerial",
                      normaliseSerial(event.target.value),
                    )
                  }
                  error={installationErrors.batterySerial}
                  placeholder="Enter battery serial number"
                  monospace
                  required
                />
              </div>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          variant="secondary"
          size="lg"
          onClick={onBack}
          icon={<ArrowLeftIcon className="text-base" />}
        >
          Back
        </Button>
        <Button
          type="submit"
          size="lg"
          iconAfter={<ChevronRightIcon className="text-base" />}
        >
          Continue to Photos
        </Button>
      </div>
    </form>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-medium text-ink">{value}</p>
    </div>
  );
}
