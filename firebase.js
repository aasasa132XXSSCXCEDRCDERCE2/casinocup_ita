// 🔥 Firebase SDK (v10 - ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getDatabase, 
  ref, 
  set, 
  push, 
  update, 
  increment 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { 
  getAuth, 
  signInAnonymously 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔐 CONFIGURAZIONE FIREBASE (LA TUA)
const firebaseConfig = {
  apiKey: "AIzaSyAGFnP6wNzzy3jgvkjXxwpTmRFOpP3HvgU",
  authDomain: "blackjack-torneo.firebaseapp.com",
  databaseURL: "https://blackjack-torneo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "blackjack-torneo",
  storageBucket: "blackjack-torneo.firebasestorage.app",
  messagingSenderId: "509149383414",
  appId: "1:509149383414:web:f5c09acff20306f7bbfad7"
};

// 🚀 Inizializza Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// 👤 Login anonimo (automatico)
signInAnonymously(auth)
  .then(res => {
    window.PLAYER_UID = res.user.uid;
    console.log("Player UID:", PLAYER_UID);

    // registra il player nel torneo
    if (typeof initPlayer === "function") {
      initPlayer();
    }
  })
  .catch(err => {
    console.error("Errore autenticazione Firebase:", err);
  });

// 🌍 Esponi funzioni globali (usate in game.js)
window.db = db;
window.ref = ref;
window.set = set;
window.push = push;
window.update = update;
window.increment = increment;
