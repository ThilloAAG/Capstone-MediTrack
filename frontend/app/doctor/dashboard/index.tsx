import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { auth, db } from "../../../src/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

type PatientProfile = {
  id: string;
  name: string;
  email: string;
  highRisk: boolean;
  highRiskPrescriptionCount: number;
  worstMissedDoses7d: number;
};

type Link = {
  patientId: string;
  doctorId: string;
  status: "pending" | "active" | "rejected";
  acceptedAt?: any;
};

function pickNonEmptyString(...values: any[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

export default function DoctorDashboardScreen() {
  const router = useRouter();

  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [activeRx, setActiveRx] = useState(0);
  const [loadingRx, setLoadingRx] = useState(true);

  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) return;

    const qLinks = query(
      collection(db, "doctorPatientLinks"),
      where("doctorId", "==", doctorUid),
      where("status", "==", "active"),
      orderBy("acceptedAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(
      qLinks,
      async (snap) => {
        try {
          if (snap.empty) {
            setPatients([]);
            setLoadingPatients(false);
            return;
          }

          const links = snap.docs.map((d) => d.data() as Link);

          const profiles = await Promise.all(
            links.map(async (l) => {
              try {
                const [userSnap, adherenceSnap] = await Promise.all([
                  getDoc(doc(db, "users", l.patientId)),
                  getDoc(doc(db, "adherenceSummary", l.patientId)),
                ]);

                const userData = userSnap.exists() ? (userSnap.data() as any) : {};
                const adherenceData = adherenceSnap.exists()
                  ? (adherenceSnap.data() as any)
                  : {};

                const displayName =
                  pickNonEmptyString(userData?.name, userData?.fullName) ||
                  "Unnamed patient";

                const displayEmail =
                  pickNonEmptyString(userData?.email) || "Email unavailable";

                return {
                  id: l.patientId,
                  name: displayName,
                  email: displayEmail,
                  highRisk: !!adherenceData?.highRisk,
                  highRiskPrescriptionCount: Number(
                    adherenceData?.highRiskPrescriptionCount ?? 0
                  ),
                  worstMissedDoses7d: Number(
                    adherenceData?.worstMissedDoses7d ?? 0
                  ),
                } as PatientProfile;
              } catch {
                return {
                  id: l.patientId,
                  name: "Unknown patient",
                  email: "Email unavailable",
                  highRisk: false,
                  highRiskPrescriptionCount: 0,
                  worstMissedDoses7d: 0,
                } as PatientProfile;
              }
            })
          );

          setPatients(profiles);
          setLoadingPatients(false);
        } catch (e) {
          console.log("Dashboard patients mapping error:", e);
          setPatients([]);
          setLoadingPatients(false);
        }
      },
      (err) => {
        console.log("Dashboard patients fetch error:", err);
        setPatients([]);
        setLoadingPatients(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const doctorUid = auth.currentUser?.uid;
    if (!doctorUid) return;

    const qPending = query(
      collection(db, "doctorPatientLinks"),
      where("doctorId", "==", doctorUid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(
      qPending,
      (snap) => {
        setPendingRequests(snap.size);
      },
      (err) => {
        console.log("Dashboard pending requests error:", err);
        setPendingRequests(0);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setLoadingRx(true);

        if (!patients.length) {
          setActiveRx(0);
          return;
        }

        const counts = await Promise.all(
          patients.map(async (p) => {
            try {
              const rxSnap = await getDocs(
                query(
                  collection(db, "prescriptions", p.id, "userPrescriptions"),
                  limit(500)
                )
              );

              return rxSnap.docs.filter((docSnap) => {
                const data = docSnap.data() as any;
                return String(data?.status ?? "").toLowerCase() === "active";
              }).length;
            } catch (e) {
              console.log("Rx count error for patient:", p.id, e);
              return 0;
            }
          })
        );

        const total = counts.reduce((sum, n) => sum + n, 0);
        setActiveRx(total);
      } catch (e) {
        console.log("Dashboard activeRx error:", e);
        setActiveRx(0);
      } finally {
        setLoadingRx(false);
      }
    };

    run();
  }, [patients]);

  const totalPatients = patients.length;

  const highRiskCount = useMemo(() => {
    return patients.filter((p) => p.highRisk).length;
  }, [patients]);

  const goPatients = () => router.push("/doctor/patients");
  const goProfile = () => router.push("/doctor/settings");
  const goRequests = () => router.push("/doctor/patients/requests");

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={goRequests}
            activeOpacity={0.85}
          >
            <View style={{ position: "relative" }}>
              <Ionicons
                name={
                  pendingRequests > 0 ? "mail-unread-outline" : "mail-outline"
                }
                size={22}
                color="#111827"
              />
              {pendingRequests > 0 && (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeDotText}>
                    {pendingRequests > 9 ? "9+" : pendingRequests}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Doctor Dashboard</Text>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={goProfile}
            activeOpacity={0.85}
          >
            <Ionicons name="person-outline" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View>
                <Text style={styles.heroEyebrow}>Overview</Text>
                <Text style={styles.heroTitle}>Patient adherence at a glance</Text>
              </View>

              {highRiskCount > 0 && (
                <View style={styles.heroAlertPill}>
                  <Ionicons name="warning" size={14} color="#dc2626" />
                  <Text style={styles.heroAlertText}>
                    {highRiskCount} high risk
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.heroSubtitle}>
              Monitor active patients, active prescriptions, and patients who
              need rapid follow-up.
            </Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#dbeafe" }]}>
                <Ionicons name="people" size={18} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>
                {loadingPatients ? "…" : totalPatients}
              </Text>
              <Text style={styles.statLabel}>Active Patients</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="medical" size={18} color="#0284c7" />
              </View>
              <Text style={styles.statValue}>{loadingRx ? "…" : activeRx}</Text>
              <Text style={styles.statLabel}>Active Prescriptions</Text>
            </View>

            <View
              style={[
                styles.statCard,
                highRiskCount > 0 && styles.statCardDanger,
              ]}
            >
              <View
                style={[
                  styles.statIcon,
                  highRiskCount > 0
                    ? { backgroundColor: "#fee2e2" }
                    : { backgroundColor: "#ecfdf5" },
                ]}
              >
                <Ionicons
                  name={highRiskCount > 0 ? "alert-circle" : "shield-checkmark"}
                  size={18}
                  color={highRiskCount > 0 ? "#dc2626" : "#16a34a"}
                />
              </View>
              <Text
                style={[
                  styles.statValue,
                  highRiskCount > 0 && styles.statValueDanger,
                ]}
              >
                {loadingPatients ? "…" : highRiskCount}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  highRiskCount > 0 && styles.statLabelDanger,
                ]}
              >
                High Risk
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={goPatients}
              activeOpacity={0.85}
            >
              <Ionicons name="people-outline" size={18} color="#ffffff" />
              <Text style={styles.primaryActionText}>View Patients</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={goRequests}
              activeOpacity={0.85}
            >
              <View style={{ position: "relative", flexDirection: "row" }}>
                <Ionicons name="mail-outline" size={18} color="#0f766e" />
                {pendingRequests > 0 && (
                  <View style={styles.badgeDotQuick}>
                    <Text style={styles.badgeDotText}>
                      {pendingRequests > 9 ? "9+" : pendingRequests}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.secondaryActionText}>Requests</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Patients</Text>
            <TouchableOpacity onPress={goPatients} activeOpacity={0.85}>
              <Text style={styles.linkText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listCard}>
            {loadingPatients ? (
              <View style={{ paddingVertical: 26 }}>
                <ActivityIndicator size="large" color="#13a4ec" />
              </View>
            ) : patients.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={40} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No active patients</Text>
                <Text style={styles.emptyText}>
                  Patients must send you a request, then you accept it in
                  Requests.
                </Text>
              </View>
            ) : (
              patients.slice(0, 4).map((p, index) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.patientRow,
                    index !== Math.min(3, patients.length - 1) &&
                      styles.rowDivider,
                  ]}
                  onPress={() => router.push(`/doctor/patients/${p.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(p.name?.[0] || "P").toUpperCase()}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.patientName}>{p.name}</Text>

                      {p.highRisk ? (
                        <View style={styles.riskBadge}>
                          <Ionicons name="warning" size={11} color="#dc2626" />
                          <Text style={styles.riskBadgeText}>RISK</Text>
                        </View>
                      ) : (
                        <View style={styles.safeBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={11}
                            color="#15803d"
                          />
                          <Text style={styles.safeBadgeText}>STABLE</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.patientMeta}>{p.email}</Text>

                    {p.highRisk && (
                      <Text style={styles.patientRiskHint}>
                        {p.highRiskPrescriptionCount} prescription
                        {p.highRiskPrescriptionCount === 1 ? "" : "s"} flagged
                        • worst missed last 7d: {p.worstMissedDoses7d}
                      </Text>
                    )}
                  </View>

                  <View style={styles.rightCol}>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#cbd5e1"
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  wrapper: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f6f7f8",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },

  main: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0284c7",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },
  heroSubtitle: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
    color: "#64748b",
  },
  heroAlertPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroAlertText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#dc2626",
  },

  sectionHeader: {
    marginTop: 4,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0284c7",
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statCardDanger: {
    backgroundColor: "#fff7f7",
    borderColor: "#fecaca",
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },
  statValueDanger: {
    color: "#dc2626",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginTop: 2,
  },
  statLabelDanger: {
    color: "#b91c1c",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  primaryAction: {
    flex: 1,
    height: 50,
    borderRadius: 22,
    backgroundColor: "#0284c7",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryAction: {
    flex: 1,
    height: 50,
    borderRadius: 22,
    backgroundColor: "#f0fdfa",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "#99f6e4",
  },
  secondaryActionText: {
    color: "#0f766e",
    fontSize: 14,
    fontWeight: "900",
  },

  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 30,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#eef6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  avatarText: {
    fontWeight: "900",
    color: "#2563eb",
    fontSize: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  patientName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  patientMeta: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 3,
  },
  patientRiskHint: {
    fontSize: 11,
    fontWeight: "800",
    color: "#b91c1c",
    marginTop: 5,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 8,
  },

  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#dc2626",
  },

  safeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
  },
  safeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#15803d",
  },

  emptyState: {
    paddingVertical: 28,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
    fontWeight: "900",
    color: "#111827",
    fontSize: 15,
  },
  emptyText: {
    marginTop: 6,
    color: "#6b7280",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
    fontSize: 12,
  },

  badgeDot: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeDotQuick: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeDotText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
});