import * as Notifications from 'expo-notifications';

// ✅ Configure default notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // Show alert dialog
    shouldPlaySound: true,      // Play notification sound
    shouldSetBadge: true,       // Update app badge
    shouldShowBanner: true,     // Show banner
    shouldShowList: true,       // Show in notification list
  }),
});


// ✅ Schedule a single local notification
export const scheduleLocalNotification = async (
  medicationName,
  reminderTime,        // Date object
  dosage,
  prescriptionId
) => {
  try {
    console.log(`📅 Scheduling notification for ${medicationName} at ${reminderTime}`);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medication Reminder',
        body: `Time to take ${medicationName}`,
        subtitle: `Dosage: ${dosage}`,
        sound: 'default',
        priority: 'high',
        badge: 1,
        // Custom data you can use when notification is tapped
        data: {
          medicationName,
          dosage,
          prescriptionId,
          type: 'medication_reminder',
          reminderTime: reminderTime.toISOString(),
        },
      },
      trigger: {
        type: 'date',
        date: reminderTime,
      },
    });

    console.log(`✅ Notification scheduled with ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return null;
  }
};


// ✅ Schedule multiple notifications (for daily reminders)
export const scheduleMultipleNotifications = async (
  medicationName,
  dosage,
  prescriptionId,
  reminderTimes  // Array of minutes before medication time
) => {
  try {
    console.log(`📅 Scheduling ${reminderTimes.length} notifications for ${medicationName}`);

    // Get prescription time
    // In your actual app, fetch this from prescription data
    const [hours, minutes] = '09:00'.split(':').map(Number);
    const medicationTime = new Date();
    medicationTime.setHours(hours, minutes, 0);

    const scheduledIds = [];

    for (let i = 0; i < reminderTimes.length; i++) {
      const reminderTime = new Date(medicationTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - reminderTimes[i]);

      const notificationId = await scheduleLocalNotification(
        medicationName,
        reminderTime,
        dosage,
        prescriptionId
      );

      if (notificationId) {
        scheduledIds.push(notificationId);
      }
    }

    console.log(`✅ Scheduled ${scheduledIds.length} notifications`);
    return scheduledIds;
  } catch (error) {
    console.error('❌ Error scheduling multiple notifications:', error);
    return [];
  }
};


// ✅ Cancel a scheduled notification
export const cancelNotification = async (notificationId) => {
  try {
    console.log(`🗑️ Cancelling notification: ${notificationId}`);
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('✅ Notification cancelled');
    return true;
  } catch (error) {
    console.error('❌ Error cancelling notification:', error);
    return false;
  }
};


// ✅ Cancel all scheduled notifications
export const cancelAllNotifications = async () => {
  try {
    console.log('🗑️ Cancelling all notifications...');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
    return true;
  } catch (error) {
    console.error('❌ Error cancelling all notifications:', error);
    return false;
  }
};


// ✅ Get all scheduled notifications
export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 Found ${notifications.length} scheduled notifications`);
    return notifications;
  } catch (error) {
    console.error('❌ Error getting scheduled notifications:', error);
    return [];
  }
};


// ✅ Test notification (for debugging)
export const sendTestNotification = async () => {
  try {
    console.log('🧪 Sending test notification...');
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Test Notification',
        body: 'This is a test medication reminder - you should see this in 5 seconds!',
        data: {
          type: 'test',
        },
      },
      trigger: { seconds: 5 }, // Show in 5 seconds
    });

    console.log('✅ Test notification scheduled for 5 seconds from now');
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
};


// ✅ Show notification immediately (for testing)
export const showImmediateNotification = async (medicationName, dosage) => {
  try {
    console.log('⚡ Showing immediate notification...');

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Medication Reminder',
        body: `Time to take ${medicationName}`,
        subtitle: `Dosage: ${dosage}`,
        data: {
          medicationName,
          dosage,
          type: 'medication_reminder',
        },
      },
      trigger: { seconds: 1 }, // Show immediately
    });

    console.log('✅ Immediate notification scheduled');
  } catch (error) {
    console.error('❌ Error showing immediate notification:', error);
  }
};