/* ===============================
   BLACKJACK TOURNAMENT GAME.JS
   =============================== */

/* ---------- CONFIG ---------- */
const START_BANKROLL = 10000;
const TOTAL_HANDS = 30;
const MIN_BET = 50;
const MAX_BET = 1000;

/* ---------- STATO GIOCO ---------- */
let bankroll = START_BANKROLL;
let handsLeft = TOTAL_HANDS;
let bet = 0;
let betHistory = [];

let deck = [];
let dealerHand = [];
let playerHands = [];
let activeHandIndex = 0;

let gameState = "BETTING"; 
// BETTING | PLAYING | DEALER | END_HAND | FINISHED

/* ---------- MAZZO ---------- */
const suits = ["♠","♥","♦","♣"];
const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

/* ---------- ELEMENTI UI ---------- */
const ui = {
  bankroll: document.getElementById("bankroll"),
  bet: document.getElementById("bet"),
  handsLeft: document.getElementById("handsLeft"),

  dealerCards: document.getElementById("dealerCards"),
  dealerScore: document.getElementById("dealerScore"),

  playerArea: document.getElementById("playerArea"),

  dealBtn: document.getElementById("dealBtn"),
  hitBtn: document.getElementById("hitBtn"),
  standBtn: document.getElementById("standBtn"),
  doubleBtn: document.getElementById("doubleBtn"),
  splitBtn: document.getElementById("splitBtn"),
  undoBtn: document.getElementById("undoBtn")
};

/* ---------- UTILS ---------- */
function createDeck() {
  let d = [];
  for (let s of suits) {
    for (let v of values) {
      d.push({ value: v, suit: s });
    }
  }
  return d;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawCard() {
  return deck.pop();
}

function handValue(hand) {
  let total = 0;
  let aces = 0;

  for (let c of hand) {
    if (c.value === "A") {
      total += 11;
      aces++;
    } else if (["K","Q","J"].includes(c.value)) {
      total += 10;
    } else {
      total += parseInt(c.value);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

/* ---------- UI UPDATE ---------- */
function updateTopUI() {
  ui.bankroll.textContent = bankroll;
  ui.bet.textContent = bet;
  ui.handsLeft.textContent = handsLeft;
}

function clearTable() {
  ui.dealerCards.innerHTML = "";
  ui.playerArea.innerHTML = "";
  ui.dealerScore.textContent = "";
}

/* ---------- RENDER ---------- */
function renderDealer(showAll = false) {
  ui.dealerCards.innerHTML = "";

  dealerHand.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "card";

    if (i === 0 && !showAll && gameState === "PLAYING") {
      div.textContent = "■";
    } else {
      div.textContent = `${c.value}${c.suit}`;
    }

    ui.dealerCards.appendChild(div);
  });

  if (showAll) {
    ui.dealerScore.textContent = handValue(dealerHand);
  }
}

function renderPlayers() {
  ui.playerArea.innerHTML = "";

  playerHands.forEach((hand, idx) => {
    const wrapper = document.createElement("div");
    wrapper.className = "player-hand";
    if (idx === activeHandIndex) wrapper.classList.add("active");

    const cards = document.createElement("div");
    cards.className = "cards";

    hand.forEach(c => {
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = `${c.value}${c.suit}`;
      cards.appendChild(div);
    });

    const score = document.createElement("div");
    score.className = "score";
    score.textContent = handValue(hand);

    wrapper.appendChild(cards);
    wrapper.appendChild(score);
    ui.playerArea.appendChild(wrapper);
  });
}

/* ---------- BETTING ---------- */
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    if (gameState !== "BETTING") return;

    const val = parseInt(chip.dataset.value);
    if (bankroll >= val && bet + val <= MAX_BET) {
      bet += val;
      bankroll -= val;
      betHistory.push(val);
      updateTopUI();
    }
  });
});

ui.undoBtn.addEventListener("click", () => {
  if (betHistory.length === 0) return;
  const last = betHistory.pop();
  bet -= last;
  bankroll += last;
  updateTopUI();
});

/* ---------- DEAL ---------- */
ui.dealBtn.addEventListener("click", () => {
  if (gameState !== "BETTING") return;
  if (bet < MIN_BET) {
    alert("Puntata minima 50€");
    return;
  }

  deck = createDeck();
  shuffle(deck);

  dealerHand = [drawCard(), drawCard()];
  playerHands = [[drawCard(), drawCard()]];
  activeHandIndex = 0;

  gameState = "PLAYING";

  renderDealer(false);
  renderPlayers();
});

/* ---------- PLAYER ACTIONS ---------- */
ui.hitBtn.addEventListener("click", () => {
  if (gameState !== "PLAYING") return;

  const hand = playerHands[activeHandIndex];
  hand.push(drawCard());

  if (handValue(hand) > 21) {
    nextHand();
  }

  renderPlayers();
});

ui.standBtn.addEventListener("click", () => {
  if (gameState !== "PLAYING") return;
  nextHand();
});

ui.doubleBtn.addEventListener("click", () => {
  if (gameState !== "PLAYING") return;

  if (bankroll < bet) return;

  bankroll -= bet;
  bet *= 2;

  const hand = playerHands[activeHandIndex];
  hand.push(drawCard());

  updateTopUI();
  renderPlayers();

  nextHand();
});

ui.splitBtn.addEventListener("click", () => {
  if (gameState !== "PLAYING") return;

  const hand = playerHands[activeHandIndex];
  if (hand.length !== 2) return;
  if (hand[0].value !== hand[1].value) return;
  if (bankroll < bet) return;

  bankroll -= bet;

  const hand1 = [hand[0], drawCard()];
  const hand2 = [hand[1], drawCard()];

  playerHands.splice(activeHandIndex, 1, hand1, hand2);

  updateTopUI();
  renderPlayers();
});

/* ---------- TURNI ---------- */
function nextHand() {
  activeHandIndex++;

  if (activeHandIndex >= playerHands.length) {
    dealerTurn();
  } else {
    renderPlayers();
  }
}

/* ---------- DEALER ---------- */
function dealerTurn() {
  gameState = "DEALER";

  while (handValue(dealerHand) < 17) {
    dealerHand.push(drawCard());
  }

  renderDealer(true);
  settleBets();
}

/* ---------- RISOLUZIONE ---------- */
function settleBets() {
  const dealerScore = handValue(dealerHand);

  playerHands.forEach(hand => {
    const p = handValue(hand);

    if (p > 21) return;

    if (dealerScore > 21 || p > dealerScore) {
      bankroll += bet * 2;
    } else if (p === dealerScore) {
      bankroll += bet;
    }
  });

  handsLeft--;
  bet = 0;
  betHistory = [];

  updateTopUI();

  if (handsLeft <= 0) {
    gameState = "FINISHED";
    // 👉 QUI chiamerai Firebase
  } else {
    gameState = "BETTING";
    clearTable();
  }
}

/* ---------- INIT ---------- */
updateTopUI();
