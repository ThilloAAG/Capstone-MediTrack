import {
  addDays,
  format,
  isPast,
  isBefore,
  isAfter,
  startOfDay,
  addHours,
  setHours,
  setMinutes,
} from "date-fns";

// Parse frequency string to get times per day
export const getFrequencyCount = (frequency) => {
  if (!frequency) return 1;
  const freq = String(frequency).toLowerCase();

  if (freq.includes("once")) return 1;
  if (freq.includes("twice")) return 2;
  if (freq.includes("thrice") || freq.includes("three times")) return 3;
  if (freq.includes("four times") || freq.includes("4 times")) return 4;

  if (freq.includes("every 6")) return 4;
  if (freq.includes("every 8")) return 3;
  if (freq.includes("every 12")) return 2;

  const match = String(frequency).match(/(\d+)\s*times?/i);
  return match ? parseInt(match[1], 10) : 1;
};

export const calculateTimeUntil = (scheduledTime) => {
  const now = new Date();
  const diffMs = scheduledTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 0) return "Overdue";
  if (diffMins < 60) return `in ${diffMins} minute${diffMins !== 1 ? "s" : ""}`;
  if (diffHours < 24) {
    const mins = diffMins % 60;
    return `in ${diffHours}h ${mins}m`;
  }
  const days = Math.floor(diffHours / 24);
  return `in ${days} day${days !== 1 ? "s" : ""}`;
};

function normalizeTimeToHHMM(value) {
  if (!value) return null;
  const s = String(value).trim();

  // "HH:mm"
  const colon = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (colon) {
    const h = String(Math.min(23, Math.max(0, Number(colon[1])))).padStart(2, "0");
    const m = String(Math.min(59, Math.max(0, Number(colon[2])))).padStart(2, "0");
    return `${h}:${m}`;
  }

  // "HHmm"
  const compact = /^(\d{2})(\d{2})$/.exec(s);
  if (compact) {
    const h = String(Math.min(23, Math.max(0, Number(compact[1])))).padStart(2, "0");
    const m = String(Math.min(59, Math.max(0, Number(compact[2])))).padStart(2, "0");
    return `${h}:${m}`;
  }

  return null;
}

function parseTimeFlexible(timeValue) {
  const hhmm = normalizeTimeToHHMM(timeValue);
  if (!hhmm) return null;
  const [hStr, mStr] = hhmm.split(":");
  const hours = Number(hStr);
  const minutes = Number(mStr);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return { hours, minutes, hhmm };
}

function getEffectiveTimes(prescription) {
  // Preferred: times[]
  const arr = Array.isArray(prescription?.times)
    ? prescription.times.map(normalizeTimeToHHMM).filter(Boolean)
    : [];

  if (arr.length > 0) return arr;

  // Legacy fallback: time (read-only support so old docs still work)
  const legacy = normalizeTimeToHHMM(prescription?.time);
  return legacy ? [legacy] : [];
}

// Generate upcoming doses for next 7 days
export const generateUpcomingDoses = (prescriptions) => {
  const now = new Date();
  const upcomingDoses = [];

  (prescriptions || []).forEach((prescription) => {
    const {
      id,
      name,
      medication,
      medicationName,
      dosage,
      frequency,
      startDate,
      endDate,
      dosesCompleted,
      timesPerDay: storedTimesPerDay,
    } = prescription;

    if (!startDate) return;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : addDays(now, 30);

    // If prescription is still active
    if (isPast(end) && !isBefore(now, end)) return;

    const effectiveTimes = getEffectiveTimes(prescription);
    const baseTime = effectiveTimes.length > 0 ? parseTimeFlexible(effectiveTimes[0]) : null;

    // prefer explicit timesPerDay, else parse frequency, else fall back to times[].length, else 1
    const timesPerDay =
      Number.isFinite(Number(storedTimesPerDay)) && Number(storedTimesPerDay) > 0
        ? Number(storedTimesPerDay)
        : (frequency ? getFrequencyCount(frequency) : (effectiveTimes.length || 1));

    const medName = medicationName || medication || name || "Medication";

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDay = addDays(startOfDay(now), dayOffset);

      if (isBefore(currentDay, startOfDay(start))) continue;
      if (isAfter(currentDay, end)) continue;

      for (let doseIndex = 0; doseIndex < timesPerDay; doseIndex++) {
        let scheduledTime;

        // Case A: explicit times[] provided for the day (best)
        if (effectiveTimes.length >= timesPerDay) {
          const t = parseTimeFlexible(effectiveTimes[doseIndex]);
          if (t) {
            scheduledTime = setMinutes(setHours(currentDay, t.hours), t.minutes);
          }
        }

        // Case B: only one base time exists -> distribute across the day
        if (!scheduledTime && baseTime) {
          if (timesPerDay === 1) {
            scheduledTime = setMinutes(setHours(currentDay, baseTime.hours), baseTime.minutes);
          } else {
            const hourInterval = 24 / timesPerDay;
            const offsetHours = doseIndex * hourInterval;
            scheduledTime = addHours(
              setMinutes(setHours(currentDay, baseTime.hours), baseTime.minutes),
              offsetHours
            );
          }
        }

        // Case C: fallback distribute evenly if no time at all
        if (!scheduledTime) {
          const hour = Math.floor((doseIndex * 24) / timesPerDay);
          scheduledTime = addHours(currentDay, hour);
        }

        // Skip past doses more than 1 hour ago
        const diffMins = (scheduledTime.getTime() - now.getTime()) / 60000;
        if (diffMins < -60) continue;

        const doseKey = format(scheduledTime, "yyyy-MM-dd HHmm");

        let status = "upcoming";
        const completed = Array.isArray(dosesCompleted) ? dosesCompleted : [];
        if (completed.includes(doseKey)) status = "taken";
        else if (isPast(scheduledTime)) status = "overdue";

        upcomingDoses.push({
          id: `${id}-${dayOffset}-${doseIndex}`,
          prescriptionId: id,
          medication: medName,
          dosage: dosage || "1 unit",
          frequency,
          scheduledTime,
          scheduledTimeString: format(scheduledTime, "MMM dd, yyyy h:mm a"),
          timeUntilDose: calculateTimeUntil(scheduledTime),
          status,
          reminderTime: "30 minutes before",
        });
      }
    }
  });

  return upcomingDoses.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
};
