// ==================================================
// BLACKJACK TORNEO – CASINÒ REALISTICO (STABILE)
// ==================================================

// ---------------- CONFIG ----------------
const MIN_BET = 50;
const MAX_HANDS = 30;
const DECKS = 6;
const CUT_PERCENT = 0.25;
const DEALER_STAND = 17;

// ---------------- GAME STATE ----------------
let bankroll = 10000;
let handsLeft = MAX_HANDS;

let bet = 0;
let betHistory = [];

let shoe = [];
let cutIndex = 0;

let playerHands = [];
let activeHand = 0;

let dealerHand = [];
let dealerHole = null;

let PHASE = "BET"; 
// BET → PLAYER → DEALER → END

// ---------------- DOM ----------------
const bankrollEl   = document.getElementById("bankroll");
const handsLeftEl  = document.getElementById("handsLeft");
const betEl        = document.getElementById("bet");

const playerCards  = document.getElementById("playerCards");
const dealerCards  = document.getElementById("dealerCards");

const playerScore  = document.getElementById("playerScore");
const dealerScore  = document.getElementById("dealerScore");

const dealBtn   = document.getElementById("dealBtn");
const hitBtn    = document.getElementById("hitBtn");
const standBtn  = document.getElementById("standBtn");
const doubleBtn = document.getElementById("doubleBtn");
const splitBtn  = document.getElementById("splitBtn");
const undoBtn   = document.getElementById("undoBtn");

// ---------------- CARDS ----------------
const SUITS  = ["♠","♥","♦","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// ==================================================
// SHOE (MULTI-DECK + CUT CARD)
// ==================================================
function createShoe(){
  shoe = [];
  for(let d = 0; d < DECKS; d++){
    SUITS.forEach(s=>{
      VALUES.forEach(v=>{
        shoe.push({v,s});
      });
    });
  }
  shuffle(shoe);
  cutIndex = Math.floor(shoe.length * CUT_PERCENT);
}

function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function draw(){
  if(shoe.length <= cutIndex){
    createShoe(); // cut card invisibile
  }
  return shoe.pop();
}

// ==================================================
// SCORE
// ==================================================
function score(hand){
  let total = 0;
  let aces = 0;

  hand.forEach(c=>{
    if(c.v === "A"){ total += 11; aces++; }
    else if(["K","Q","J"].includes(c.v)) total += 10;
    else total += parseInt(c.v);
  });

  while(total > 21 && aces > 0){
    total -= 10;
    aces--;
  }
  return total;
}

// ==================================================
// BET SYSTEM
// ==================================================
document.querySelectorAll(".chip").forEach(chip=>{
  chip.onclick = ()=>{
    if(PHASE !== "BET") return;

    const v = chip.dataset.value === "all"
      ? bankroll
      : parseInt(chip.dataset.value);

    if(v <= 0 || bankroll < v) return;

    bankroll -= v;
    bet += v;
    betHistory.push(v);
    render();
  };
});

undoBtn.onclick = ()=>{
  if(PHASE !== "BET" || !betHistory.length) return;
  const v = betHistory.pop();
  bet -= v;
  bankroll += v;
  render();
};

// ==================================================
// DEAL
// ==================================================
dealBtn.onclick = ()=>{
  if(PHASE !== "BET") return;
  if(bet < MIN_BET) return alert("Puntata minima 50€");
  if(handsLeft <= 0) return;

  startRound();
};

function startRound(){
  PHASE = "PLAYER";

  playerHands = [[draw(), draw()]];
  activeHand = 0;

  dealerHand = [draw()];
  dealerHole = draw();

  render();
}

// ==================================================
// PLAYER ACTIONS
// ==================================================
hitBtn.onclick = ()=>{
  if(PHASE !== "PLAYER") return;
  playerHands[activeHand].push(draw());
  render();

  if(score(playerHands[activeHand]) > 21){
    nextHand();
  }
};

standBtn.onclick = ()=>{
  if(PHASE !== "PLAYER") return;
  nextHand();
};

doubleBtn.onclick = ()=>{
  if(PHASE !== "PLAYER") return;
  if(bankroll < bet) return;

  bankroll -= bet;
  bet *= 2;

  playerHands[activeHand].push(draw());
  render();
  nextHand();
};

splitBtn.onclick = ()=>{
  if(PHASE !== "PLAYER") return;

  const h = playerHands[activeHand];
  if(h.length !== 2) return;
  if(h[0].v !== h[1].v) return;
  if(bankroll < bet) return;

  bankroll -= bet;

  playerHands.splice(
    activeHand,
    1,
    [h[0], draw()],
    [h[1], draw()]
  );

  render();
};

// ==================================================
// HAND FLOW
// ==================================================
function nextHand(){
  if(activeHand < playerHands.length - 1){
    activeHand++;
    render();
  } else {
    dealerTurn();
  }
}

// ==================================================
// DEALER LOGIC
// ==================================================
function dealerTurn(){
  PHASE = "DEALER";

  dealerHand.push(dealerHole);
  dealerHole = null;

  while(score(dealerHand) < DEALER_STAND){
    dealerHand.push(draw());
  }

  endRound();
}

// ==================================================
// END ROUND
// ==================================================
function endRound(){
  const dealerScoreValue = score(dealerHand);

  playerHands.forEach(hand=>{
    const p = score(hand);
    const playerBJ = (p === 21 && hand.length === 2);
    const dealerBJ = (dealerScoreValue === 21 && dealerHand.length === 2);

    if(playerBJ && !dealerBJ){
      bankroll += bet * 2.5; // 3:2
    }
    else if(p <= 21){
      if(dealerScoreValue > 21 || p > dealerScoreValue){
        bankroll += bet * 2;
      }
      else if(p === dealerScoreValue){
        bankroll += bet;
      }
    }
  });

  handsLeft--;

  resetRound();
}

function resetRound(){
  bet = 0;
  betHistory = [];
  playerHands = [];
  dealerHand = [];
  dealerHole = null;
  PHASE = "BET";

  if(bankroll <= 0){
    alert("Bankroll finito. Torneo concluso.");
    disableAll();
  }

  render();
}

// ==================================================
// RENDER
// ==================================================
function render(){
  bankrollEl.innerText = bankroll;
  handsLeftEl.innerText = handsLeft;
  betEl.innerText = bet;

  // PLAYER
  playerCards.innerHTML = "";
  playerHands.forEach((h,i)=>{
    const div = document.createElement("div");
    div.className = "cards";
    if(i === activeHand){
      div.style.outline = "2px solid gold";
    }
    h.forEach(c=>div.appendChild(cardEl(c)));
    playerCards.appendChild(div);
  });

  playerScore.innerText =
    playerHands[activeHand]
      ? "Tu: " + score(playerHands[activeHand])
      : "";

  // DEALER
  dealerCards.innerHTML = "";
  dealerHand.forEach(c=>dealerCards.appendChild(cardEl(c)));

  if(PHASE === "PLAYER" && dealerHole){
    dealerCards.appendChild(hiddenCard());
    dealerScore.innerText = "Dealer: ?";
  } else {
    dealerScore.innerText =
      dealerHand.length ? "Dealer: " + score(dealerHand) : "";
  }
}

// ==================================================
// ELEMENTS
// ==================================================
function cardEl(c){
  const d = document.createElement("div");
  d.className = "card";
  d.innerText = c.v + c.s;
  d.style.color = ["♥","♦"].includes(c.s) ? "red" : "black";
  return d;
}

function hiddenCard(){
  const d = document.createElement("div");
  d.className = "card";
  d.innerText = "🂠";
  return d;
}

function disableAll(){
  document.querySelectorAll("button,.chip")
    .forEach(e=>e.disabled = true);
}

// INIT
createShoe();
render();
