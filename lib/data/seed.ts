import type {
  CustomerExperienceConfig,
  CustomerFieldConfig,
  PhotoRequirement,
  ProductModel,
  CustomerSectionConfig,
  StatusBlockConfig,
} from "@/lib/types";

export interface Database {
  version: number;
  models: ProductModel[];
  serials: import("@/lib/types").SerialNumber[];
  registrations: import("@/lib/types").WarrantyRegistration[];
  photoRequirements: PhotoRequirement[];
  users: import("@/lib/types").AdminUser[];
  customerExperience: CustomerExperienceConfig;
  nextWarrantyId: number;
}

export const DB_VERSION = 3;

export const SEED_PHOTO_REQUIREMENTS: PhotoRequirement[] = [];
export const SEED_MODELS: ProductModel[] = [];

function createEmptyCustomerExperience(): CustomerExperienceConfig {
  return {
    register: {
      heading: "",
      subheading: "",
      sections: [] as CustomerSectionConfig[],
      fields: [] as CustomerFieldConfig[],
    },
    status: {
      heading: "",
      subheading: "",
      searchPlaceholder: "",
      helpText: "",
      blocks: [] as StatusBlockConfig[],
    },
    updatedAt: new Date().toISOString(),
    updatedBy: "System",
  };
}

export function createSeedDatabase(): Database {
  return {
    version: DB_VERSION,
    models: [],
    serials: [],
    registrations: [],
    photoRequirements: [],
    users: [],
    customerExperience: createEmptyCustomerExperience(),
    nextWarrantyId: 1,
  };
}
