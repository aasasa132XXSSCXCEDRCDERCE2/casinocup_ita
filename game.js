/* =========================
   BLACKJACK GAME.JS
   LOGICA CASINÒ REALE
========================= */

// --------- STATO GIOCO ----------
let deck = [];
let playerHand = [];
let dealerHand = [];
let dealerHoleCard = null;

let balance = 10000;
let bet = 0;

let inRound = false;
let dealerRevealed = false;
let canDouble = false;

// --------- DOM ----------
const playerCardsDiv = document.getElementById("playerCards");
const dealerCardsDiv = document.getElementById("dealerCards");
const playerScoreDiv = document.getElementById("playerScore");
const dealerScoreDiv = document.getElementById("dealerScore");
const balanceDiv = document.getElementById("balance");
const betDiv = document.getElementById("bet");
const messageDiv = document.getElementById("message");

// --------- DECK ----------
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  deck = [];

  for (let s of suits) {
    for (let v of values) {
      deck.push({ suit: s, value: v });
    }
  }
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawCard() {
  if (deck.length === 0) {
    createDeck();
    shuffleDeck();
  }
  return deck.pop();
}

// --------- SCORE ----------
function calculateScore(hand) {
  let score = 0;
  let aces = 0;

  for (let card of hand) {
    if (card.value === "A") {
      score += 11;
      aces++;
    } else if (["K", "Q", "J"].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }

  return score;
}

// --------- UI ----------
function renderCards() {
  playerCardsDiv.innerHTML = "";
  dealerCardsDiv.innerHTML = "";

  playerHand.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = c.value + c.suit;
    playerCardsDiv.appendChild(div);
  });

  dealerHand.forEach(c => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerText = c.value + c.suit;
    dealerCardsDiv.appendChild(div);
  });

  if (!dealerRevealed && dealerHoleCard) {
    const back = document.createElement("div");
    back.className = "card back";
    back.innerText = "🂠";
    dealerCardsDiv.appendChild(back);
  }
}

function renderScores() {
  playerScoreDiv.innerText = "Player: " + calculateScore(playerHand);

  if (dealerRevealed) {
    dealerScoreDiv.innerText = "Dealer: " + calculateScore(dealerHand);
  } else {
    dealerScoreDiv.innerText = "Dealer: " + calculateScore(dealerHand);
  }

  balanceDiv.innerText = "Saldo: €" + balance;
  betDiv.innerText = "Puntata: €" + bet;
}

function render() {
  renderCards();
  renderScores();
}

// --------- BET ----------
function addBet(amount) {
  if (inRound) return;
  if (balance < amount) return;

  bet += amount;
  balance -= amount;
  render();
}

// --------- DEAL ----------
function deal() {
  if (inRound || bet === 0) return;

  createDeck();
  shuffleDeck();

  playerHand = [];
  dealerHand = [];
  dealerHoleCard = null;
  dealerRevealed = false;

  playerHand.push(drawCard());
  playerHand.push(drawCard());

  dealerHand.push(drawCard());      // carta visibile
  dealerHoleCard = drawCard();      // hole card NON visibile

  inRound = true;
  canDouble = true;
  messageDiv.innerText = "";

  render();

  // Blackjack immediato
  if (calculateScore(playerHand) === 21) {
    stand();
  }
}

// --------- HIT ----------
function hit() {
  if (!inRound) return;

  playerHand.push(drawCard());
  canDouble = false;
  render();

  if (calculateScore(playerHand) > 21) {
    endRound("Hai sforato! Hai perso.");
  }
}

// --------- STAND ----------
function stand() {
  if (!inRound) return;

  dealerRevealed = true;
  dealerHand.push(dealerHoleCard);
  dealerHoleCard = null;

  while (calculateScore(dealerHand) < 17) {
    dealerHand.push(drawCard());
  }

  resolveRound();
}

// --------- DOUBLE ----------
function doubleBet() {
  if (!inRound || !canDouble) return;
  if (balance < bet) return;

  balance -= bet;
  bet *= 2;

  playerHand.push(drawCard());
  render();

  if (calculateScore(playerHand) > 21) {
    endRound("Hai sforato col DOUBLE!");
  } else {
    stand();
  }
}

// --------- RISULTATO ----------
function resolveRound() {
  const p = calculateScore(playerHand);
  const d = calculateScore(dealerHand);

  if (d > 21 || p > d) {
    balance += bet * 2;
    endRound("Hai vinto!");
  } else if (p === d) {
    balance += bet;
    endRound("Push.");
  } else {
    endRound("Hai perso.");
  }
}

function endRound(text) {
  inRound = false;
  messageDiv.innerText = text;

  setTimeout(resetRound, 3000);
}

// --------- RESET ----------
function resetRound() {
  bet = 0;
  playerHand = [];
  dealerHand = [];
  dealerHoleCard = null;
  dealerRevealed = false;
  canDouble = false;

  render();
}

// --------- INIT ----------
render();
