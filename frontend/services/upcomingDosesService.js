import { addDays, addHours, differenceInDays, format, isPast, isBefore } from 'date-fns';

/**
 * Parse frequency string to get times per day
 * Examples: "Once daily" -> 1, "Twice daily" -> 2, "Every 8 hours" -> 3
 */
export const getFrequencyCount = (frequency) => {
  if (!frequency) return 1;
  
  const freq = frequency.toLowerCase();
  if (freq.includes('once')) return 1;
  if (freq.includes('twice')) return 2;
  if (freq.includes('thrice')) return 3;
  if (freq.includes('every 6')) return 4;
  if (freq.includes('every 8')) return 3;
  if (freq.includes('every 12')) return 2;
  if (freq.includes('4 times')) return 4;
  
  // Extract number if present (e.g., "3 times daily")
  const match = frequency.match(/(\d+)/);
  return match ? parseInt(match[1]) : 1;
};

/**
 * Calculate time until a scheduled dose in human-readable format
 */
export const calculateTimeUntil = (scheduledTime) => {
  const now = new Date();
  const diffMs = scheduledTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 0) return 'Overdue';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffDays}d ${diffHours % 24}h`;
};

/**
 * Generate upcoming doses for next 7 days
 */
export const generateUpcomingDoses = (prescriptions) => {
  const now = new Date();
  const upcomingDoses = [];

  prescriptions.forEach((prescription) => {
    const { id, name, medication, dosage, frequency, startDate, endDate } = prescription;

    if (!startDate) return;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : addDays(start, 7);

    // Only consider prescriptions that haven't ended yet
    if (isPast(end)) return;

    const timesPerDay = getFrequencyCount(frequency);

    // Generate doses for the next 7 days
    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(now, i);

      // Check if current day is within prescription period
      if (isBefore(currentDay, start) || isPast(end)) continue;

      for (let j = 0; j < timesPerDay; j++) {
        // Distribute times evenly throughout the day
        const hour = Math.floor((j * 24) / timesPerDay);
        const scheduledTime = new Date(currentDay);
        scheduledTime.setHours(hour, 0, 0, 0);

        // Determine status
        let status = 'upcoming';
        if (isPast(scheduledTime) && !isBefore(scheduledTime, now)) {
          status = 'overdue';
        } else if (prescription.dosesCompleted && prescription.dosesCompleted.includes(format(scheduledTime, 'yyyy-MM-dd HH:00'))) {
          status = 'taken';
        }

        upcomingDoses.push({
          id: `${id}-${i}-${j}`,
          prescriptionId: id,
          medication: medication || name,
          dosage: dosage || '1 unit',
          frequency,
          scheduledTime,
          scheduledTimeString: format(scheduledTime, 'MMM dd, yyyy HH:mm'),
          timeUntilDose: calculateTimeUntil(scheduledTime),
          status,
        });
      }
    }
  });

  // Sort by scheduled time
  return upcomingDoses.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
};
