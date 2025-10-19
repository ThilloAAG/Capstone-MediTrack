export const formatTimeDifference = (targetTime) => {
  if (!targetTime) return "";
  const now = new Date();
  const target = new Date(targetTime);
  const diffMs = target - now;
  if (diffMs <= 0) return "Now";
  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours > 0) return `In ${hours}h ${remMins}m`;
  return `In ${remMins} min`;
};
