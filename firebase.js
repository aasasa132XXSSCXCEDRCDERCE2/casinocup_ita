// --- Firebase SDK compat ---
// I link compat sono già presenti nell'index.html

// Configurazione Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAGFnP6wNzzy3jgvkjXxwpTmRFOpP3HvgU",
  authDomain: "blackjack-torneo.firebaseapp.com",
  databaseURL: "https://blackjack-torneo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "blackjack-torneo",
  storageBucket: "blackjack-torneo.firebasestorage.app",
  messagingSenderId: "509149383414",
  appId: "1:509149383414:web:f5c09acff20306f7bbfad7",
  measurementId: "G-1NF00DV2HC"
};

// --- Inizializza Firebase ---
firebase.initializeApp(firebaseConfig);

// Database e Auth
const database = firebase.database();
const auth = firebase.auth();

// --- LOGIN/LOGOUT GOOGLE ---
function loginGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      console.log("Utente loggato:", result.user.displayName);
      alert("Benvenuto " + result.user.displayName);
    })
    .catch(err => console.error("Errore login:", err.message));
}

function logout() {
  auth.signOut()
    .then(()=> console.log("Utente disconnesso"))
    .catch(err=> console.error(err));
}

// --- OTTIENI UTENTE CORRENTE ---
function getCurrentUser() {
  return auth.currentUser;
}

// --- INVIA RISULTATI A FIREBASE ---
function sendResultToFirebase(userId, username, balance, handsLeft, roundHash, roundSeed) {
  database.ref("blackjack/players/" + userId).set({
    username: username,
    balance: balance,
    handsLeft: handsLeft,
    timestamp: Date.now(),
    hash: roundHash,
    seed: roundSeed
  });
}

// --- LEGGI CLASSIFICA TOP 50 ---
function getLeaderboard(callback){
  database.ref("blackjack/players")
    .orderByChild("balance")
    .limitToLast(50)
    .once("value")
    .then(snapshot => {
      const data = snapshot.val();
      const sorted = data ? Object.values(data).sort((a,b)=>b.balance - a.balance) : [];
      callback(sorted);
    })
    .catch(err => console.error("Errore leaderboard:", err));
}

// --- ANTI-CHEAT ---
function generateSeed(){
  return Math.floor(Math.random()*1e9).toString();
}

function hashString(str){
  let hash=0;
  for(let i=0;i<str.length;i++){
    hash = ((hash<<5)-hash)+str.charCodeAt(i);
    hash |=0;
  }
  return hash;
}

// --- BLOCCO FINE TORNEO ---
function checkTournamentEnd(handsLeft){
  if(handsLeft <= 0){
    alert("Hai terminato tutte le mani! Non puoi più giocare.");
    document.querySelectorAll("button, .chip").forEach(el=>el.disabled=true);
    return true;
  }
  return false;
}

// --- LISTENER AUTENTICAZIONE ---
auth.onAuthStateChanged(user=>{
  if(user){
    console.log("Utente loggato:", user.displayName);
  } else {
    console.log("Nessun utente loggato");
  }
});
