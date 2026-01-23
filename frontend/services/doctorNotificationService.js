import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../src/firebase";
import { doctorNotificationPreferencesService } from "./doctorNotificationPreferencesService";

export const doctorNotificationService = {
  /**
   * Fetch all notifications for a doctor
   */
  fetchNotifications: async (doctorId) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");

      console.log("📬 Fetching all notifications for doctor:", doctorId);

      const notificationsRef = collection(db, "doctorNotifications");
      const q = query(
        notificationsRef,
        where("doctorId", "==", doctorId),
        where("isDismissed", "==", false)
      );

      const snapshot = await getDocs(q);
      console.log("✅ Notifications found:", snapshot.size);

      const notifications = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      });

      return notifications.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      throw error;
    }
  },

  /**
   * Fetch notifications by category
   */
  fetchNotificationsByCategory: async (doctorId, category) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");
      if (!category) throw new Error("Category is required");

      console.log(
        `📬 Fetching ${category} notifications for doctor:`,
        doctorId
      );

      const notificationsRef = collection(db, "doctorNotifications");
      const q = query(
        notificationsRef,
        where("doctorId", "==", doctorId),
        where("category", "==", category),
        where("isDismissed", "==", false)
      );

      const snapshot = await getDocs(q);
      console.log(`✅ ${category} notifications found:`, snapshot.size);

      return snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error(
        `❌ Error fetching ${category} notifications:`,
        error
      );
      throw error;
    }
  },

  /**
   * Create a notification (checks preferences first)
   */
  createNotification: async (notificationData) => {
    try {
      if (!notificationData.doctorId) throw new Error("Doctor ID is required");
      if (!notificationData.title) throw new Error("Title is required");
      if (!notificationData.category) throw new Error("Category is required");

      console.log("📝 Creating notification:", notificationData);

      // Check if notification type is enabled
      const notificationType = notificationData.type || notificationData.category;
      const isEnabled =
        await doctorNotificationPreferencesService.isNotificationTypeEnabled(
          notificationData.doctorId,
          notificationType
        );

      if (!isEnabled) {
        console.log(`⚠️ Notification type ${notificationType} is disabled, skipping`);
        return null;
      }

      const notificationsRef = collection(db, "doctorNotifications");
      const docRef = await addDoc(notificationsRef, {
        ...notificationData,
        isRead: false,
        isDismissed: false,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Notification created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating notification:", error);
      throw error;
    }
  },

  /**
   * Create missed dose notification (checks preferences)
   */
  createMissedDoseNotification: async (doctorId, patientId, medicationData) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");
      if (!patientId) throw new Error("Patient ID is required");
      if (!medicationData) throw new Error("Medication data is required");

      console.log("💊 Creating missed dose notification:", {
        doctorId,
        patientId,
        medication: medicationData.medicationName,
      });

      // Check if missed dose alerts are enabled
      const isEnabled =
        await doctorNotificationPreferencesService.isNotificationTypeEnabled(
          doctorId,
          "missed"
        );

      if (!isEnabled) {
        console.log(
          "⚠️ Missed dose alerts disabled, notification not created"
        );
        return null;
      }

      const notificationsRef = collection(db, "doctorNotifications");
      const docRef = await addDoc(notificationsRef, {
        doctorId,
        category: "alert",
        type: "missedDose",
        title: `Missed Dose Alert: ${medicationData.medicationName}`,
        description: `Patient missed their ${medicationData.medicationName} dose at ${medicationData.scheduledTime}`,
        patientId,
        patientName: medicationData.patientName,
        medicationName: medicationData.medicationName,
        scheduledTime: medicationData.scheduledTime,
        missedTime: new Date(),
        dosage: medicationData.dosage,
        isRead: false,
        isDismissed: false,
        createdAt: serverTimestamp(),
      });

      console.log("✅ Missed dose notification created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating missed dose notification:", error);
      throw error;
    }
  },

  /**
   * Mark single notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      if (!notificationId) throw new Error("Notification ID is required");

      console.log("👁️ Marking notification as read:", notificationId);

      const notificationRef = doc(db, "doctorNotifications", notificationId);
      await updateDoc(notificationRef, {
        isRead: true,
        readAt: serverTimestamp(),
      });

      console.log("✅ Marked notification as read:", notificationId);
    } catch (error) {
      console.error("❌ Error marking as read:", error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (doctorId) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");

      console.log("👁️ Marking all as read for doctor:", doctorId);

      const notificationsRef = collection(db, "doctorNotifications");
      const q = query(
        notificationsRef,
        where("doctorId", "==", doctorId),
        where("isRead", "==", false),
        where("isDismissed", "==", false)
      );

      const snapshot = await getDocs(q);
      console.log("📬 Notifications to mark as read:", snapshot.size);

      const updates = snapshot.docs.map((doc) =>
        updateDoc(doc.ref, {
          isRead: true,
          readAt: serverTimestamp(),
        })
      );

      await Promise.all(updates);
      console.log("✅ All notifications marked as read");
    } catch (error) {
      console.error("❌ Error marking all as read:", error);
      throw error;
    }
  },

  /**
   * Dismiss notification
   */
  dismissNotification: async (notificationId) => {
    try {
      if (!notificationId) throw new Error("Notification ID is required");

      console.log("🗑️ Dismissing notification:", notificationId);

      const notificationRef = doc(db, "doctorNotifications", notificationId);
      await updateDoc(notificationRef, {
        isDismissed: true,
        dismissedAt: serverTimestamp(),
      });

      console.log("✅ Dismissed notification:", notificationId);
    } catch (error) {
      console.error("❌ Error dismissing notification:", error);
      throw error;
    }
  },

  /**
   * Get unread count
   */
  getUnreadCount: async (doctorId) => {
    try {
      if (!doctorId) {
        console.warn("⚠️ No doctorId provided");
        return 0;
      }

      console.log("🔔 Getting unread count for doctor:", doctorId);

      const notificationsRef = collection(db, "doctorNotifications");
      const q = query(
        notificationsRef,
        where("doctorId", "==", doctorId),
        where("isRead", "==", false),
        where("isDismissed", "==", false)
      );

      const snapshot = await getDocs(q);
      const count = snapshot.size;
      console.log("✅ Unread count result:", count);
      return count;
    } catch (error) {
      console.error("❌ Error in getUnreadCount:", error);
      return 0;
    }
  },

  /**
   * Get notification details
   */
  getNotificationDetails: async (notificationId) => {
    try {
      if (!notificationId)
        throw new Error("Notification ID is required");

      const notificationRef = doc(db, "doctorNotifications", notificationId);
      const docSnap = await getDoc(notificationRef);

      if (!docSnap.exists()) {
        throw new Error("Notification not found");
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    } catch (error) {
      console.error("❌ Error getting notification details:", error);
      throw error;
    }
  },
};
