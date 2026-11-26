// Firebase web configuration: public client identifiers, not service credentials.
// Staging only. Do not grant legacy database access to authenticated clients.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  sendPasswordResetEmail, signOut, setPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

export const firebaseConfig = Object.freeze({
  apiKey: "AIzaSyAE1VxnhjNypXgkmkiKubWEBDl2U6hPca4",
  authDomain: "maktabos-7172b.firebaseapp.com",
  databaseURL: "https://maktabos-7172b-default-rtdb.firebaseio.com",
  projectId: "maktabos-7172b",
  storageBucket: "maktabos-7172b.firebasestorage.app",
  messagingSenderId: "480383138502",
  appId: "1:480383138502:web:30764e79fda6c54c2cf5c7"
});
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const ready = setPersistence(auth, browserSessionPersistence);
export function observeSession(callback, onError) {
  return onAuthStateChanged(auth, callback, onError);
}
export async function login(email, password) {
  await ready;
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}
export async function resetPassword(email) {
  await ready;
  await sendPasswordResetEmail(auth, email.trim());
}
export async function logout() {
  await ready;
  await signOut(auth);
}
export async function getSessionIdentity() {
  await ready;
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdTokenResult();
  return { uid: user.uid, emailVerified: user.emailVerified,
    member: token.claims.ilmnuriMember === true,
    admin: token.claims.ilmnuriMember === true && token.claims.admin === true };
}
// No self-assigned roles, no plaintext passwords in the database,
// and no browser access to the legacy root. Enrollment and migration
// require verified, owner-authorized provisioning.
