export const isScheduleActive = (startDate: string, endDate?: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  if (!endDate) return today >= start;

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return today >= start && today <= end;
};
