import type { CreateServiceInput } from "./services.schemas.js";
import type { ServiceItem } from "./services.types.js";

export const servicesRepository = {
  async findAll(): Promise<ServiceItem[]> {
    return [];
  },
  async create(payload: CreateServiceInput): Promise<ServiceItem> {
    return { id: "service_1", ...payload };
  }
};
