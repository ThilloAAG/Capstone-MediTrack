import { addDays, format, isPast, isBefore, isAfter, startOfDay, addHours, parse, setHours, setMinutes } from 'date-fns';

/**
 * Parse frequency string to get times per day
 */
export const getFrequencyCount = (frequency) => {
  if (!frequency) return 1;
  
  const freq = frequency.toLowerCase();
  if (freq.includes('once')) return 1;
  if (freq.includes('twice')) return 2;
  if (freq.includes('thrice') || freq.includes('three times')) return 3;
  if (freq.includes('four times') || freq.includes('4 times')) return 4;
  if (freq.includes('every 6')) return 4;
  if (freq.includes('every 8')) return 3;
  if (freq.includes('every 12')) return 2;
  
  // Extract number if present (e.g., "3 times daily")
  const match = frequency.match(/(\d+)\s*times/i);
  return match ? parseInt(match[1]) : 1;
};

/**
 * Calculate time until a scheduled dose
 */
export const calculateTimeUntil = (scheduledTime) => {
  const now = new Date();
  const diffMs = scheduledTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 0) return 'Overdue';
  if (diffMins < 60) return `in ${diffMins} minutes`;
  if (diffHours < 24) {
    const mins = diffMins % 60;
    return `in ${diffHours}h ${mins}m`;
  }
  const days = Math.floor(diffHours / 24);
  return `in ${days} day${days !== 1 ? 's' : ''}`;
};

/**
 * Parse time string (HH:MM) to hours and minutes
 */
const parseTimeString = (timeString) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Generate upcoming doses for next 7 days
 */
export const generateUpcomingDoses = (prescriptions) => {
  const now = new Date();
  const upcomingDoses = [];

  console.log('🔍 Generating doses for prescriptions:', prescriptions.length);

  prescriptions.forEach((prescription) => {
    const { id, name, medication, medicationName, dosage, frequency, startDate, endDate, time, dosesCompleted = [] } = prescription;

    if (!startDate) {
      console.log('⚠️ Skipping prescription (no startDate):', id);
      return;
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : addDays(now, 30);

    // Check if prescription is still active
    if (isPast(end) && !isBefore(now, end)) {
      console.log('⚠️ Prescription expired:', id);
      return;
    }

    const timesPerDay = getFrequencyCount(frequency);
    const medName = medicationName || medication || name;
    
    console.log(`📋 Processing: ${medName} - ${timesPerDay} times/day, time: ${time || 'not set'}`);

    // Parse the time field if it exists
    const prescriptionTime = parseTimeString(time);

    // Generate doses for the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = addDays(startOfDay(now), dayOffset);

      // Check if current day is within prescription period
      if (isBefore(currentDay, startOfDay(start))) continue;
      if (isAfter(currentDay, end)) continue;

      for (let doseIndex = 0; doseIndex < timesPerDay; doseIndex++) {
        let scheduledTime;

        if (prescriptionTime && timesPerDay === 1) {
          // Use the exact time from prescription for once-a-day medications
          scheduledTime = setMinutes(
            setHours(currentDay, prescriptionTime.hours),
            prescriptionTime.minutes
          );
        } else if (prescriptionTime && timesPerDay > 1) {
          // For multiple times per day, use prescription time as base and space out
          const hourInterval = 24 / timesPerDay;
          const offsetHours = doseIndex * hourInterval;
          scheduledTime = addHours(
            setMinutes(setHours(currentDay, prescriptionTime.hours), prescriptionTime.minutes),
            offsetHours
          );
        } else {
          // Fallback: Distribute times evenly throughout the day if no time set
          const hour = Math.floor((doseIndex * 24) / timesPerDay);
          scheduledTime = addHours(currentDay, hour);
        }

        // Skip past doses (more than 1 hour ago)
        const diffMins = (scheduledTime.getTime() - now.getTime()) / 60000;
        if (diffMins < -60) continue;

        // Create unique dose key
        const doseKey = format(scheduledTime, 'yyyy-MM-dd HH:mm');
        
        // Determine status
        let status = 'upcoming';
        if (dosesCompleted.includes(doseKey)) {
          status = 'taken';
        } else if (isPast(scheduledTime)) {
          status = 'overdue';
        }

        upcomingDoses.push({
          id: `${id}-${dayOffset}-${doseIndex}`,
          prescriptionId: id,
          medication: medName,
          dosage: dosage || '1 unit',
          frequency,
          scheduledTime,
          scheduledTimeString: format(scheduledTime, 'MMM dd, yyyy h:mm a'),
          timeUntilDose: calculateTimeUntil(scheduledTime),
          status,
          reminderTime: `${30} minutes before`,
        });
      }
    }
  });

  // Sort by scheduled time (nearest first)
  const sorted = upcomingDoses.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  
  console.log('✅ Generated doses:', sorted.length);
  console.log('🔍 Next 3 doses:', sorted.slice(0, 3).map(d => ({
    med: d.medication,
    time: format(d.scheduledTime, 'h:mm a'),
    status: d.status
  })));
  
  return sorted;
};
