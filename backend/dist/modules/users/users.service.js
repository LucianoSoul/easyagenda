import { usersRepository } from "./users.repository.js";
export const usersService = {
    async list() {
        return usersRepository.findAll();
    },
    async create(payload) {
        return usersRepository.create(payload);
    }
};
