import * as Notifications from 'expo-notifications';
import { differenceInDays, addDays, addHours } from 'date-fns';

// Basic config
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Schedule notifications for a prescription
 * @param {Object} prescription - Prescription data from Firebase
 */
export async function scheduleMedicationNotifications(prescription) {
  const { medication, frequency, startDate, endDate } = prescription;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalDays = differenceInDays(end, start) + 1;

  let timesPerDay = 1;
  if (frequency.includes('2')) timesPerDay = 2;
  if (frequency.includes('3')) timesPerDay = 3;
  if (frequency.includes('4')) timesPerDay = 4;

  for (let i = 0; i < totalDays; i++) {
    for (let j = 0; j < timesPerDay; j++) {
      const reminderTime = addHours(addDays(start, i), (j * 24) / timesPerDay);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder 💊',
          body: `Time to take your ${medication}`,
          sound: 'default',
        },
        trigger: reminderTime,
      });
    }
  }

  console.log(`Scheduled ${totalDays * timesPerDay} notifications for ${medication}`);
}
