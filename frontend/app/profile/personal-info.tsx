import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Animated,
  AccessibilityInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getUserProfile, updateUserProfile } from "../../services/profileService";
import { auth } from "../../src/firebase";
import avatarPlaceholder from "../../assets/images/avatar-placeholder.png"; 


/** Types */
type UserProfile = {
  fullName: string;
  givenName?: string;
  familyName?: string;
  email: string;
  phone?: string;
  dob?: string; // YYYY-MM-DD or display string
  bloodType?: string;
  emergencyContacts?: EmergencyContact[];
};

type EmergencyContact = {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  relation: string;
};

/** Helper */
const RELATIONS = ["Parent", "Spouse", "Child", "Friend", "Sibling", "Other"];

export default function PersonalInfoScreen() {
  const [userData, setUserData] = useState<UserProfile>({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    bloodType: "",
    emergencyContacts: [],
  });
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactForm, setContactForm] = useState<Partial<EmergencyContact>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      setLoading(true);
      getUserProfile(user.uid)
        .then((data) => {
          if (data) {
            setUserData({
              fullName: data.fullName || "",
              givenName: data.givenName || "",
              familyName: data.familyName || "",
              email: data.email || "",
              phone: data.phone || "",
              dob: data.dob || "",
              bloodType: data.bloodType || "",
              emergencyContacts: data.emergencyContacts || [],
            });
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    // simple entrance animation
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setUserData({ ...userData, [field]: value });
  };

  const handleSave = async () => {
    if (!user) return Alert.alert("Erreur", "Utilisateur non connecté");
    try {
      setLoading(true);
      await updateUserProfile(user.uid, userData);
      Alert.alert("Succès", "Vos informations ont été mises à jour !");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur", "Impossible de mettre à jour vos informations.");
    } finally {
      setLoading(false);
    }
  };

  /* Emergency contacts CRUD (local state + persist via profile update) */
  const addOrUpdateContact = async () => {
    // validation
    if (!contactForm.firstName || !contactForm.phone || !contactForm.relation) {
      return Alert.alert("Validation", "Veuillez compléter tous les champs du contact d'urgence.");
    }

    let contacts = [...(userData.emergencyContacts || [])];

    if (editingContact) {
      contacts = contacts.map((c) => (c.id === editingContact.id ? { ...(editingContact as EmergencyContact), ...(contactForm as EmergencyContact) } : c));
    } else {
      const newContact: EmergencyContact = {
        id: String(Date.now()),
        firstName: contactForm.firstName as string,
        lastName: contactForm.lastName || "",
        phone: contactForm.phone as string,
        relation: contactForm.relation as string,
      };
      contacts.unshift(newContact);
    }

    const newProfile = { ...userData, emergencyContacts: contacts } as UserProfile;
    setUserData(newProfile);
    setModalVisible(false);
    setEditingContact(null);
    setContactForm({});

    // persist
    if (user) {
      try {
        await updateUserProfile(user.uid, newProfile);
      } catch (e) {
        console.error("Saving contacts failed", e);
      }
    }
  };

  const handleEditContact = (c: EmergencyContact) => {
    setEditingContact(c);
    setContactForm(c);
    setModalVisible(true);
  };

  const handleDeleteContact = (id: string) => {
    Alert.alert("Supprimer", "Voulez-vous supprimer ce contact ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          const contacts = (userData.emergencyContacts || []).filter((x) => x.id !== id);
          const newProfile = { ...userData, emergencyContacts: contacts } as UserProfile;
          setUserData(newProfile);
          if (user) {
            try {
              await updateUserProfile(user.uid, newProfile);
            } catch (e) {
              console.error(e);
            }
          }
        },
      },
    ]);
  };

  const renderContact = ({ item }: { item: EmergencyContact }) => (
    <View style={styles.contactRow} accessibilityRole="button">
      <View style={styles.contactLeft}>
        <View style={styles.avatarPlaceholder} accessible accessibilityLabel={`Contact ${item.firstName}`}>
          <Text style={styles.avatarText}>{item.firstName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactName}>{item.firstName} {item.lastName}</Text>
          <Text style={styles.contactMeta}>{item.relation} • {item.phone}</Text>
        </View>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity onPress={() => handleEditContact(item)} accessibilityLabel={`Edit ${item.firstName}`}>
          <Ionicons name="pencil" size={18} color="#13a4ec" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteContact(item.id)} accessibilityLabel={`Delete ${item.firstName}`} style={{ marginLeft: 12 }}>
          <Ionicons name="trash" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
                <Ionicons name="arrow-back" size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Personal Info</Text>
              <View style={{ width: 32 }} />
            </View>

            {/* Profile card */}
            <View style={styles.profileCard}>
              <View style={styles.profileLeft}>
                <Image
                    source={avatarPlaceholder}
                    style={styles.profileImage}
                    accessibilityLabel="Profile photo"
                  />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.name}>{userData.fullName || "Votre nom"}</Text>
                  <Text style={styles.sub}>{userData.email}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editProfile} onPress={() => Alert.alert("Change photo", "Feature not implemented") } accessibilityLabel="Change photo">
                <Ionicons name="camera" size={20} color="#13a4ec" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Informations</Text>

              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={userData.fullName}
                onChangeText={(t) => handleChange("fullName", t)}
                placeholder="Prénom Nom"
                accessibilityLabel="Full name"
              />

              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={userData.phone}
                    onChangeText={(t) => handleChange("phone", t)}
                    keyboardType="phone-pad"
                    accessibilityLabel="Phone number"
                  />
                </View>

                <View style={{ width: 12 }} />

                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>DOB</Text>
                  <TextInput
                    style={styles.input}
                    value={userData.dob}
                    onChangeText={(t) => handleChange("dob", t)}
                    placeholder="YYYY-MM-DD"
                    accessibilityLabel="Date of birth"
                  />
                </View>
              </View>

              <Text style={styles.label}>Blood Type</Text>
              <TextInput style={styles.input} value={userData.bloodType} onChangeText={(t) => handleChange("bloodType", t)} accessibilityLabel="Blood type" />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Save changes">
                <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save Changes"}</Text>
              </TouchableOpacity>
            </View>

            {/* Emergency contacts */}
            <View style={[styles.form, { marginTop: 18 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={styles.sectionTitle}>Contacts d'urgence</Text>
                <TouchableOpacity onPress={() => { setEditingContact(null); setContactForm({}); setModalVisible(true); AccessibilityInfo.announceForAccessibility('Ajouter un contact d\'urgence'); }} accessibilityLabel="Add emergency contact">
                  <View style={styles.addButton}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addButtonText}>Ajouter</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {(!userData.emergencyContacts || userData.emergencyContacts.length === 0) ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: "#6b7280" }}>Aucun contact d'urgence enregistré</Text>
                </View>
              ) : (
                <FlatList
                  data={userData.emergencyContacts}
                  keyExtractor={(item) => item.id}
                  renderItem={renderContact}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: "#f3f4f6", marginVertical: 8 }} />}
                />
              )}
            </View>

            {/* Modal - Add/Edit contact */}
            <Modal visible={modalVisible} animationType="slide" transparent>
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <Text style={styles.modalTitle}>{editingContact ? "Modifier le contact" : "Nouveau contact d'urgence"}</Text>

                  <ScrollView>
                    <Text style={styles.label}>Prénom</Text>
                    <TextInput style={styles.input} value={contactForm.firstName || ""} onChangeText={(t) => setContactForm({ ...contactForm, firstName: t })} />

                    <Text style={styles.label}>Nom</Text>
                    <TextInput style={styles.input} value={contactForm.lastName || ""} onChangeText={(t) => setContactForm({ ...contactForm, lastName: t })} />

                    <Text style={styles.label}>Téléphone</Text>
                    <TextInput style={styles.input} value={contactForm.phone || ""} onChangeText={(t) => setContactForm({ ...contactForm, phone: t })} keyboardType="phone-pad" />

                    <Text style={styles.label}>Relation</Text>
                    <View style={styles.pillRow}>
                      {RELATIONS.map((r) => (
                        <TouchableOpacity key={r} style={[styles.pill, contactForm.relation === r && styles.pillActive]} onPress={() => setContactForm({ ...contactForm, relation: r })}>
                          <Text style={[styles.pillText, contactForm.relation === r && styles.pillTextActive]}>{r}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                      <TouchableOpacity style={[styles.saveButton, { flex: 1 }]} onPress={addOrUpdateContact}>
                        <Text style={styles.saveButtonText}>Ajouter ce contact</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.cancelButton, { flex: 1 }]} onPress={() => { setModalVisible(false); setEditingContact(null); setContactForm({}); }}>
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f8" },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827", flex: 1, textAlign: "center", paddingRight: 32 },

  profileCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  profileLeft: { flexDirection: "row", alignItems: "center" },
  profileImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: "#f3f4f6" },
  editProfile: { backgroundColor: "#13a4ec10", padding: 10, borderRadius: 10 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 4 },

  form: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginTop: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  label: { fontSize: 13, color: "#6b7280", marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: "#111827", backgroundColor: "#fff" },

  saveButton: { backgroundColor: "#13a4ec", padding: 14, borderRadius: 10, marginTop: 18, alignItems: "center" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  cancelButton: { backgroundColor: "transparent", padding: 14, borderRadius: 10, marginTop: 18, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" },
  cancelButtonText: { color: "#111827", fontSize: 16, fontWeight: "600" },

  addButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#13a4ec", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: "#fff", marginLeft: 6, fontWeight: "600" },

  contactRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  contactLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#13a4ec10", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#13a4ec", fontWeight: "700", fontSize: 18 },
  contactName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  contactMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  contactActions: { flexDirection: "row", alignItems: "center" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "75%" },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f3f4f6", marginRight: 8, marginBottom: 8 },
  pillActive: { backgroundColor: "#13a4ec" },
  pillText: { color: "#6b7280", fontWeight: "600" },
  pillTextActive: { color: "#fff" },
});
