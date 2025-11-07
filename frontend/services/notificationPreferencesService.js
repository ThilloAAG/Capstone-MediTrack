import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../src/firebase";

// ============================================================
// NOTIFICATION PREFERENCES SERVICE
// ============================================================

/**
 * Get all notification preferences for a user
 * Structure: notificationPreferences/{uid}/preferences/{prefId}
 */
export const getNotificationPreferences = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error("❌ No authenticated user");
    return [];
  }

  try {
    const q = query(
      collection(db, `notificationPreferences/${user.uid}/preferences`),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("❌ Error in getNotificationPreferences:", err);
    return [];
  }
};

/**
 * Subscribe to notification preferences in real-time
 */
export const subscribeToNotificationPreferences = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, `notificationPreferences/${user.uid}/preferences`),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const preferences = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(`✅ Preferences updated: ${preferences.length} items`);
        callback(preferences);
      },
      (err) => {
        console.error("❌ Preferences listener error:", err);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error("❌ Error in subscribeToNotificationPreferences:", err);
    return () => {};
  }
};

/**
 * Add a new notification preference
 * Params:
 * - prescriptionId: ID of the prescription
 * - medicationName: Name of medication
 * - reminderTimes: Array of reminder times (e.g., ["30 minutes before", "1 hour before", "at time"])
 */
export const addNotificationPreference = async (preferenceData) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Validate required fields
    if (!preferenceData.prescriptionId || !preferenceData.medicationName || !preferenceData.reminderTimes) {
      throw new Error("Missing required fields: prescriptionId, medicationName, reminderTimes");
    }

    const preferencesRef = collection(
      db,
      `notificationPreferences/${user.uid}/preferences`
    );

    const dataToSave = {
      ...preferenceData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      isActive: true,
    };

    console.log("📝 Adding notification preference:", dataToSave);
    const docRef = await addDoc(preferencesRef, dataToSave);

    console.log("✅ Preference added with ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("❌ Error in addNotificationPreference:", error);
    throw error;
  }
};

/**
 * Update a notification preference
 */
export const updateNotificationPreference = async (preferenceId, updatedData) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const preferenceRef = doc(
      db,
      `notificationPreferences/${user.uid}/preferences/${preferenceId}`
    );

    const updatePayload = {
      ...updatedData,
      updatedAt: serverTimestamp(),
    };

    console.log("🔄 Updating preference:", preferenceId, updatePayload);
    await updateDoc(preferenceRef, updatePayload);

    console.log("✅ Preference updated");
  } catch (error) {
    console.error("❌ Error in updateNotificationPreference:", error);
    throw error;
  }
};

/**
 * Delete a notification preference
 */
export const deleteNotificationPreference = async (preferenceId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const preferenceRef = doc(
      db,
      `notificationPreferences/${user.uid}/preferences/${preferenceId}`
    );

    console.log("🗑️ Deleting preference:", preferenceId);
    await deleteDoc(preferenceRef);

    console.log("✅ Preference deleted");
  } catch (error) {
    console.error("❌ Error in deleteNotificationPreference:", error);
    throw error;
  }
};

/**
 * Get preferences for a specific prescription
 */
export const getPreferencesByPrescription = async (prescriptionId) => {
  try {
    const allPreferences = await getNotificationPreferences();
    return allPreferences.filter((p) => p.prescriptionId === prescriptionId);
  } catch (err) {
    console.error("❌ Error getting preferences by prescription:", err);
    return [];
  }
};

/**
 * Toggle preference on/off
 */
export const toggleNotificationPreference = async (preferenceId, isActive) => {
  try {
    await updateNotificationPreference(preferenceId, { isActive });
    console.log(`✅ Preference ${isActive ? "enabled" : "disabled"}`);
  } catch (err) {
    console.error("❌ Error toggling preference:", err);
    throw err;
  }
};