import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { registerUser } from '../../src/services/auth';

export default function SignupScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  const validate = () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      setError("Tous les champs sont requis.");
      return false;
    }

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
    setError('');

    try {
      const user = await registerUser({ email, password, name, role });
      console.log("Création réussie ✅", user);
      Alert.alert("Succès", "Compte créé avec succès!");
      
      // ✅ Conditional routing based on role
      if (role === 'doctor') {
        console.log("Redirecting to doctor dashboard");
        router.replace('/doctor/dashboard');
      } else {
        console.log("Redirecting to patient dashboard");
        router.replace('/patient/dashboard');
      }
    } catch (e: any) {
      console.log("Erreur ⚠️", e.message);
      const errorMessage = e.message || "Erreur inconnue";
      Alert.alert("Erreur d'inscription", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Créer un compte</Text>

          <TextInput
            placeholder="Nom complet"
            style={styles.input}
            placeholderTextColor="#64748B"
            value={name}
            onChangeText={setName}
            editable={!loading}
          />

          <TextInput
            placeholder="Email"
            style={styles.input}
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <View style={styles.passwordInputWrapper}>
            <TextInput
              placeholder="Mot de passe"
              style={styles.input}
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
              disabled={loading}
            >
              <Text style={styles.eyeText}>
                {passwordVisible ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Role Selection */}
          <View style={styles.roleSelector}>
            <TouchableOpacity
              onPress={() => !loading && setRole('patient')}
              style={[
                styles.roleButton,
                role === 'patient' && styles.activeRole,
              ]}
              disabled={loading}
            >
              <Text
                style={[
                  styles.roleText,
                  role === 'patient' && styles.activeRoleText,
                ]}
              >
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => !loading && setRole('doctor')}
              style={[
                styles.roleButton,
                role === 'doctor' && styles.activeRole,
              ]}
              disabled={loading}
            >
              <Text
                style={[
                  styles.roleText,
                  role === 'doctor' && styles.activeRoleText,
                ]}
              >
                Doctor
              </Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Créer un compte</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/')}
            style={styles.back}
            disabled={loading}
          >
            <Text style={styles.backText}>← Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7f8' },
  inner: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
    color: '#0F172A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#F1F5F9',
  },
  passwordInputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  eyeText: {
    fontSize: 18,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  activeRole: {
    backgroundColor: '#13a4ec',
    borderColor: '#13a4ec',
  },
  roleText: {
    color: '#64748B',
    fontWeight: '600',
  },
  activeRoleText: {
    color: '#fff',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#13a4ec',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  back: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  backText: {
    color: '#64748B',
    fontWeight: '500',
  },
});
