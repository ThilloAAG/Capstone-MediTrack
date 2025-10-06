import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { registerUser } from '../../src/services/auth';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      setError("Tous les champs sont requis.");
      return false;
    }
  
    //  Vérifie que l'email est bien formaté
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      setError("L'adresse email est invalide.");
      return false;
    }
  
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return false;
    }
  
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
  
    setLoading(true);
    try {
      const user = await registerUser({ email, password, name, role });
      console.log("Création réussie ✅", user);
      router.replace('/onboarding/welcome'); // <- ici
    } catch (e: any) {
      console.log("Erreur ⚠️", e.message);
      Alert.alert("Erreur d'inscription", e.message);
      setError(e.message);
      setPassword('');
       setEmail('');
       setName('');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.inner} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>Créer un compte</Text>

        <TextInput
          placeholder="Nom complet"
          style={styles.input}
          placeholderTextColor="#64748B"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor="#64748B"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Mot de passe"
          style={styles.input}
          placeholderTextColor="#64748B"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Choix de rôle simple */}
        <View style={styles.roleSelector}>
          <TouchableOpacity onPress={() => setRole('patient')} style={[styles.roleButton, role === 'patient' && styles.activeRole]}>
            <Text style={styles.roleText}>Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setRole('doctor')} style={[styles.roleButton, role === 'doctor' && styles.activeRole]}>
            <Text style={styles.roleText}>Doctor</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Chargement...' : 'Créer un compte'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/')} style={styles.back}>
          <Text style={styles.backText}>← Retour à la connexion</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#999',
  },
  activeRole: {
    backgroundColor: '#13a4ec',
    borderColor: '#13a4ec',
  },
  roleText: {
    color: '#000',
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#13a4ec',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  back: { marginTop: 16, alignItems: 'center' },
  backText: { color: '#555' },
});
