import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from "react-native";
import { auth } from "../firebase";
import { addDoctor, getAllDoctors } from "../services/DoctorService";

export default function DoctorScreen() {
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [doctors, setDoctors] = useState([]);

  // 🔹 Charger tous les docteurs
  const fetchDoctors = async () => {
    const allDoctors = await getAllDoctors();
    setDoctors(allDoctors);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // 🔹 Ajouter un docteur
  const handleAddDoctor = async () => {
    if (!fullName || !specialty) {
      Alert.alert("Erreur", "Remplis tous les champs");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    await addDoctor(currentUser.uid, {
      doctorId: currentUser.uid,
      fullName,
      email: currentUser.email,
      specialty,
      createdAt: new Date(),
    });

    setFullName("");
    setSpecialty("");
    fetchDoctors(); // recharger la liste
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter un Docteur</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom complet"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Spécialité"
        value={specialty}
        onChangeText={setSpecialty}
      />
      <Button title="Ajouter" onPress={handleAddDoctor} />

      <Text style={[styles.title, { marginTop: 20 }]}>Liste des Docteurs</Text>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.doctorItem}>
            <Text style={styles.doctorName}>{item.fullName}</Text>
            <Text style={styles.doctorSpecialty}>{item.specialty}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f6f7f8" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: { backgroundColor: "#fff", padding: 10, marginBottom: 10, borderRadius: 8 },
  doctorItem: { padding: 10, backgroundColor: "#fff", marginBottom: 10, borderRadius: 8 },
  doctorName: { fontWeight: "bold" },
  doctorSpecialty: { color: "#555" },
});
