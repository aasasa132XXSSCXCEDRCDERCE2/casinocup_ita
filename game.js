import { db } from "./firebase.js";
import { ref, set, get } from "firebase/database";

// ==========================
// DEVICE FINGERPRINT
// ==========================
function getFingerprint() {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency,
    navigator.platform
  ].join("||");

  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(data))
    .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join(""));
}

// ==========================
// TORNEO ID (CAMBIA OGNI TORNEO)
// ==========================
const TOURNAMENT_ID = "torneo_001";

// ==========================
// CHECK BLOCCO
// ==========================
async function checkAccess() {
  const fingerprint = await getFingerprint();

  // 1. blocco locale
  if (localStorage.getItem("played_" + TOURNAMENT_ID)) {
    blockUser("Hai già partecipato a questo torneo.");
    return;
  }

  // 2. controllo database
  const snap = await get(ref(db, `blocks/${TOURNAMENT_ID}/${fingerprint}`));
  if (snap.exists()) {
    blockUser("Accesso già utilizzato.");
    return;
  }

  // salva fingerprint come attivo
  await set(ref(db, `active/${TOURNAMENT_ID}/${fingerprint}`), {
    startTime: Date.now()
  });

  window.playerFingerprint = fingerprint;
}

// ==========================
// BLOCCO VISIVO
// ==========================
function blockUser(msg) {
  document.body.innerHTML = `
    <div style="height:100vh;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;text-align:center;padding:20px">
      <div>
        <h1>⛔ Accesso bloccato</h1>
        <p>${msg}</p>
      </div>
    </div>
  `;
  throw new Error("ACCESS_BLOCKED");
}

// ==========================
// SALVATAGGIO RISULTATO
// ==========================
async function submitResult(score, handsHash) {
  const fingerprint = window.playerFingerprint;

  const result = {
    score,
    handsHash,
    finishedAt: Date.now()
  };

  await set(ref(db, `results/${TOURNAMENT_ID}/${fingerprint}`), result);

  // blocca rientro locale
  localStorage.setItem("played_" + TOURNAMENT_ID, "1");

  // blocca rientro globale
  await set(ref(db, `blocks/${TOURNAMENT_ID}/${fingerprint}`), true);
}

// ==========================
// ANTI-CHEAT HASH MANI
// ==========================
function hashHands(hands) {
  return crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(hands))
  ).then(hash =>
    Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
  );
}

// ==========================
// AVVIO
// ==========================
checkAccess();

// ==========================
// ESEMPIO FINE PARTITA
// ==========================
// quando finisce la partita:
// const hash = await hashHands(maniGiocate);
// await submitResult(punteggioFinale, hash);
