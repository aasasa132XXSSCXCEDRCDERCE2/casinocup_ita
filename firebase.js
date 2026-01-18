import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, set, get, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGFnP6wNzzy3jgvkjXxwpTmRFOpP3HvgU",
  authDomain: "blackjack-torneo.firebaseapp.com",
  databaseURL: "https://blackjack-torneo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "blackjack-torneo",
  storageBucket: "blackjack-torneo.firebasestorage.app",
  messagingSenderId: "509149383414",
  appId: "1:509149383414:web:f5c09acff20306f7bbfad7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const provider = new GoogleAuthProvider();

export async function login(){
  return signInWithPopup(auth, provider);
}

export function saveResult(uid, data){
  return set(ref(db, `tournament/players/${uid}`), data);
}

export async function checkBlocked(uid){
  const snap = await get(ref(db, `bans/${uid}`));
  return snap.exists();
}
