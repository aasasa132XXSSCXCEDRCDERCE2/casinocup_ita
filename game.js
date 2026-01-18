// ==========================
// STATO GIOCO
// ==========================
let balance = 1000;
let currentBet = 0;
let deck = [];
let dealerHand = [];
let playerHands = [[]];
let activeHandIndex = 0;
let gamePhase = "betting"; // betting | playing | finished

// ==========================
// CHIP BUTTONS
// ==========================
document.querySelectorAll(".chip").forEach(chip => {
  chip.addEventListener("click", () => {
    if (gamePhase !== "betting") return;

    const value = parseInt(chip.dataset.value);
    if (balance >= value) {
      currentBet += value;
      balance -= value;
      updateUI();
    }
  });
});

// ==========================
// DECK
// ==========================
function createDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  let d = [];
  for (let s of suits) {
    for (let v of values) {
      d.push({ suit: s, value: v });
    }
  }
  return d.sort(() => Math.random() - 0.5);
}

// ==========================
// START ROUND
// ==========================
function startGame() {
  if (currentBet === 0) return;

  deck = createDeck();
  dealerHand = [deck.pop(), deck.pop()];
  playerHands = [[deck.pop(), deck.pop()]];
  activeHandIndex = 0;
  gamePhase = "playing";

  renderTable();
}

// ==========================
// SPLIT
// ==========================
function splitHand() {
  const hand = playerHands[activeHandIndex];
  if (hand.length !== 2) return;
  if (hand[0].value !== hand[1].value) return;
  if (balance < currentBet) return;

  balance -= currentBet;

  const hand1 = [hand[0], deck.pop()];
  const hand2 = [hand[1], deck.pop()];

  playerHands = [hand1, hand2];
  activeHandIndex = 0;

  renderTable();
}

// ==========================
// HIT / STAND
// ==========================
function hit() {
  playerHands[activeHandIndex].push(deck.pop());
  renderTable();
}

function stand() {
  if (activeHandIndex < playerHands.length - 1) {
    activeHandIndex++;
  } else {
    gamePhase = "finished";
    dealerPlay();
  }
  renderTable();
}

// ==========================
// DEALER
// ==========================
function dealerPlay() {
  while (handValue(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }
}

// ==========================
// HAND VALUE
// ==========================
function handValue(hand) {
  let total = 0;
  let aces = 0;

  for (let c of hand) {
    if (c.value === "A") {
      total += 11;
      aces++;
    } else if (["K", "Q", "J"].includes(c.value)) {
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

// ==========================
// RENDER TABLE
// ==========================
function renderTable() {
  const table = document.getElementById("table");
  table.innerHTML = "";

  // Dealer
  table.innerHTML += `<div class="dealer">
    ${dealerHand.map(c => cardHTML(c)).join("")}
  </div>`;

  // Player Hands
  const handsContainer = document.createElement("div");
  handsContainer.className = "hands";

  playerHands.forEach((hand, i) => {
    const circle = document.createElement("div");
    circle.className = "hand-circle";
    if (i === activeHandIndex) circle.classList.add("active");

    circle.innerHTML = hand.map(c => cardHTML(c)).join("");
    handsContainer.appendChild(circle);
  });

  table.appendChild(handsContainer);
  updateUI();
}

// ==========================
// CARD HTML
// ==========================
function cardHTML(card) {
  return `<div class="card">${card.value}${card.suit}</div>`;
}

// ==========================
// UI
// ==========================
function updateUI() {
  document.getElementById("balance").innerText = balance;
  document.getElementById("bet").innerText = currentBet;
}

// ==========================
// BUTTONS
// ==========================
document.getElementById("deal").onclick = startGame;
document.getElementById("hit").onclick = hit;
document.getElementById("stand").onclick = stand;
document.getElementById("split").onclick = splitHand;
