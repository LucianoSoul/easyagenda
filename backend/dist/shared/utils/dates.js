export const toIsoDate = (date) => new Date(date).toISOString();
export const startOfDay = (date) => {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
};
