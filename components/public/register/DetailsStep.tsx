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
  type FieldError,
} from "@/lib/validation";
import {
  buildFieldLookup,
  fieldProps,
  sectionCopy,
} from "@/lib/services/customer-experience";
import { useCustomerExperience } from "@/lib/hooks/useCustomerExperience";
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
  const experience = useCustomerExperience();
  const lookup = useMemo(() => buildFieldLookup(experience), [experience]);

  /** Resolved label/placeholder/hint/required/visible for one configured field. */
  const field = (
    id: string,
    fallback: { label: string; placeholder?: string; hint?: string },
  ) => fieldProps(lookup, id, fallback);

  const customerSection = sectionCopy(experience, "customer", {
    title: "Customer Information",
    description: "The warranty certificate is issued in this name.",
  });
  const installerSection = sectionCopy(experience, "installer", {
    title: "Installer Information",
    description: "Details of the certified partner who installed the unit.",
  });
  const installationSection = sectionCopy(experience, "installation", {
    title: "Installation Details",
    description:
      "Product details are taken from the serial you entered and the model you selected.",
  });

  const fullName = field("customer.fullName", { label: "Full Name" });
  const phone = field("customer.phone", {
    label: "Phone Number",
    placeholder: "10 digit mobile number",
  });
  const email = field("customer.email", {
    label: "Email",
    placeholder: "name@example.com",
  });
  const address = field("customer.address", {
    label: "Address",
    placeholder: "House / flat number, street, area",
  });
  const city = field("customer.city", { label: "City" });
  const state = field("customer.state", {
    label: "State",
    placeholder: "Select state",
  });
  const pincode = field("customer.pincode", { label: "PIN Code" });

  const companyName = field("installer.companyName", {
    label: "Installer Name / Company",
  });
  const contactName = field("installer.contactName", {
    label: "Contact Person",
  });
  const contactNumber = field("installer.contactNumber", {
    label: "Contact Number",
  });
  const installerEmail = field("installer.email", { label: "Email" });
  const installerId = field("installer.installerId", {
    label: "Installer ID / Registration Number",
    placeholder: "AW-INST-0000",
    hint: "Optional — printed on the Aurawatt partner certificate.",
  });

  const installationDate = field("installation.installationDate", {
    label: "Installation Date",
    hint: "Warranty coverage is calculated from this date.",
  });
  const installationAddress = field("installation.installationAddress", {
    label: "Installation Address",
    placeholder: "Full address of the site where the inverter is installed",
  });
  const batteryInstalled = field("installation.batteryInstalled", {
    label: "A battery system was installed with this inverter",
    hint: "Battery packs are covered by their own warranty term.",
  });
  const batteryModel = field("installation.batteryModelId", {
    label: "Battery Model",
    placeholder: "Select battery model",
  });
  const batterySerialField = field("installation.batterySerial", {
    label: "Battery Serial Number",
    placeholder: "Enter battery serial number",
  });

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

    /**
     * A field the super admin hid never blocks submission, and one they made
     * optional is only checked once the customer has actually typed something.
     */
    const check = (
      id: string,
      value: string,
      validate: () => FieldError,
    ): FieldError => {
      const config = lookup(id);
      if (config && !config.visible && !config.locked) return undefined;
      if (config && !config.required && !value.trim()) return undefined;
      return validate();
    };

    const nextCustomerErrors: Errors<CustomerDetails> = {
      fullName: check("customer.fullName", customer.fullName, () =>
        validateName(customer.fullName),
      ),
      phone: check("customer.phone", customer.phone, () =>
        validatePhone(customer.phone),
      ),
      email: check("customer.email", customer.email, () =>
        validateEmail(customer.email),
      ),
      address: check("customer.address", customer.address, () =>
        required(customer.address, "Address"),
      ),
      city: check("customer.city", customer.city, () =>
        required(customer.city, "City"),
      ),
      state: check("customer.state", customer.state, () =>
        required(customer.state, "State"),
      ),
      pincode: check("customer.pincode", customer.pincode, () =>
        validatePincode(customer.pincode),
      ),
    };

    const nextInstallerErrors: Errors<InstallerDetails> = {
      companyName: check("installer.companyName", installer.companyName, () =>
        required(installer.companyName, "Installer name or company"),
      ),
      contactName: check("installer.contactName", installer.contactName, () =>
        required(installer.contactName, "Contact person"),
      ),
      contactNumber: check(
        "installer.contactNumber",
        installer.contactNumber,
        () => validatePhone(installer.contactNumber, "Contact number"),
      ),
      email: check("installer.email", installer.email, () =>
        validateEmail(installer.email, "Installer email"),
      ),
    };

    const nextInstallationErrors: Errors<InstallationFormValue> = {
      installationDate: check(
        "installation.installationDate",
        installation.installationDate,
        () => validateInstallationDate(installation.installationDate),
      ),
      installationAddress: installation.sameAsCustomerAddress
        ? undefined
        : check(
            "installation.installationAddress",
            installation.installationAddress,
            () =>
              required(installation.installationAddress, "Installation address"),
          ),
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
          title={customerSection.title}
          description={customerSection.description}
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {fullName.visible ? (
            <Input
              {...fullName.props}
              value={value.customer.fullName}
              onChange={(event) => setCustomer("fullName", event.target.value)}
              error={customerErrors.fullName}
              autoComplete="name"
            />
          ) : null}
          {phone.visible ? (
            <Input
              {...phone.props}
              type="tel"
              inputMode="numeric"
              value={value.customer.phone}
              onChange={(event) => setCustomer("phone", event.target.value)}
              error={customerErrors.phone}
              autoComplete="tel"
            />
          ) : null}
          {email.visible ? (
            <Input
              {...email.props}
              type="email"
              value={value.customer.email}
              onChange={(event) => setCustomer("email", event.target.value)}
              error={customerErrors.email}
              autoComplete="email"
              containerClassName="sm:col-span-2"
            />
          ) : null}
          {address.visible ? (
            <Input
              {...address.props}
              value={value.customer.address}
              onChange={(event) => setCustomer("address", event.target.value)}
              error={customerErrors.address}
              autoComplete="street-address"
              containerClassName="sm:col-span-2"
            />
          ) : null}
          {city.visible ? (
            <Input
              {...city.props}
              value={value.customer.city}
              onChange={(event) => setCustomer("city", event.target.value)}
              error={customerErrors.city}
              autoComplete="address-level2"
            />
          ) : null}
          {state.visible ? (
            <Select
              {...state.props}
              value={value.customer.state}
              onChange={(event) => setCustomer("state", event.target.value)}
              error={customerErrors.state}
              options={STATE_OPTIONS}
              placeholder={state.props.placeholder ?? "Select state"}
            />
          ) : null}
          {pincode.visible ? (
            <Input
              {...pincode.props}
              inputMode="numeric"
              maxLength={6}
              value={value.customer.pincode}
              onChange={(event) => setCustomer("pincode", event.target.value)}
              error={customerErrors.pincode}
              autoComplete="postal-code"
            />
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={installerSection.title}
          description={installerSection.description}
        />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          {companyName.visible ? (
            <Input
              {...companyName.props}
              value={value.installer.companyName}
              onChange={(event) =>
                setInstaller("companyName", event.target.value)
              }
              error={installerErrors.companyName}
              containerClassName="sm:col-span-2"
            />
          ) : null}
          {contactName.visible ? (
            <Input
              {...contactName.props}
              value={value.installer.contactName}
              onChange={(event) =>
                setInstaller("contactName", event.target.value)
              }
              error={installerErrors.contactName}
            />
          ) : null}
          {contactNumber.visible ? (
            <Input
              {...contactNumber.props}
              type="tel"
              inputMode="numeric"
              value={value.installer.contactNumber}
              onChange={(event) =>
                setInstaller("contactNumber", event.target.value)
              }
              error={installerErrors.contactNumber}
            />
          ) : null}
          {installerEmail.visible ? (
            <Input
              {...installerEmail.props}
              type="email"
              value={value.installer.email}
              onChange={(event) => setInstaller("email", event.target.value)}
              error={installerErrors.email}
            />
          ) : null}
          {installerId.visible ? (
            <Input
              {...installerId.props}
              value={value.installer.installerId ?? ""}
              onChange={(event) =>
                setInstaller("installerId", event.target.value)
              }
            />
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={installationSection.title}
          description={installationSection.description}
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
              {...installationDate.props}
              type="date"
              max={today}
              min="2010-01-01"
              value={value.installation.installationDate}
              onChange={(event) =>
                setInstallation("installationDate", event.target.value)
              }
              error={installationErrors.installationDate}
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
              {...installationAddress.props}
              rows={3}
              value={value.installation.installationAddress}
              onChange={(event) =>
                setInstallation("installationAddress", event.target.value)
              }
              error={installationErrors.installationAddress}
            />
          )}

          <div
            className={
              batteryInstalled.visible ? "border-t border-line pt-4" : "hidden"
            }
          >
            <Checkbox
              label={batteryInstalled.props.label}
              hint={batteryInstalled.props.hint}
              checked={value.installation.batteryInstalled}
              onChange={(event) =>
                setInstallation("batteryInstalled", event.target.checked)
              }
            />

            {value.installation.batteryInstalled ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Select
                  {...batteryModel.props}
                  value={value.installation.batteryModelId}
                  onChange={(event) =>
                    setInstallation("batteryModelId", event.target.value)
                  }
                  error={installationErrors.batteryModelId}
                  options={batteryOptions}
                  placeholder={
                    batteryModels.loading
                      ? "Loading models…"
                      : (batteryModel.props.placeholder ?? "Select battery model")
                  }
                  disabled={batteryModels.loading}
                />
                <Input
                  {...batterySerialField.props}
                  value={value.installation.batterySerial}
                  onChange={(event) =>
                    setInstallation(
                      "batterySerial",
                      normaliseSerial(event.target.value),
                    )
                  }
                  error={installationErrors.batterySerial}
                  monospace
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
