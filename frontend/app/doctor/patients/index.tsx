import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../../src/firebase";

type LinkStatus = "pending" | "active" | "rejected";

type DoctorPatientLink = {
  patientId: string;
  doctorId: string;
  status: LinkStatus;
  createdAt?: any;
  acceptedAt?: any;
};

type UserProfile = {
  id: string;
  name?: string;
  email?: string;
};

type Row = {
  linkId: string;
  link: DoctorPatientLink;
  patient?: UserProfile;
  isHighRisk: boolean;
};

export default function DoctorPatientsScreen() {
  const [tab, setTab] = useState<"active" | "pending">("active");
  const [activeRows, setActiveRows] = useState<Row[]>([]);
  const [pendingRows, setPendingRows] = useState<Row[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);

  useEffect(() => {
    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) {
      router.replace("/auth/login");
      return;
    }

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
          const rows = await Promise.all(
            snap.docs.map(async (d) => {
              const link = d.data() as DoctorPatientLink;
              const linkId = d.id;

              let patient: UserProfile | undefined = undefined;
              let isHighRisk = false;

              try {
                const pSnap = await getDoc(doc(db, "users", link.patientId));
                if (pSnap.exists()) {
                  patient = { id: pSnap.id, ...(pSnap.data() as any) };
                }

                const sSnap = await getDoc(doc(db, "adherenceSummary", link.patientId));
                if (sSnap.exists()) {
                  isHighRisk = !!(sSnap.data() as any)?.highRisk;
                }
              } catch {}

              return { linkId, link, patient, isHighRisk };
            })
          );

          setActiveRows(rows);
          setLoadingActive(false);
        } catch {
          setActiveRows([]);
          setLoadingActive(false);
        }
      },
      () => {
        setActiveRows([]);
        setLoadingActive(false);
      }
    );

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
          const rows = await Promise.all(
            snap.docs.map(async (d) => {
              const link = d.data() as DoctorPatientLink;
              const linkId = d.id;

              let patient: UserProfile | undefined = undefined;
              try {
                const pSnap = await getDoc(doc(db, "users", link.patientId));
                if (pSnap.exists()) {
                  patient = { id: pSnap.id, ...(pSnap.data() as any) };
                }
              } catch {}

              return { linkId, link, patient, isHighRisk: false };
            })
          );

          setPendingRows(rows);
          setLoadingPending(false);
        } catch {
          setPendingRows([]);
          setLoadingPending(false);
        }
      },
      () => {
        setPendingRows([]);
        setLoadingPending(false);
      }
    );

    return () => {
      unsubActive();
      unsubPending();
    };
  }, []);

  const acceptRequest = async (linkId: string) => {
    try {
      await updateDoc(doc(db, "doctorPatientLinks", linkId), {
        status: "active",
        acceptedAt: serverTimestamp(),
      });
      Alert.alert("Success", "Request accepted");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to accept request");
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
            Alert.alert("Error", e?.message ?? "Failed to reject request");
          }
        },
      },
    ]);
  };

  const rows = tab === "active" ? activeRows : pendingRows;
  const loading = tab === "active" ? loadingActive : loadingPending;
  const highRiskCount = activeRows.filter((r) => r.isHighRisk).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>Patients</Text>
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              "Secure linking",
              "Patients must request you first. Use Requests to accept them."
            )
          }
          style={styles.iconBtn}
        >
          <Ionicons name="information-circle-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "active" && styles.tabBtnActive]}
          onPress={() => setTab("active")}
        >
          <Text style={[styles.tabText, tab === "active" && styles.tabTextActive]}>
            Active ({activeRows.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === "pending" && styles.tabBtnActive]}
          onPress={() => setTab("pending")}
        >
          <Text style={[styles.tabText, tab === "pending" && styles.tabTextActive]}>
            Requests ({pendingRows.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <View>
            <Text style={styles.statsLabel}>
              {tab === "active" ? "High risk patients" : "Pending requests"}
            </Text>
            <Text style={styles.statsValue}>
              {loading ? "..." : tab === "active" ? highRiskCount : pendingRows.length}
            </Text>
          </View>

          <View
            style={[
              styles.statsIcon,
              tab === "active" && highRiskCount > 0 && styles.statsIconDanger,
            ]}
          >
            <Ionicons
              name={tab === "active" ? "warning-outline" : "mail-outline"}
              size={22}
              color={tab === "active" && highRiskCount > 0 ? "#dc2626" : "#13a4ec"}
            />
          </View>
        </View>

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
              const name = p?.name ?? "Unnamed patient";
              const email = p?.email ?? r.link.patientId;

              return (
                <View
                  key={r.linkId}
                  style={[styles.row, idx !== rows.length - 1 && styles.rowDivider]}
                >
                  <TouchableOpacity
                    style={styles.rowLeft}
                    activeOpacity={0.85}
                    onPress={() =>
                      tab === "active" &&
                      router.push({
                        pathname: "/doctor/patients/[id]",
                        params: { id: r.link.patientId },
                      })
                    }
                    disabled={tab !== "active"}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.nameLine}>
                        <Text style={styles.name}>{name}</Text>
                        {tab === "active" && r.isHighRisk && (
                          <View style={styles.riskBadge}>
                            <Text style={styles.riskBadgeText}>Risk</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.sub}>{email}</Text>
                    </View>

                    {tab === "active" && (
                      <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                    )}
                  </TouchableOpacity>

                  {tab === "pending" && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.smallBtn, styles.acceptBtn]}
                        onPress={() => acceptRequest(r.linkId)}
                      >
                        <Text style={styles.smallBtnText}>Accept</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.smallBtn, styles.rejectBtn]}
                        onPress={() => rejectRequest(r.linkId)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
  statsIconDanger: { backgroundColor: "#fee2e2" },
  listCard: {
    backgroundColor: "#fff",
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
  nameLine: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name: { fontSize: 15, fontWeight: "900", color: "#111827" },
  sub: { marginTop: 2, fontSize: 12, fontWeight: "700", color: "#64748b" },
  riskBadge: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  riskBadgeText: { fontSize: 10, fontWeight: "900", color: "#dc2626" },
  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  acceptBtn: { backgroundColor: "#13a4ec", borderColor: "#13a4ec" },
  rejectBtn: { backgroundColor: "#fff", borderColor: "#fecaca" },
  smallBtnText: { fontWeight: "900", color: "#fff" },
  empty: { paddingVertical: 30, alignItems: "center", paddingHorizontal: 14 },
  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 18,
  },
});