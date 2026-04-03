import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../src/firebase";

const functions = getFunctions(getApp(), "northamerica-northeast1");

const toJsDate = (value) => {
  if (!value) return new Date();
  if (typeof value?.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

export const doctorNotificationService = {
  fetchNotifications: async (doctorId) => {
    if (!doctorId) throw new Error("Doctor ID is required");

    const notificationsRef = collection(db, "doctorNotifications");
    const q = query(
      notificationsRef,
      where("doctorId", "==", doctorId),
      where("isDismissed", "==", false)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: toJsDate(data.createdAt),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  fetchNotificationsByCategory: async (doctorId, category) => {
    if (!doctorId) throw new Error("Doctor ID is required");
    if (!category) throw new Error("Category is required");

    const notificationsRef = collection(db, "doctorNotifications");
    const q = query(
      notificationsRef,
      where("doctorId", "==", doctorId),
      where("category", "==", category),
      where("isDismissed", "==", false)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          createdAt: toJsDate(data.createdAt),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  createNotification: async (notificationData) => {
    const fn = httpsCallable(functions, "createDoctorNotification");
    const res = await fn(notificationData);
    return res.data;
  },

  createMissedDoseNotification: async (doctorId, patientId, medicationData) => {
    const fn = httpsCallable(functions, "createMissedDoseAlert");
    const res = await fn({
      doctorId,
      patientId,
      medicationName: medicationData?.medicationName || "",
      dosage: medicationData?.dosage || "",
      scheduledTime: medicationData?.scheduledTime || "",
      patientName: medicationData?.patientName || "",
    });
    return res.data;
  },

  markAsRead: async (notificationId) => {
    if (!notificationId) throw new Error("Notification ID is required");

    const notificationRef = doc(db, "doctorNotifications", notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });
  },

  markAllAsRead: async (doctorId) => {
    if (!doctorId) throw new Error("Doctor ID is required");

    const notificationsRef = collection(db, "doctorNotifications");
    const q = query(
      notificationsRef,
      where("doctorId", "==", doctorId),
      where("isRead", "==", false),
      where("isDismissed", "==", false)
    );

    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map((d) =>
        updateDoc(d.ref, {
          isRead: true,
          readAt: serverTimestamp(),
        })
      )
    );
  },

  dismissNotification: async (notificationId) => {
    if (!notificationId) throw new Error("Notification ID is required");

    const notificationRef = doc(db, "doctorNotifications", notificationId);
    await updateDoc(notificationRef, {
      isDismissed: true,
      dismissedAt: serverTimestamp(),
    });
  },

  getUnreadCount: async (doctorId) => {
    if (!doctorId) return 0;

    const notificationsRef = collection(db, "doctorNotifications");
    const q = query(
      notificationsRef,
      where("doctorId", "==", doctorId),
      where("isRead", "==", false),
      where("isDismissed", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  getNotificationDetails: async (notificationId) => {
    if (!notificationId) throw new Error("Notification ID is required");

    const notificationRef = doc(db, "doctorNotifications", notificationId);
    const docSnap = await getDoc(notificationRef);

    if (!docSnap.exists()) {
      throw new Error("Notification not found");
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: toJsDate(data.createdAt),
    };
  },
};
