import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../src/firebase";


// ============================================================
// DOCTOR NOTIFICATION PREFERENCES SERVICE
// ============================================================


/**
 * Structure: doctorNotificationPreferences/{doctorId}
 * Fields:
 * - urgentPatientAlerts: boolean
 * - prescriptionRenewalRequests: boolean
 * - missedDoseAlerts: boolean
 * - weeklySummary: boolean
 */


export const doctorNotificationPreferencesService = {
  /**
   * Get doctor's notification preferences
   */
  getPreferences: async (doctorId) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");


      console.log("📋 Getting notification preferences for doctor:", doctorId);


      const prefsRef = doc(db, "doctorNotificationPreferences", doctorId);
      const docSnap = await getDoc(prefsRef);


      if (!docSnap.exists()) {
        console.log("⚠️ No preferences found, creating defaults");
        // Create default preferences if they don't exist
        const defaultPrefs = {
          urgentPatientAlerts: true,
          prescriptionRenewalRequests: true,
          missedDoseAlerts: true,
          weeklySummary: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        // Auto-create on first access
        await setDoc(prefsRef, defaultPrefs);
        
        return {
          urgentPatientAlerts: true,
          prescriptionRenewalRequests: true,
          missedDoseAlerts: true,
          weeklySummary: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }


      const data = docSnap.data();
      console.log("✅ Preferences loaded:", data);


      return {
        urgentPatientAlerts: data.urgentPatientAlerts ?? true,
        prescriptionRenewalRequests: data.prescriptionRenewalRequests ?? true,
        missedDoseAlerts: data.missedDoseAlerts ?? true,
        weeklySummary: data.weeklySummary ?? true,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    } catch (error) {
      console.error("❌ Error getting preferences:", error);
      // Return defaults on error
      return {
        urgentPatientAlerts: true,
        prescriptionRenewalRequests: true,
        missedDoseAlerts: true,
        weeklySummary: true,
      };
    }
  },


  /**
   * Save all doctor notification preferences
   */
  savePreferences: async (doctorId, preferences) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");


      console.log("💾 Saving preferences for doctor:", doctorId, preferences);


      const prefsRef = doc(db, "doctorNotificationPreferences", doctorId);
      await setDoc(
        prefsRef,
        {
          urgentPatientAlerts: preferences.urgentPatientAlerts ?? true,
          prescriptionRenewalRequests:
            preferences.prescriptionRenewalRequests ?? true,
          missedDoseAlerts: preferences.missedDoseAlerts ?? true,
          weeklySummary: preferences.weeklySummary ?? true,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );


      console.log("✅ Preferences saved successfully");
    } catch (error) {
      console.error("❌ Error saving preferences:", error);
      throw error;
    }
  },


  /**
   * Update a single preference
   */
  updatePreference: async (doctorId, preferenceKey, value) => {
    try {
      if (!doctorId) throw new Error("Doctor ID is required");
      if (!preferenceKey) throw new Error("Preference key is required");


      console.log(
        `🔄 Updating ${preferenceKey} to ${value} for doctor:`,
        doctorId
      );


      const prefsRef = doc(db, "doctorNotificationPreferences", doctorId);
      
      // Try to update, if document doesn't exist, create it
      try {
        await updateDoc(prefsRef, {
          [preferenceKey]: value,
          updatedAt: serverTimestamp(),
        });
      } catch (updateError) {
        // If document doesn't exist, create it
        if (updateError.code === "not-found") {
          console.log("⚠️ Document doesn't exist, creating with default preferences");
          const defaultPrefs = {
            urgentPatientAlerts: true,
            prescriptionRenewalRequests: true,
            missedDoseAlerts: true,
            weeklySummary: true,
            [preferenceKey]: value,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(prefsRef, defaultPrefs);
        } else {
          throw updateError;
        }
      }


      console.log("✅ Preference updated successfully");
    } catch (error) {
      console.error("❌ Error updating preference:", error);
      throw error;
    }
  },


  /**
   * Check if a specific notification type is enabled
   */
  isNotificationTypeEnabled: async (doctorId, notificationType) => {
    try {
      const prefs = await doctorNotificationPreferencesService.getPreferences(
        doctorId
      );


      const keyMap = {
        urgent: "urgentPatientAlerts",
        renewal: "prescriptionRenewalRequests",
        missed: "missedDoseAlerts",
        summary: "weeklySummary",
      };


      const prefKey = keyMap[notificationType];
      if (!prefKey) {
        console.warn(`⚠️ Unknown notification type: ${notificationType}`);
        return true; // Default to enabled if unknown
      }


      const isEnabled = prefs[prefKey];
      console.log(
        `✅ ${notificationType} notification enabled: ${isEnabled}`
      );
      return isEnabled;
    } catch (error) {
      console.error("❌ Error checking notification type:", error);
      return true; // Default to enabled on error
    }
  },


  /**
   * Get current user's preferences (if they are a doctor)
   */
  getCurrentDoctorPreferences: async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user");
      }


      console.log("👨‍⚕️ Getting current doctor preferences for user:", user.uid);
      return await doctorNotificationPreferencesService.getPreferences(
        user.uid
      );
    } catch (error) {
      console.error("❌ Error getting current doctor preferences:", error);
      // Return defaults on error
      return {
        urgentPatientAlerts: true,
        prescriptionRenewalRequests: true,
        missedDoseAlerts: true,
        weeklySummary: true,
      };
    }
  },


  /**
   * Save current user's preferences (if they are a doctor)
   */
  saveCurrentDoctorPreferences: async (preferences) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user");
      }


      console.log(
        "💾 Saving current doctor preferences for user:",
        user.uid
      );
      return await doctorNotificationPreferencesService.savePreferences(
        user.uid,
        preferences
      );
    } catch (error) {
      console.error("❌ Error saving current doctor preferences:", error);
      throw error;
    }
  },
};
