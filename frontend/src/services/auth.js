// src/services/auth.js (ou .ts)
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

// Inscription + profil Firestore
export async function registerUser({ email, password, name, role }) {
  const cleanEmail = (email ?? "").trim().toLowerCase();
  const cleanName = (name ?? "").trim();

  if (!cleanEmail || !cleanName) {
    throw new Error("Email et nom sont requis.");
  }
  if (password.length < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }
  if (!role) {
    throw new Error("Le rôle est requis (ex: 'patient' ou 'doctor').");
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = cred.user;

    await setDoc(doc(db, "users", user.uid), {
      name: cleanName,
      role,
      email: cleanEmail,
      createdAt: serverTimestamp(),
    }, { merge: true });

    return user;
  } catch (e) {
    const msg =
      e?.code === "auth/email-already-in-use"
        ? "Cet email est déjà utilisé."
        : e?.message || "Erreur lors de l'inscription.";
    throw new Error(msg);
  }
}

// Connexion
export async function loginUser(email, password) {
  const cleanEmail = (email ?? "").trim().toLowerCase();
  if (!cleanEmail || !password)
    throw new Error("Email et mot de passe sont requis.");
  try {
    return await signInWithEmailAndPassword(auth, cleanEmail, password);
  } catch (e) {
    const msg =
      e?.code === "auth/invalid-credential" || e?.code === "auth/wrong-password"
        ? "Identifiants incorrects."
        : e?.message || "Erreur de connexion.";
    throw new Error(msg);
  }
}

// Déconnexion
export function logoutUser() {
  return signOut(auth);
}
