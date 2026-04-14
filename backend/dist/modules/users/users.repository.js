export const usersRepository = {
    async findAll() {
        return [];
    },
    async create(payload) {
        return { id: "user_1", ...payload };
    }
};
