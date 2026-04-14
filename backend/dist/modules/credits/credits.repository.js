export const creditsRepository = {
    async findAll() {
        return [];
    },
    async create(payload) {
        return { id: "credit_1", ...payload };
    }
};
