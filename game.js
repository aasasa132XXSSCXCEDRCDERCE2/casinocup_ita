// ================== CONFIG ==================
const MIN_BET = 50;
const MAX_HANDS = 30;
const DEALER_STAND = 17;
const RESET_DELAY = 3000;

// ================== GAME STATE ==================
let bankroll = 10000;
let handsLeft = MAX_HANDS;
let bet = 0;
let betHistory = [];

let deck = [];
let playerHands = [[]]; // supporta split
let currentHandIndex = 0;
let dealerHand = [];
let dealerHole = null;

let PHASE = "BET"; // BET → PLAYER → DEALER → END

// ================== CARD DATA ==================
const SUITS = ["♠","♥","♦","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// ================== DECK ==================
function createDeck(){
  const d = [];
  SUITS.forEach(s=>VALUES.forEach(v=>d.push({v,s})));
  return d;
}

function shuffle(d){
  for(let i=d.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [d[i],d[j]] = [d[j],d[i]];
  }
}

function draw(){
  return deck.pop();
}

// ================== SCORE ==================
function score(hand){
  let total = 0, aces=0;
  hand.forEach(c=>{
    if(c.v==="A"){ total+=11; aces++; }
    else if(["K","Q","J"].includes(c.v)) total+=10;
    else total+=parseInt(c.v);
  });
  while(total>21 && aces>0){ total-=10; aces--; }
  return total;
}

// ================== BET SYSTEM ==================
document.querySelectorAll(".chip").forEach(chip=>{
  chip.onclick = ()=>{
    if(PHASE!=="BET") return;
    const v = parseInt(chip.dataset.value);
    if(bankroll<v) return;
    bankroll -= v;
    bet += v;
    betHistory.push(v);
    render();
  };
});

document.getElementById("undoBtn").onclick = ()=>{
  if(PHASE!=="BET" || !betHistory.length) return;
  const v = betHistory.pop();
  bet -= v;
  bankroll += v;
  render();
};

// ================== DEAL ==================
document.getElementById("dealBtn").onclick = ()=>{
  if(PHASE!=="BET") return;
  if(bet<MIN_BET) return alert("Puntata minima 50€");
  if(handsLeft<=0) return alert("Mani finite");

  startRound();
};

function startRound(){
  PHASE = "PLAYER";
  deck = createDeck();
  shuffle(deck);

  // inizializza mani
  playerHands = [[draw(),draw()]];
  currentHandIndex = 0;

  dealerHand = [draw()];
  dealerHole = draw();

  render();

  // BLACKJACK IMMEDIATO
  const p = score(playerHands[0]);
  const d = score([dealerHand[0], dealerHole]);
  if(p===21){
    PHASE="DEALER";
    dealerHand.push(dealerHole); dealerHole=null;
    if(d===21) bankroll+=bet; else bankroll+=bet*2.5;
    handsLeft--;
    setTimeout(resetRound,RESET_DELAY);
    render();
  }
}

// ================== HIT ==================
document.getElementById("hitBtn").onclick = ()=>{
  if(PHASE!=="PLAYER") return;

  let hand = playerHands[currentHandIndex];
  hand.push(draw());
  render();

  if(score(hand)>21){
    nextHandOrDealer();
  }
};

// ================== STAND ==================
document.getElementById("standBtn").onclick = ()=>{
  if(PHASE!=="PLAYER") return;
  nextHandOrDealer();
};

// ================== DOUBLE ==================
document.getElementById("doubleBtn").onclick = ()=>{
  if(PHASE!=="PLAYER") return;
  let hand = playerHands[currentHandIndex];
  if(hand.length!==2) return;
  if(bankroll<bet) return alert("Saldo insufficiente");

  bankroll -= bet;
  bet *= 2;

  hand.push(draw());
  render();

  if(score(hand)>21){
    nextHandOrDealer();
  } else {
    nextHandOrDealer();
  }
};

// ================== SPLIT ==================
document.getElementById("splitBtn").onclick = ()=>{
  if(PHASE!=="PLAYER") return;
  let hand = playerHands[currentHandIndex];
  if(hand.length!==2 || hand[0].v!==hand[1].v) return alert("Split non possibile");

  if(bankroll<bet) return alert("Saldo insufficiente");

  bankroll -= bet;
  // dividi le due carte in due mani
  let card1 = hand[0], card2 = hand[1];
  playerHands[currentHandIndex] = [card1, draw()];
  playerHands.push([card2, draw()]);

  render();
};

// ================== LOGICA MANI/DEALER ==================
function nextHandOrDealer(){
  if(currentHandIndex<playerHands.length-1){
    currentHandIndex++;
    render();
  } else {
    PHASE="DEALER";
    revealDealer();
  }
}

async function revealDealer(){
  dealerHand.push(dealerHole); dealerHole=null;
  render();
  await sleep(700);
  while(score(dealerHand)<DEALER_STAND){
    dealerHand.push(draw());
    render();
    await sleep(700);
  }
  endRound();
}

// ================== END ROUND ==================
function endRound(){
  PHASE="END";
  playerHands.forEach(hand=>{
    const p = score(hand);
    const d = score(dealerHand);
    if(p<=21){
      if(d>21 || p>d) bankroll+=bet*2;
      else if(p===d) bankroll+=bet;
    }
  });

  handsLeft--;
  setTimeout(resetRound,RESET_DELAY);
}

// ================== RESET ROUND ==================
function resetRound(){
  bet=0; betHistory=[];
  playerHands=[[]]; currentHandIndex=0;
  dealerHand=[]; dealerHole=null;

  if(handsLeft<=0){
    alert("Torneo finito");
    disableAll();
    return;
  }
  PHASE="BET";
  render();
}

// ================== RENDER ==================
function render(){
  document.getElementById("bankroll").innerText=bankroll;
  document.getElementById("handsLeft").innerText=handsLeft;
  document.getElementById("bet").innerText=bet;

  // PLAYER
  const pc = document.getElementById("playerCards");
  pc.innerHTML="";
  playerHands.forEach((hand,idx)=>{
    hand.forEach(c=>pc.appendChild(card(c)));
    if(idx<playerHands.length-1) pc.appendChild(document.createElement("br"));
  });
  let currentScore = score(playerHands[currentHandIndex] || []);
  document.getElementById("playerScore").innerText=
    playerHands.length>1 ? `Mano ${currentHandIndex+1}: ${currentScore}` : `Tu: ${currentScore}`;

  // DEALER
  const dc = document.getElementById("dealerCards");
  dc.innerHTML="";
  dealerHand.forEach(c=>dc.appendChild(card(c)));
  if(PHASE==="PLAYER" && dealerHole) dc.appendChild(hiddenCard());
  document.getElementById("dealerScore").innerText=
    (PHASE==="PLAYER" && dealerHole) ? "Dealer: ?" : `Dealer: ${score(dealerHand)}`;
}

// ================== CARD ELEMENTS ==================
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

// ================== UTILS ==================
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function disableAll(){ document.querySelectorAll("button,.chip").forEach(e=>e.disabled=true); }

// ================== INIT ==================
render()
