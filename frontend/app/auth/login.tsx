import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { registerUser, loginUser } from '../../src/services/auth';
import { Alert , ActivityIndicator} from 'react-native';


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<{email?: string; password?: string; form?: string}>({});
  const [loading, setLoading] = useState(false);

  
  const validate = () => {
    const e: any = {};
  
    if (!email.trim()) {
      e.email = "Email requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      e.email = "Adresse email invalide.";
    }
  
    if (!password.trim()) {
      e.password = "Mot de passe requis.";
    }
  
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => 
    { if (!validate()) return; setLoading(true);
       try { await loginUser(email, password); 
        // ➜ appelle Firebase via ton service 
        router.push('/onboarding/welcome'); } catch (err: any) { 
          // message du service (ex: "Identifiants incorrects.") 
          setErrors((prev) => ({ ...prev, form: err?.message ?? "Erreur de connexion." })); 
          // ou 
          Alert.alert('Connexion', err?.message ?? 'Erreur de connexion'); 
          setEmail('');
          setPassword('');
        } 
          finally { setLoading(false); } };





  const handleGoogleSignIn = () => {
    Alert.alert('Bientôt', "Google Sign-In sera branché ensuite 😉");
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.main}>
          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Welcome Back</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity 
                style={styles.loginButton}
                
                onPress={handleLogin}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In */}
              <TouchableOpacity 
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-google" size={24} color="#0F172A" />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/auth/signupscreen')} activeOpacity={0.8}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text style={styles.createAccountText}>Create Account</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  keyboardContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  titleContainer: {
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    fontSize: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  loginButton: {
    backgroundColor: '#13a4ec',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#13a4ec',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#64748B30',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  googleButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16,
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  createAccountText: {
    fontWeight: '700',
    color: '#13a4ec',
  },
});