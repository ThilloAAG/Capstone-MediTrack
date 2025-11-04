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
} from "firebase/firestore";
import { db, auth } from "../src/firebase";
import * as Notifications from "expo-notifications";
import { addDays, addHours, differenceInDays } from "date-fns";

// 🔔 Notification setup (keep same)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function scheduleMedicationNotifications(prescription) {
  try {
    const { medication, name, frequency, startDate, endDate } = prescription;
    const medName = medication || name || "Medication";

    if (!startDate || !frequency) {
      console.warn("⚠️ Missing startDate or frequency, skipping notifications for:", medName);
      return;
    }

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : addDays(start, 7);
    const totalDays = differenceInDays(end, start) + 1;

    let timesPerDay = 1;
    if (frequency.includes("2")) timesPerDay = 2;
    if (frequency.includes("3")) timesPerDay = 3;
    if (frequency.includes("4")) timesPerDay = 4;

    for (let i = 0; i < totalDays; i++) {
      for (let j = 0; j < timesPerDay; j++) {
        const reminderTime = addHours(addDays(start, i), (j * 24) / timesPerDay);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "💊 Medication Reminder",
            body: `Time to take your ${medName}`,
            sound: "default",
          },
          trigger: { type: "date", date: reminderTime },
        });
      }
    }

    console.log(`✅ Scheduled ${totalDays * timesPerDay} reminders for ${medName}`);
  } catch (err) {
    console.error("Error scheduling notifications:", err);
  }
}

/** 🔹 Fetch all prescriptions (one-time) */
export const getPrescriptions = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.error("No authenticated user");
    return [];
  }

  try {
    // ✅ Match your rules
    const q = query(collection(db, `prescriptions/${user.uid}/userPrescriptions`), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("getPrescriptions error:", err);
    return [];
  }
};

/** 🔹 Add prescription */
export const addPrescription = async (prescription) => {
  const user = auth.currentUser;
  if (!user) {
    console.error("User not authenticated");
    return;
  }

  try {
    const ref = collection(db, `prescriptions/${user.uid}/userPrescriptions`);
    const docRef = await addDoc(ref, prescription);
    console.log("Prescription added:", prescription);
    await scheduleMedicationNotifications(prescription);
    return docRef;
  } catch (err) {
    console.error("Error adding prescription:", err);
  }
};

/** 🔹 Update prescription */
export const updatePrescription = async (prescriptionId, updatedData) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const ref = doc(db, `prescriptions/${user.uid}/userPrescriptions/${prescriptionId}`);
    await updateDoc(ref, updatedData);
    console.log("Prescription updated:", updatedData);
    if (updatedData.frequency || updatedData.startDate || updatedData.endDate) {
      await scheduleMedicationNotifications(updatedData);
    }
  } catch (err) {
    console.error("Error updating prescription:", err);
  }
};

/** 🔹 Delete prescription */
export const deletePrescription = async (prescriptionId) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const ref = doc(db, `prescriptions/${user.uid}/userPrescriptions/${prescriptionId}`);
    await deleteDoc(ref);
    console.log("Prescription deleted:", prescriptionId);
  } catch (err) {
    console.error("Error deleting prescription:", err);
  }
};

/** 🔹 Subscribe in real time */
export const subscribeToPrescriptions = (callback) => {
  const user = auth.currentUser;
  if (!user) return () => {};

  const q = query(collection(db, `prescriptions/${user.uid}/userPrescriptions`), orderBy("name"));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const prescriptions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(prescriptions);
    },
    (err) => {
      console.error("subscribeToPrescriptions error:", err);
      callback([]);
    }
  );
  return unsubscribe;
};
