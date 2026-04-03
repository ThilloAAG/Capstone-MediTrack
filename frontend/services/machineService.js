// frontend/services/machineService.js
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions(getApp(), "northamerica-northeast1");

/**
 * @param {{
 *   userId: string;
 *   machineId?: string | null;
 *   prescriptionId?: string | null;
 *   immediate?: boolean;
 *   meta?: Record<string, any>;
 * }} params
 */
export const sendDispenseCommand = async ({
  userId,
  machineId = null,
  prescriptionId = null,
  immediate = true,
  meta = {},
}) => {
  try {
    const fn = httpsCallable(functions, "requestDispenseNow");

    const res = await fn({
      userId,
      machineId,
      prescriptionId,
      immediate: !!immediate,
      meta,
    });

    return {
      success: true,
      ...res.data,
    };
  } catch (err) {
    console.error("sendDispenseCommand error:", err);
    return {
      success: false,
      error: err?.message || "Failed to create dispense command",
    };
  }
};
