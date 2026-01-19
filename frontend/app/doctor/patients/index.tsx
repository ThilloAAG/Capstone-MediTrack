// app/doctor/patients/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { auth, db } from "../../../src/firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

type LinkStatus = "pending" | "active" | "rejected";

type DoctorPatientLink = {
  patientId: string;
  doctorId: string;
  status: LinkStatus;
  createdAt?: Timestamp;
  acceptedAt?: Timestamp | null;
};

type UserProfile = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

type Row = {
  linkId: string;
  link: DoctorPatientLink;
  patient?: UserProfile;
};

export default function DoctorPatientsScreen() {
  const [tab, setTab] = useState<"active" | "pending">("active");

  const [activeRows, setActiveRows] = useState<Row[]>([]);
  const [pendingRows, setPendingRows] = useState<Row[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);

  const doctorUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!doctorUid) {
      router.replace("/auth/login");
      return;
    }

    // Active links
    const qActive = query(
      collection(db, "doctorPatientLinks"),
      where("doctorId", "==", doctorUid),
      where("status", "==", "active"),
      orderBy("acceptedAt", "desc")
    );

    const unsubActive = onSnapshot(
      qActive,
      async (snap) => {
        try {
          const rows: Row[] = await Promise.all(
            snap.docs.map(async (d) => {
              const link = d.data() as DoctorPatientLink;
              const linkId = d.id;

              // fetch patient profile
              let patient: UserProfile | undefined = undefined;
              try {
                const pSnap = await getDoc(doc(db, "users", link.patientId));
                if (pSnap.exists()) {
                  patient = { id: pSnap.id, ...(pSnap.data() as any) };
                }
              } catch {}

              return { linkId, link, patient };
            })
          );

          setActiveRows(rows);
        } catch (e) {
          console.log("Active links error:", e);
          setActiveRows([]);
        } finally {
          setLoadingActive(false);
        }
      },
      (err) => {
        console.log("Active links fetch error:", err);
        setActiveRows([]);
        setLoadingActive(false);
      }
    );

    // Pending links
    const qPending = query(
      collection(db, "doctorPatientLinks"),
      where("doctorId", "==", doctorUid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubPending = onSnapshot(
      qPending,
      async (snap) => {
        try {
          const rows: Row[] = await Promise.all(
            snap.docs.map(async (d) => {
              const link = d.data() as DoctorPatientLink;
              const linkId = d.id;

              // fetch patient profile
              let patient: UserProfile | undefined = undefined;
              try {
                const pSnap = await getDoc(doc(db, "users", link.patientId));
                if (pSnap.exists()) {
                  patient = { id: pSnap.id, ...(pSnap.data() as any) };
                }
              } catch {}

              return { linkId, link, patient };
            })
          );

          setPendingRows(rows);
        } catch (e) {
          console.log("Pending links error:", e);
          setPendingRows([]);
        } finally {
          setLoadingPending(false);
        }
      },
      (err) => {
        console.log("Pending links fetch error:", err);
        setPendingRows([]);
        setLoadingPending(false);
      }
    );

    return () => {
      unsubActive();
      unsubPending();
    };
  }, [doctorUid]);

  const totalActive = activeRows.length;
  const totalPending = pendingRows.length;

  const acceptRequest = async (linkId: string) => {
    try {
      await updateDoc(doc(db, "doctorPatientLinks", linkId), {
        status: "active",
        acceptedAt: serverTimestamp(),
      });
      Alert.alert("Success", "Request accepted ✅");
    } catch (e: any) {
      console.log("Accept error:", e);
      Alert.alert("Error", e?.message || "Failed to accept request");
    }
  };

  const rejectRequest = async (linkId: string) => {
    Alert.alert("Reject request", "Reject this patient request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "doctorPatientLinks", linkId), {
              status: "rejected",
            });
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to reject request");
          }
        },
      },
    ]);
  };

  const openPatient = (patientId: string) => {
    router.push(`/doctor/patients/${patientId}`);
  };

  const rows = tab === "active" ? activeRows : pendingRows;
  const loading = tab === "active" ? loadingActive : loadingPending;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Patients</Text>

          {/* Right */}
          <View style={styles.headerRight}>
            {/* In this new secure model, doctor does NOT add patients */}
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Secure linking",
                  "Patients must request you first. Check Requests tab to accept."
                )
              }
              style={styles.iconBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="information-circle-outline" size={22} color="#111827" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "active" && styles.tabBtnActive]}
            onPress={() => setTab("active")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === "active" && styles.tabTextActive]}>
              Active ({totalActive})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, tab === "pending" && styles.tabBtnActive]}
            onPress={() => setTab("pending")}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, tab === "pending" && styles.tabTextActive]}>
              Requests ({totalPending})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <View style={styles.statsCard}>
            <View>
              <Text style={styles.statsLabel}>
                {tab === "active" ? "Total active patients" : "Pending requests"}
              </Text>
              <Text style={styles.statsValue}>{loading ? "…" : rows.length}</Text>
            </View>
            <View style={styles.statsIcon}>
              <Ionicons name={tab === "active" ? "people" : "mail"} size={22} color="#13a4ec" />
            </View>
          </View>

          {/* List */}
          <View style={styles.listCard}>
            {loading ? (
              <View style={{ paddingVertical: 26 }}>
                <ActivityIndicator size="large" color="#13a4ec" />
              </View>
            ) : rows.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons
                  name={tab === "active" ? "people-outline" : "mail-open-outline"}
                  size={52}
                  color="#94a3b8"
                />
                <Text style={styles.emptyTitle}>
                  {tab === "active" ? "No active patients yet" : "No requests yet"}
                </Text>
                <Text style={styles.emptyText}>
                  {tab === "active"
                    ? "Once a patient sends you a request and you accept, they will appear here."
                    : "Patients will appear here after they add you from their app."}
                </Text>
              </View>
            ) : (
              rows.map((r, idx) => {
                const p = r.patient;
                const name = p?.name || "Unnamed patient";
                const email = p?.email || r.link.patientId;

                return (
                  <View
                    key={r.linkId}
                    style={[styles.row, idx !== rows.length - 1 && styles.rowDivider]}
                  >
                    <TouchableOpacity
                      style={styles.rowLeft}
                      activeOpacity={0.85}
                      onPress={() => openPatient(r.link.patientId)}
                      disabled={tab !== "active"} // only navigate for active
                    >
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{(name?.[0] || "P").toUpperCase()}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{name}</Text>
                        <Text style={styles.sub}>{email}</Text>
                      </View>

                      {tab === "active" && <Ionicons name="chevron-forward" size={18} color="#94a3b8" />}
                    </TouchableOpacity>

                    {tab === "pending" && (
                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[styles.smallBtn, styles.acceptBtn]}
                          onPress={() => acceptRequest(r.linkId)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.smallBtnText}>Accept</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.smallBtn, styles.rejectBtn]}
                          onPress={() => rejectRequest(r.linkId)}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.smallBtnText, { color: "#ef4444" }]}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  wrapper: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 6 },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabBtnActive: { borderColor: "#13a4ec" },
  tabText: { fontWeight: "900", color: "#64748b" },
  tabTextActive: { color: "#13a4ec" },

  main: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsLabel: { fontSize: 12, fontWeight: "800", color: "#64748b" },
  statsValue: { marginTop: 4, fontSize: 24, fontWeight: "900", color: "#111827" },
  statsIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "#e3f5ff",
    alignItems: "center",
    justifyContent: "center",
  },

  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  row: { paddingHorizontal: 14, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },

  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 16, fontWeight: "900", color: "#13a4ec" },

  name: { fontSize: 15, fontWeight: "900", color: "#111827" },
  sub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#64748b" },

  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  acceptBtn: { backgroundColor: "#13a4ec", borderColor: "#13a4ec" },
  rejectBtn: { backgroundColor: "#ffffff", borderColor: "#fecaca" },
  smallBtnText: { fontWeight: "900", color: "#ffffff" },

  empty: { paddingVertical: 30, alignItems: "center", paddingHorizontal: 14 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
  emptyText: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#64748b", textAlign: "center", lineHeight: 18 },
});
