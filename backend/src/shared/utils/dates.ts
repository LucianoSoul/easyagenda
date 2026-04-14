export const toIsoDate = (date: Date | string) => new Date(date).toISOString();

export const startOfDay = (date: Date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};
