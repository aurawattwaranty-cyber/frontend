/** Domain model for the Aurawatt Warranty Management System. */

export type ProductType = "inverter" | "battery";

export interface ProductModel {
  id: string;
  /** Product series, e.g. "AuraWatt HybridPro". */
  series: string;
  /** Full model name, e.g. "AuraWatt HybridPro 5kW". */
  name: string;
  capacityKw: number;
  productType: ProductType;
  /** Warranty duration granted on activation. */
  warrantyMonths: number;
  active: boolean;
  createdAt: string;
}

export type SerialStatus = "available" | "registered";

export interface SerialNumber {
  id: string;
  serial: string;
  modelId: string;
  modelName: string;
  capacityKw: number;
  productType: ProductType;
  status: SerialStatus;
  addedAt: string;
  /** Warranty that consumed this serial, when registered. */
  warrantyId?: string;
}

export type WarrantyStatus =
  | "pending"
  | "correction"
  | "active"
  | "rejected"
  | "expired";

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface InstallerDetails {
  companyName: string;
  contactName: string;
  contactNumber: string;
  email: string;
  /** Optional installer registration number issued by Aurawatt. */
  installerId?: string;
}

export interface InstallationDetails {
  installationDate: string;
  installationAddress: string;
  productType: ProductType;
  modelId: string;
  modelName: string;
  capacityKw: number;
  batteryInstalled: boolean;
  batteryModel?: string;
  batterySerial?: string;
}

export interface WarrantyPhoto {
  requirementId: string;
  requirementLabel: string;
  fileName: string;
  url: string;
  sizeBytes: number;
  uploadedAt: string;
  storageId?: string;
}

export type WarrantyEventType =
  | "submitted"
  | "verified"
  | "correction"
  | "resubmitted"
  | "approved"
  | "activated"
  | "rejected"
  | "expired";

export interface WarrantyEvent {
  id: string;
  type: WarrantyEventType;
  label: string;
  note?: string;
  actor: string;
  at: string;
}

export interface WarrantyRegistration {
  /** Public warranty ID — the value printed on the certificate and QR code. */
  id: string;
  serial: string;
  modelId: string;
  modelName: string;
  capacityKw: number;
  productType: ProductType;
  customer: CustomerDetails;
  installer: InstallerDetails;
  installation: InstallationDetails;
  photos: WarrantyPhoto[];
  status: WarrantyStatus;
  submittedAt: string;
  reviewedAt?: string;
  /** Correction request comment or rejection reason. */
  decisionNote?: string;
  correctionItems?: string[];
  warrantyStart?: string;
  warrantyEnd?: string;
  warrantyMonths?: number;
  history: WarrantyEvent[];
}

export interface PhotoRequirement {
  id: string;
  label: string;
  instructions: string;
  required: boolean;
  order: number;
}

/** Draft held by the public registration wizard before submission. */
export interface RegistrationDraft {
  serial: string;
  modelId: string;
  modelName: string;
  capacityKw: number;
  productType: ProductType;
  customer: CustomerDetails;
  installer: InstallerDetails;
  installation: InstallationDetails;
  photos: WarrantyPhoto[];
}

export interface SerialValidationResult {
  status: "available" | "registered" | "unknown";
  serial: SerialNumber | null;
  message: string;
  /** Set when the serial is already tied to a registration. */
  existingWarrantyId?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "verifier";
}

export interface DashboardStats {
  totalRegistrations: number;
  pendingReview: number;
  activeWarranties: number;
  rejected: number;
  correctionRequired: number;
  serialsAvailable: number;
  serialsRegistered: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WarrantyQuery {
  search?: string;
  status?: WarrantyStatus | "all";
  modelId?: string | "all";
  from?: string;
  to?: string;
  sortBy?: "id" | "customer" | "submittedAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface BulkImportRow {
  rowNumber: number;
  serial: string;
  modelName: string;
  capacityKw: string;
  productType: string;
  valid: boolean;
  error?: string;
}

export interface BulkImportPreview {
  fileName: string;
  rows: BulkImportRow[];
  validCount: number;
  invalidCount: number;
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  errors: { rowNumber: number; serial: string; error: string }[];
}
