// ==================================================
//            BLACKJACK TOURNAMENT – PRO
// ==================================================

// ---------------- CONFIG ----------------
const MIN_BET = 50;
const MAX_HANDS = 30;
const DEALER_STAND = 17;
const RESET_DELAY = 2500;
const NUM_DECKS = 6;
const SHUFFLE_AT = 52; // quando rimane 1 mazzo

// ---------------- STATE ----------------
let bankroll = 10000;
let handsLeft = MAX_HANDS;
let bet = 0;
let betHistory = [];

let deck = [];
let runningCount = 0; // Hi-Lo
let playerHands = [[]];
let currentHand = 0;
let dealerHand = [];
let dealerHole = null;

let PHASE = "BET"; // BET → PLAYER → DEALER → END

// ---------------- CARDS ----------------
const SUITS = ["♠","♥","♦","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// ==================================================
//                CARD COUNTING (Hi-Lo)
// ==================================================
function updateCount(card){
  if(["2","3","4","5","6"].includes(card.v)) runningCount++;
  else if(["10","J","Q","K","A"].includes(card.v)) runningCount--;
}

function trueCount(){
  return runningCount / Math.max(deck.length / 52, 1);
}

// ==================================================
//                    DECK
// ==================================================
function initDeck(){
  deck = [];
  for(let d=0; d<NUM_DECKS; d++){
    SUITS.forEach(s=>VALUES.forEach(v=>deck.push({v,s})));
  }
  shuffle(deck);
  runningCount = 0;
}

function shuffle(d){
  for(let i=d.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [d[i],d[j]]=[d[j],d[i]];
  }
}

function drawCard(){
  const c = deck.pop();
  updateCount(c);
  return c;
}

// ==================================================
//                    SCORE
// ==================================================
function score(hand){
  let total=0, aces=0;
  hand.forEach(c=>{
    if(c.v==="A"){ total+=11; aces++; }
    else if(["K","Q","J"].includes(c.v)) total+=10;
    else total+=parseInt(c.v);
  });
  while(total>21 && aces>0){ total-=10; aces--; }
  return total;
}

// ==================================================
//                   BETTING
// ==================================================
document.querySelectorAll(".chip").forEach(chip=>{
  chip.onclick=()=>{
    if(PHASE!=="BET") return;

    let v = chip.dataset.value==="all" ? bankroll : parseInt(chip.dataset.value);
    if(v<=0 || bankroll<v) return;

    bankroll-=v;
    bet+=v;
    betHistory.push(v);
    render();
  };
});

document.getElementById("undoBtn").onclick=()=>{
  if(PHASE!=="BET" || !betHistory.length) return;
  const v = betHistory.pop();
  bet-=v;
  bankroll+=v;
  render();
};

// ==================================================
//                    DEAL
// ==================================================
document.getElementById("dealBtn").onclick=()=>{
  if(PHASE!=="BET") return;
  if(bet<MIN_BET) return alert("Puntata minima 50€");
  if(handsLeft<=0) return;

  if(deck.length<SHUFFLE_AT) initDeck();
  startRound();
};

function startRound(){
  PHASE="PLAYER";
  playerHands=[[drawCard(), drawCard()]];
  currentHand=0;
  dealerHand=[drawCard()];
  dealerHole=drawCard();
  render();

  // Blackjack immediato
  if(score(playerHands[0])===21){
    dealerHand.push(dealerHole); dealerHole=null;
    if(score(dealerHand)===21) bankroll+=bet;
    else bankroll+=bet*2.5;
    handsLeft--;
    setTimeout(resetRound, RESET_DELAY);
  }
}

// ==================================================
//                    ACTIONS
// ==================================================
document.getElementById("hitBtn").onclick=()=>{
  if(PHASE!=="PLAYER") return;
  let h = playerHands[currentHand];
  h.push(drawCard());
  render();
  if(score(h)>21) nextHand();
};

document.getElementById("standBtn").onclick=()=>{
  if(PHASE!=="PLAYER") return;
  nextHand();
};

document.getElementById("doubleBtn").onclick=()=>{
  if(PHASE!=="PLAYER") return;
  let h = playerHands[currentHand];
  if(h.length!==2 || bankroll<bet) return;

  bankroll-=bet;
  bet*=2;
  h.push(drawCard());
  render();
  nextHand();
};

document.getElementById("splitBtn").onclick=()=>{
  if(PHASE!=="PLAYER") return;
  let h = playerHands[currentHand];
  if(h.length!==2 || h[0].v!==h[1].v || bankroll<bet) return;

  bankroll-=bet;
  playerHands[currentHand]=[h[0], drawCard()];
  playerHands.push([h[1], drawCard()]);
  render();
};

// ==================================================
//                HAND FLOW
// ==================================================
function nextHand(){
  if(currentHand<playerHands.length-1){
    currentHand++;
    render();
  } else {
    PHASE="DEALER";
    dealerTurn();
  }
}

async function dealerTurn(){
  dealerHand.push(dealerHole); dealerHole=null;
  render();
  await sleep(600);

  while(score(dealerHand)<DEALER_STAND){
    dealerHand.push(drawCard());
    render();
    await sleep(600);
  }
  settleHands();
}

// ==================================================
//                PAYOUT
// ==================================================
function settleHands(){
  playerHands.forEach(h=>{
    let p = score(h);
    let d = score(dealerHand);
    if(p<=21){
      if(d>21 || p>d) bankroll+=bet*2;
      else if(p===d) bankroll+=bet;
    }
  });
  handsLeft--;
  setTimeout(resetRound, RESET_DELAY);
}

// ==================================================
//                RESET
// ==================================================
function resetRound(){
  bet=0; betHistory=[];
  playerHands=[[]]; currentHand=0;
  dealerHand=[]; dealerHole=null;

  if(bankroll<=0){
    alert("Saldo esaurito. Torneo finito.");
    disableAll(); return;
  }
  if(handsLeft<=0){
    alert("Torneo finito.");
    disableAll(); return;
  }
  PHASE="BET";
  render();
}

// ==================================================
//                RENDER
// ==================================================
function render(){
  document.getElementById("bankroll").innerText=bankroll;
  document.getElementById("handsLeft").innerText=handsLeft;
  document.getElementById("bet").innerText=bet;

  const pc=document.getElementById("playerCards");
  pc.innerHTML="";
  playerHands.forEach((h,i)=>{
    const div=document.createElement("div");
    div.className="cards";
    if(i===currentHand) div.style.border="2px solid gold";
    h.forEach(c=>div.appendChild(card(c)));
    pc.appendChild(div);
  });

  document.getElementById("playerScore").innerText =
    PHASE==="PLAYER" ? `Mano ${currentHand+1}: ${score(playerHands[currentHand])}` : "";

  const dc=document.getElementById("dealerCards");
  dc.innerHTML="";
  dealerHand.forEach(c=>dc.appendChild(card(c)));
  if(PHASE==="PLAYER" && dealerHole) dc.appendChild(hiddenCard());

  document.getElementById("dealerScore").innerText =
    PHASE==="PLAYER" ? "Dealer: ?" : `Dealer: ${score(dealerHand)}`;
}

// ==================================================
//                ELEMENTS
// ==================================================
function card(c){
  const d=document.createElement("div");
  d.className="card";
  d.innerText=c.v+c.s;
  d.style.color=["♥","♦"].includes(c.s)?"red":"black";
  return d;
}

function hiddenCard(){
  const d=document.createElement("div");
  d.className="card";
  d.innerText="🂠";
  return d;
}

// ==================================================
//                UTILS
// ==================================================
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function disableAll(){ document.querySelectorAll("button,.chip").forEach(e=>e.disabled=true); }

// ==================================================
//                INIT
// ==================================================
initDeck();
render();
