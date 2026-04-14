import { creditsRepository } from "./credits.repository.js";
export const creditsService = {
    async list() {
        return creditsRepository.findAll();
    },
    async create(payload) {
        return creditsRepository.create(payload);
    }
};
