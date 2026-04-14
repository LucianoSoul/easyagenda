import { accountsRepository } from "./accounts.repository.js";
export const accountsService = {
    async list() {
        return accountsRepository.findAll();
    },
    async create(payload) {
        return accountsRepository.create(payload);
    }
};
