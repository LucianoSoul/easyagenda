export const servicesRepository = {
    async findAll() {
        return [];
    },
    async create(payload) {
        return { id: "service_1", ...payload };
    }
};
