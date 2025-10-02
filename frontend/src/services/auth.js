// auth.js
import { createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
 } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Inscription + profil Firestore
export async function registerUser({email, password, name, role}) {
  const cleanEmail = (email ?? "").trim().toLowerCase();
  const cleanName = (name ?? "").trim();
  if (!clenEmail || !cleanName){
    throw new Error("Email et mot de passe sont requis.");
  }
  if (password.lenght < 6) {
    throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
  }
  if (!cleanName){
    throw new Error("Le nom est requis.");
  }
  if (!role){
    throw new Error("Le rôle est requis (ex: 'patient' ou doctor' ).");
  }

  try{
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  

  await setDoc(doc(db, "users", user.uid), {
    name: cleanName,
    role, 
    email:cleanEmail.trim(), 
    createdAt: serverTimestamp(),
  },
  { merge: true } // Merge avec les données existantes
 );
  return cred.user;
} catch (e) {
  // remonte un message propre à l’UI
  const msg =
    e?.code === "auth/email-already-in-use"
      ? "Cet email est déjà utilisé."
      : e?.message || "Erreur lors de l'inscription.";
  throw new Error(msg);
}
}


// connexion
export async function loginUser(email, password) {
  const cleanEmail = (email ?? "").trim().toLowerCase();
  if (!cleanEmail || !password) throw new Error("Email et mot de passe sont requis.");
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

// deconexion
export function logoutUser(){
  return signOut(auth);
}
