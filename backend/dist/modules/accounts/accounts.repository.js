export const accountsRepository = {
    async findAll() {
        return [];
    },
    async create(payload) {
        return { id: "account_1", name: payload.name, status: "active" };
    }
};
