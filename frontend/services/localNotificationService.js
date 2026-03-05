import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function normalizeToHHMM(value) {
  if (!value) return null;
  const s = String(value).trim();
  const colon = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (colon) return `${colon[1].padStart(2, "0")}:${colon[2]}`;
  const compact = /^(\d{2})(\d{2})$/.exec(s);
  if (compact) return `${compact[1]}:${compact[2]}`;
  return null;
}

export const scheduleLocalNotification = async (medicationName, reminderTime, dosage, prescriptionId) => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Medication Reminder",
        body: `Time to take ${medicationName}`,
        subtitle: `Dosage: ${dosage}`,
        sound: "default",
        priority: "high",
        badge: 1,
        data: {
          medicationName,
          dosage,
          prescriptionId,
          type: "medicationreminder",
          reminderTime: reminderTime.toISOString(),
        },
      },
      trigger: { type: "date", date: reminderTime },
    });

    return notificationId;
  } catch (error) {
    console.error("Error scheduling notification", error);
    return null;
  }
};

// reminderTimes = [0, 15, 30, 60] minutes before each medication time
// medicationTimes = ["08:00","14:00"] etc
export const scheduleMultipleNotifications = async (
  medicationName,
  dosage,
  prescriptionId,
  reminderTimes = [0],
  medicationTimes = ["09:00"]
) => {
  try {
    const scheduledIds = [];
    const now = new Date();

    const cleanTimes = (Array.isArray(medicationTimes) ? medicationTimes : [medicationTimes])
      .map(normalizeToHHMM)
      .filter(Boolean);

    for (const t of cleanTimes.length ? cleanTimes : ["09:00"]) {
      const [h, m] = t.split(":").map(Number);
      const medicationTime = new Date(now);
      medicationTime.setHours(h, m, 0, 0);

      for (const mins of reminderTimes) {
        const reminderTime = new Date(medicationTime);
        reminderTime.setMinutes(reminderTime.getMinutes() - mins);

        const notificationId = await scheduleLocalNotification(
          medicationName,
          reminderTime,
          dosage,
          prescriptionId
        );
        if (notificationId) scheduledIds.push(notificationId);
      }
    }

    return scheduledIds;
  } catch (error) {
    console.error("Error scheduling multiple notifications", error);
    return [];
  }
};

export const cancelNotification = async (notificationId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error("Error cancelling notification", error);
    return false;
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error("Error cancelling all notifications", error);
    return false;
  }
};

export const getAllScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error getting scheduled notifications", error);
    return [];
  }
};
