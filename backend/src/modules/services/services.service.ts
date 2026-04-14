import { servicesRepository } from "./services.repository.js";
import type { CreateServiceInput } from "./services.schemas.js";

export const servicesService = {
  async list() {
    return servicesRepository.findAll();
  },
  async create(payload: CreateServiceInput) {
    return servicesRepository.create(payload);
  }
};
