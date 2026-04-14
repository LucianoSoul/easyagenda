import { servicesRepository } from "./services.repository.js";
export const servicesService = {
    async list() {
        return servicesRepository.findAll();
    },
    async create(payload) {
        return servicesRepository.create(payload);
    }
};
