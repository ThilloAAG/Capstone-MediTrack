import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(getApp(), "northamerica-northeast1");

export const sendEmergencyAlert = async ({ doctorId, message = "" }) => {
  try {
    const fn = httpsCallable(functions, "sendEmergencyAlert");
    const res = await fn({ doctorId, message });

    return {
      success: true,
      ...res.data,
    };
  } catch (err) {
    console.error("sendEmergencyAlert error:", err);
    return {
      success: false,
      error: err?.message || "Failed to send emergency alert",
    };
  }
};
