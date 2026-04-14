export const attendanceRepository = {
    async findAll() {
        return [];
    },
    async create(payload) {
        return { id: "attendance_1", ...payload };
    }
};
