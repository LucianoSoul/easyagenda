export const clientsRepository = {
    async findAll() {
        return [];
    },
    async create(payload) {
        return { id: "client_1", ...payload };
    }
};
