import { clientsRepository } from "./clients.repository.js";
export const clientsService = {
    async list() {
        return clientsRepository.findAll();
    },
    async create(payload) {
        return clientsRepository.create(payload);
    }
};
