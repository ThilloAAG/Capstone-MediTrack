import * as Notifications from 'expo-notifications';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';

// ✅ Register device for push notifications
export const registerForPushNotifications = async () => {
  try {
    console.log('📱 Requesting notification permissions...');
    
    // Request permission from user
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status !== 'granted') {
      console.warn('⚠️ Permission denied for notifications');
      return null;
    }

    console.log('✅ Permission granted');

    // Get unique device token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('✅ Push token received:', token);

    // Save token to Firestore so backend can send notifications
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      await setDoc(
        doc(db, `users/${user.uid}`),
        {
          pushToken: token,
          deviceName: Notifications.getPermissionsAsync ? 'mobile' : 'web',
          updatedAt: new Date(),
        },
        { merge: true }
      );
      console.log('✅ Push token saved to Firestore');
    }

    return token;
  } catch (error) {
    console.error('❌ Error registering for notifications:', error);
    return null;
  }
};


// ✅ Setup notification listeners (called once at app start)
export const setupNotificationListeners = () => {
  console.log('🔔 Setting up notification listeners...');

  // Handle notifications when app is in FOREGROUND
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('📨 Notification received (app in foreground):', notification);
      
      // You can show a custom alert or handle in-app notification here
      const { title, body } = notification.request.content;
      console.log(`Title: ${title}, Body: ${body}`);
    }
  );

  // Handle notification TAPS (when user taps notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('👆 User tapped notification:', response);
      
      const notification = response.notification;
      const data = notification.request.content.data;
      
      // Navigate to medication details or app screen
      console.log('Medication:', data.medicationName);
      
      // Example: Navigate to medication details
      // router.push(`/medication/${data.medicationName}`);
    }
  );

  // Cleanup function
  return () => {
    console.log('🧹 Removing notification listeners...');
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};


// ✅ Update token when user logs in
export const updateNotificationToken = async () => {
  const token = await registerForPushNotifications();
  return token;
};