import type {
  PhotoRequirement,
  ProductModel,
  SerialNumber,
  WarrantyEvent,
  WarrantyPhoto,
  WarrantyRegistration,
} from "@/lib/types";
import { addMonths, toIsoDate } from "@/lib/warranty/dates";

/** Shape persisted by the demo store. */
export interface Database {
  version: number;
  models: ProductModel[];
  serials: SerialNumber[];
  registrations: WarrantyRegistration[];
  photoRequirements: PhotoRequirement[];
  /** Next public warranty ID to hand out. */
  nextWarrantyId: number;
}

export const DB_VERSION = 1;

const now = () => new Date();

function daysAgo(days: number): string {
  const d = now();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function dateDaysAgo(days: number): string {
  return toIsoDate(daysAgo(days));
}

function dateYearsAgo(years: number): string {
  const d = now();
  d.setFullYear(d.getFullYear() - years);
  return toIsoDate(d.toISOString());
}

/**
 * Stand-in evidence image so the admin photo viewer is demonstrable before the
 * upload API exists. Real uploads replace these with stored file URLs.
 */
function evidencePlaceholder(label: string, tone: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
<rect width="640" height="480" fill="${tone}"/>
<rect x="24" y="24" width="592" height="432" rx="10" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" stroke-dasharray="10 8"/>
<circle cx="320" cy="196" r="52" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="6"/>
<circle cx="320" cy="196" r="20" fill="rgba(255,255,255,.55)"/>
<rect x="238" y="122" width="164" height="26" rx="8" fill="rgba(255,255,255,.28)"/>
<text x="320" y="304" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="600" fill="#ffffff" text-anchor="middle">${label}</text>
<text x="320" y="340" font-family="Inter, Arial, sans-serif" font-size="18" fill="rgba(255,255,255,.72)" text-anchor="middle">Installation evidence</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const EVIDENCE_TONES = [
  "#1f3a5f",
  "#284b63",
  "#3c5a72",
  "#2f4858",
  "#4a5a6a",
  "#33465c",
];

function seedPhotos(
  requirements: PhotoRequirement[],
  count: number,
  submittedAt: string,
): WarrantyPhoto[] {
  return requirements.slice(0, count).map((requirement, index) => ({
    requirementId: requirement.id,
    requirementLabel: requirement.label,
    fileName: `${requirement.id.replace(/^pr-/, "")}.jpg`,
    url: evidencePlaceholder(
      requirement.label,
      EVIDENCE_TONES[index % EVIDENCE_TONES.length],
    ),
    sizeBytes: 480_000 + index * 37_000,
    uploadedAt: submittedAt,
  }));
}

export const SEED_PHOTO_REQUIREMENTS: PhotoRequirement[] = [
  {
    id: "pr-inverter-front",
    label: "Inverter Front View",
    instructions:
      "Take a clear photo of the front face of the inverter showing the model label and LED indicators. Ensure the entire unit is visible.",
    required: true,
    order: 1,
  },
  {
    id: "pr-serial-label",
    label: "Inverter Serial Number Label",
    instructions:
      "Capture a close-up photo of the serial number sticker/label on the side of the inverter. The serial number must be clearly readable.",
    required: true,
    order: 2,
  },
  {
    id: "pr-battery-connection",
    label: "Battery Connection",
    instructions:
      "Photograph the battery terminals and connections. Ensure all cables are visible and properly connected.",
    required: true,
    order: 3,
  },
  {
    id: "pr-solar-connection",
    label: "Solar Panel Connection",
    instructions:
      "Take a photo showing the solar panel DC input connections at the inverter. All DC cables should be visible.",
    required: true,
    order: 4,
  },
  {
    id: "pr-ac-grid",
    label: "AC Grid Connection",
    instructions:
      "Photograph the AC grid connection point. Show the circuit breaker or distribution board connection.",
    required: true,
    order: 5,
  },
  {
    id: "pr-site-overview",
    label: "Installation Site Overview",
    instructions:
      "Take a wide-angle photo of the complete installation site showing the inverter, batteries and surrounding area.",
    required: true,
    order: 6,
  },
  {
    id: "pr-earthing",
    label: "Earthing / Grounding",
    instructions:
      "Photograph the earthing connection of the inverter system. The earth wire must be clearly visible.",
    required: false,
    order: 7,
  },
  {
    id: "pr-installer",
    label: "Installer with Installation",
    instructions:
      "Optional: photo of the installer standing next to the completed installation for verification purposes.",
    required: false,
    order: 8,
  },
];

export const SEED_MODELS: ProductModel[] = [
  {
    id: "mdl-hp-3",
    series: "AuraWatt HybridPro",
    name: "AuraWatt HybridPro 3kW",
    capacityKw: 3,
    productType: "inverter",
    warrantyMonths: 60,
    active: true,
    createdAt: daysAgo(420),
  },
  {
    id: "mdl-hp-5",
    series: "AuraWatt HybridPro",
    name: "AuraWatt HybridPro 5kW",
    capacityKw: 5,
    productType: "inverter",
    warrantyMonths: 60,
    active: true,
    createdAt: daysAgo(420),
  },
  {
    id: "mdl-hp-75",
    series: "AuraWatt HybridPro",
    name: "AuraWatt HybridPro 7.5kW",
    capacityKw: 7.5,
    productType: "inverter",
    warrantyMonths: 60,
    active: true,
    createdAt: daysAgo(400),
  },
  {
    id: "mdl-hm-10",
    series: "AuraWatt HybridMax",
    name: "AuraWatt HybridMax 10kW",
    capacityKw: 10,
    productType: "inverter",
    warrantyMonths: 84,
    active: true,
    createdAt: daysAgo(360),
  },
  {
    id: "mdl-hm-15",
    series: "AuraWatt HybridMax",
    name: "AuraWatt HybridMax 15kW",
    capacityKw: 15,
    productType: "inverter",
    warrantyMonths: 84,
    active: true,
    createdAt: daysAgo(360),
  },
  {
    id: "mdl-hu-20",
    series: "AuraWatt HybridUltra",
    name: "AuraWatt HybridUltra 20kW",
    capacityKw: 20,
    productType: "inverter",
    warrantyMonths: 120,
    active: true,
    createdAt: daysAgo(240),
  },
  {
    id: "mdl-pc-51",
    series: "AuraWatt PowerCell",
    name: "AuraWatt PowerCell 5.1kWh",
    capacityKw: 5.1,
    productType: "battery",
    warrantyMonths: 120,
    active: true,
    createdAt: daysAgo(300),
  },
  {
    id: "mdl-pc-102",
    series: "AuraWatt PowerCell",
    name: "AuraWatt PowerCell 10.2kWh",
    capacityKw: 10.2,
    productType: "battery",
    warrantyMonths: 120,
    active: true,
    createdAt: daysAgo(300),
  },
];

interface SerialSeed {
  serial: string;
  modelId: string;
  status?: "available" | "registered";
  warrantyId?: string;
  addedDaysAgo?: number;
}

const SERIAL_SEEDS: SerialSeed[] = [
  { serial: "AW-HI-3KW-24001", modelId: "mdl-hp-3" },
  { serial: "AW-HI-3KW-24002", modelId: "mdl-hp-3" },
  { serial: "AW-HI-3KW-24003", modelId: "mdl-hp-3" },
  { serial: "AW-HI-5KW-24001", modelId: "mdl-hp-5" },
  { serial: "AW-HI-5KW-24002", modelId: "mdl-hp-5" },
  { serial: "AW-HI-5KW-24003", modelId: "mdl-hp-5" },
  { serial: "AW-HI-5KW-24004", modelId: "mdl-hp-5" },
  { serial: "AW-HI-7KW-24001", modelId: "mdl-hp-75" },
  { serial: "AW-HI-7KW-24002", modelId: "mdl-hp-75" },
  { serial: "AW-HI-10KW-24001", modelId: "mdl-hm-10" },
  { serial: "AW-HI-10KW-24002", modelId: "mdl-hm-10" },
  { serial: "AW-HI-10KW-24003", modelId: "mdl-hm-10" },
  { serial: "AW-HI-15KW-24001", modelId: "mdl-hm-15" },
  { serial: "AW-HI-15KW-24002", modelId: "mdl-hm-15" },
  { serial: "AW-HI-20KW-24001", modelId: "mdl-hu-20" },
  { serial: "AW-BT-51-24001", modelId: "mdl-pc-51" },
  { serial: "AW-BT-51-24002", modelId: "mdl-pc-51" },
  { serial: "AW-BT-102-24001", modelId: "mdl-pc-102" },
  // Serials already consumed by the seeded registrations below.
  {
    serial: "AW-HI-5KW-23001",
    modelId: "mdl-hp-5",
    status: "registered",
    warrantyId: "1024",
    addedDaysAgo: 300,
  },
  {
    serial: "AW-HI-10KW-24101",
    modelId: "mdl-hm-10",
    status: "registered",
    warrantyId: "1025",
    addedDaysAgo: 120,
  },
  {
    serial: "AW-HI-3KW-24102",
    modelId: "mdl-hp-3",
    status: "registered",
    warrantyId: "1026",
    addedDaysAgo: 120,
  },
  {
    serial: "AW-HI-15KW-24103",
    modelId: "mdl-hm-15",
    status: "registered",
    warrantyId: "1027",
    addedDaysAgo: 110,
  },
  {
    serial: "AW-HI-7KW-21004",
    modelId: "mdl-hp-75",
    status: "registered",
    warrantyId: "1028",
    addedDaysAgo: 1900,
  },
  {
    serial: "AW-HI-5KW-24104",
    modelId: "mdl-hp-5",
    status: "registered",
    warrantyId: "1029",
    addedDaysAgo: 60,
  },
];

function buildSerials(): SerialNumber[] {
  return SERIAL_SEEDS.map((seed, index) => {
    const model = SEED_MODELS.find((m) => m.id === seed.modelId)!;
    return {
      id: `srl-${index + 1}`,
      serial: seed.serial,
      modelId: model.id,
      modelName: model.name,
      capacityKw: model.capacityKw,
      productType: model.productType,
      status: seed.status ?? "available",
      addedAt: daysAgo(seed.addedDaysAgo ?? 18 + index),
      warrantyId: seed.warrantyId,
    };
  });
}

function event(
  type: WarrantyEvent["type"],
  label: string,
  at: string,
  actor: string,
  note?: string,
): WarrantyEvent {
  return { id: `${type}-${at}`, type, label, at, actor, note };
}

function buildRegistrations(): WarrantyRegistration[] {
  const requirements = SEED_PHOTO_REQUIREMENTS;

  // 1024 — Active warranty, fully activated.
  const activeSubmitted = daysAgo(26);
  const activeApproved = daysAgo(24);
  const activeStart = dateDaysAgo(30);
  const active: WarrantyRegistration = {
    id: "1024",
    serial: "AW-HI-5KW-23001",
    modelId: "mdl-hp-5",
    modelName: "AuraWatt HybridPro 5kW",
    capacityKw: 5,
    productType: "inverter",
    customer: {
      fullName: "Rajesh Kumar",
      phone: "9876543210",
      email: "rajesh.kumar@example.com",
      address: "45, Laxmi Nagar, Sector 12",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110092",
    },
    installer: {
      companyName: "Suresh Electricals Pvt Ltd",
      contactName: "Suresh Menon",
      contactNumber: "9988776655",
      email: "service@sureshelectricals.example.com",
      installerId: "AW-INST-2291",
    },
    installation: {
      installationDate: activeStart,
      installationAddress: "45, Laxmi Nagar, Sector 12, New Delhi, Delhi 110092",
      productType: "inverter",
      modelId: "mdl-hp-5",
      modelName: "AuraWatt HybridPro 5kW",
      capacityKw: 5,
      batteryInstalled: true,
      batteryModel: "AuraWatt PowerCell 5.1kWh",
      batterySerial: "AW-BT-51-23044",
    },
    photos: seedPhotos(requirements, 6, activeSubmitted),
    status: "active",
    submittedAt: activeSubmitted,
    reviewedAt: activeApproved,
    warrantyStart: activeStart,
    warrantyEnd: addMonths(activeStart, 60),
    warrantyMonths: 60,
    history: [
      event(
        "submitted",
        "Registration Submitted",
        activeSubmitted,
        "Rajesh Kumar",
      ),
      event("verified", "Evidence Verified", daysAgo(25), "Admin"),
      event("approved", "Registration Approved", activeApproved, "Admin"),
      event(
        "activated",
        "Warranty Activated",
        activeApproved,
        "System",
        "60 month warranty applied from the installation date.",
      ),
    ],
  };

  // 1025 — Awaiting admin verification.
  const pendingSubmitted = daysAgo(2);
  const pending: WarrantyRegistration = {
    id: "1025",
    serial: "AW-HI-10KW-24101",
    modelId: "mdl-hm-10",
    modelName: "AuraWatt HybridMax 10kW",
    capacityKw: 10,
    productType: "inverter",
    customer: {
      fullName: "Meera Iyer",
      phone: "9845012377",
      email: "meera.iyer@example.com",
      address: "12, Green Meadows, Whitefield",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560066",
    },
    installer: {
      companyName: "Sunline Energy Solutions",
      contactName: "Arun Prakash",
      contactNumber: "9611220044",
      email: "support@sunline.example.com",
      installerId: "AW-INST-3117",
    },
    installation: {
      installationDate: dateDaysAgo(6),
      installationAddress:
        "12, Green Meadows, Whitefield, Bengaluru, Karnataka 560066",
      productType: "inverter",
      modelId: "mdl-hm-10",
      modelName: "AuraWatt HybridMax 10kW",
      capacityKw: 10,
      batteryInstalled: true,
      batteryModel: "AuraWatt PowerCell 10.2kWh",
      batterySerial: "AW-BT-102-24007",
    },
    photos: seedPhotos(requirements, 6, pendingSubmitted),
    status: "pending",
    submittedAt: pendingSubmitted,
    history: [
      event("submitted", "Registration Submitted", pendingSubmitted, "Meera Iyer"),
    ],
  };

  // 1026 — Correction requested by admin.
  const correctionSubmitted = daysAgo(9);
  const correctionRaised = daysAgo(7);
  const correction: WarrantyRegistration = {
    id: "1026",
    serial: "AW-HI-3KW-24102",
    modelId: "mdl-hp-3",
    modelName: "AuraWatt HybridPro 3kW",
    capacityKw: 3,
    productType: "inverter",
    customer: {
      fullName: "Anita Deshmukh",
      phone: "9822114466",
      email: "anita.deshmukh@example.com",
      address: "Flat 402, Sai Residency, Baner Road",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411045",
    },
    installer: {
      companyName: "Deccan Solar Works",
      contactName: "Nikhil Rane",
      contactNumber: "9730551188",
      email: "help@deccansolar.example.com",
    },
    installation: {
      installationDate: dateDaysAgo(14),
      installationAddress:
        "Flat 402, Sai Residency, Baner Road, Pune, Maharashtra 411045",
      productType: "inverter",
      modelId: "mdl-hp-3",
      modelName: "AuraWatt HybridPro 3kW",
      capacityKw: 3,
      batteryInstalled: false,
    },
    photos: seedPhotos(requirements, 4, correctionSubmitted),
    status: "correction",
    submittedAt: correctionSubmitted,
    reviewedAt: correctionRaised,
    decisionNote:
      "The serial number label photo is blurred and the AC grid connection photo is missing. Please re-upload both so we can complete verification.",
    correctionItems: ["Inverter Serial Number Label", "AC Grid Connection"],
    history: [
      event(
        "submitted",
        "Registration Submitted",
        correctionSubmitted,
        "Anita Deshmukh",
      ),
      event(
        "correction",
        "Correction Requested",
        correctionRaised,
        "Admin",
        "Serial label photo unreadable; AC grid connection photo missing.",
      ),
    ],
  };

  // 1027 — Rejected registration.
  const rejectedSubmitted = daysAgo(20);
  const rejectedAt = daysAgo(18);
  const rejected: WarrantyRegistration = {
    id: "1027",
    serial: "AW-HI-15KW-24103",
    modelId: "mdl-hm-15",
    modelName: "AuraWatt HybridMax 15kW",
    capacityKw: 15,
    productType: "inverter",
    customer: {
      fullName: "Vikram Sethi",
      phone: "9811223344",
      email: "vikram.sethi@example.com",
      address: "Plot 7, Industrial Area Phase 2",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122015",
    },
    installer: {
      companyName: "Northgrid Installations",
      contactName: "Harpreet Singh",
      contactNumber: "9871009911",
      email: "ops@northgrid.example.com",
    },
    installation: {
      installationDate: dateDaysAgo(240),
      installationAddress:
        "Plot 7, Industrial Area Phase 2, Gurugram, Haryana 122015",
      productType: "inverter",
      modelId: "mdl-hm-15",
      modelName: "AuraWatt HybridMax 15kW",
      capacityKw: 15,
      batteryInstalled: false,
    },
    photos: seedPhotos(requirements, 3, rejectedSubmitted),
    status: "rejected",
    submittedAt: rejectedSubmitted,
    reviewedAt: rejectedAt,
    decisionNote:
      "Registration submitted more than 180 days after the installation date, which is outside the warranty registration window stated in the product terms.",
    history: [
      event(
        "submitted",
        "Registration Submitted",
        rejectedSubmitted,
        "Vikram Sethi",
      ),
      event(
        "rejected",
        "Registration Rejected",
        rejectedAt,
        "Admin",
        "Outside the 180 day registration window.",
      ),
    ],
  };

  // 1028 — Warranty term already elapsed.
  const expiredStart = dateYearsAgo(6);
  const expiredSubmitted = daysAgo(2150);
  const expired: WarrantyRegistration = {
    id: "1028",
    serial: "AW-HI-7KW-21004",
    modelId: "mdl-hp-75",
    modelName: "AuraWatt HybridPro 7.5kW",
    capacityKw: 7.5,
    productType: "inverter",
    customer: {
      fullName: "Farhan Qureshi",
      phone: "9900443322",
      email: "farhan.qureshi@example.com",
      address: "22, Marine Lines Cross Road",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400020",
    },
    installer: {
      companyName: "Coastal Power Systems",
      contactName: "Imran Shaikh",
      contactNumber: "9820117733",
      email: "care@coastalpower.example.com",
      installerId: "AW-INST-1042",
    },
    installation: {
      installationDate: expiredStart,
      installationAddress:
        "22, Marine Lines Cross Road, Mumbai, Maharashtra 400020",
      productType: "inverter",
      modelId: "mdl-hp-75",
      modelName: "AuraWatt HybridPro 7.5kW",
      capacityKw: 7.5,
      batteryInstalled: false,
    },
    photos: [],
    status: "expired",
    submittedAt: expiredSubmitted,
    reviewedAt: daysAgo(2148),
    warrantyStart: expiredStart,
    warrantyEnd: addMonths(expiredStart, 60),
    warrantyMonths: 60,
    history: [
      event(
        "submitted",
        "Registration Submitted",
        expiredSubmitted,
        "Farhan Qureshi",
      ),
      event("approved", "Registration Approved", daysAgo(2148), "Admin"),
      event("activated", "Warranty Activated", daysAgo(2148), "System"),
      event(
        "expired",
        "Warranty Expired",
        addMonths(expiredStart, 60),
        "System",
        "60 month warranty term completed.",
      ),
    ],
  };

  // 1029 — Second item in the review queue.
  const pending2Submitted = daysAgo(1);
  const pending2: WarrantyRegistration = {
    id: "1029",
    serial: "AW-HI-5KW-24104",
    modelId: "mdl-hp-5",
    modelName: "AuraWatt HybridPro 5kW",
    capacityKw: 5,
    productType: "inverter",
    customer: {
      fullName: "Kavya Nair",
      phone: "9745008812",
      email: "kavya.nair@example.com",
      address: "House 9, Panampilly Nagar",
      city: "Kochi",
      state: "Kerala",
      pincode: "682036",
    },
    installer: {
      companyName: "Backwater Renewables",
      contactName: "Thomas Jacob",
      contactNumber: "9846223311",
      email: "info@backwaterre.example.com",
      installerId: "AW-INST-4408",
    },
    installation: {
      installationDate: dateDaysAgo(4),
      installationAddress: "House 9, Panampilly Nagar, Kochi, Kerala 682036",
      productType: "inverter",
      modelId: "mdl-hp-5",
      modelName: "AuraWatt HybridPro 5kW",
      capacityKw: 5,
      batteryInstalled: true,
      batteryModel: "AuraWatt PowerCell 5.1kWh",
      batterySerial: "AW-BT-51-24019",
    },
    photos: seedPhotos(requirements, 7, pending2Submitted),
    status: "pending",
    submittedAt: pending2Submitted,
    history: [
      event("submitted", "Registration Submitted", pending2Submitted, "Kavya Nair"),
    ],
  };

  return [pending2, pending, correction, active, rejected, expired];
}

export function createSeedDatabase(): Database {
  return {
    version: DB_VERSION,
    models: SEED_MODELS,
    serials: buildSerials(),
    registrations: buildRegistrations(),
    photoRequirements: SEED_PHOTO_REQUIREMENTS,
    nextWarrantyId: 1030,
  };
}
