// ==================================================
//            BLACKJACK TORNEO – CASINÒ PRO
// ==================================================

// ---------------- CONFIG ----------------
const MIN_BET = 50;
const MAX_HANDS = 30;
const DECKS = 6;
const CUT_PERCENT = 0.25;
const DEALER_STAND = 17;

// ---------------- STATE ----------------
let bankroll = 10000;
let handsLeft = MAX_HANDS;
let bet = 0;
let betHistory = [];

let shoe = [];
let cutIndex = 0;

let hands = [];
let activeHand = 0;

let dealerHand = [];
let dealerHole = null;

let insuranceBet = 0;

let PHASE = "BET"; 
// BET → PLAYER → DEALER → END

// ---------------- CARDS ----------------
const SUITS = ["♠","♥","♦","♣"];
const VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// ==================================================
//                   SHOE
// ==================================================
function createShoe(){
  shoe = [];
  for(let d=0; d<DECKS; d++){
    SUITS.forEach(s=>{
      VALUES.forEach(v=>{
        shoe.push({v,s});
      });
    });
  }
  shuffle(shoe);
  cutIndex = Math.floor(shoe.length * CUT_PERCENT);
}

function shuffle(d){
  for(let i=d.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [d[i],d[j]]=[d[j],d[i]];
  }
}

function draw(){
  if(shoe.length <= cutIndex){
    createShoe(); // CUT CARD INVISIBILE
  }
  return shoe.pop();
}

// ==================================================
//                   SCORE
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
//                BET SYSTEM
// ==================================================
document.querySelectorAll(".chip").forEach(c=>{
  c.onclick=()=>{
    if(PHASE!=="BET") return;
    const v = c.dataset.value==="all" ? bankroll : parseInt(c.dataset.value);
    if(v<=0 || bankroll<v) return;
    bankroll-=v;
    bet+=v;
    betHistory.push(v);
    render();
  };
});

undoBtn.onclick=()=>{
  if(PHASE!=="BET" || !betHistory.length) return;
  const v = betHistory.pop();
  bet-=v;
  bankroll+=v;
  render();
};

// ==================================================
//                   DEAL
// ==================================================
dealBtn.onclick=()=>{
  if(PHASE!=="BET") return;
  if(bet<MIN_BET) return alert("Minimo 50€");
  if(handsLeft<=0) return;

  startRound();
};

function startRound(){
  PHASE="PLAYER";
  insuranceBet=0;

  hands=[[draw(),draw()]];
  activeHand=0;

  dealerHand=[draw()];
  dealerHole=draw();

  // INSURANCE
  if(dealerHand[0].v==="A" && bankroll>=bet/2){
    if(confirm("Insurance?")){
      insuranceBet = bet/2;
      bankroll -= insuranceBet;
    }
  }

  render();
}

// ==================================================
//                    HIT
// ==================================================
hitBtn.onclick=()=>{
  if(PHASE!=="PLAYER") return;
  hands[activeHand].push(draw());
  render();

  if(score(hands[activeHand])>21){
    nextHandOrDealer();
  }
};

// ==================================================
//                   STAND
// ==================================================
standBtn.onclick=()=>{
  if(PHASE!=="PLAYER") return;
  nextHandOrDealer();
};

// ==================================================
//                   DOUBLE
// ==================================================
doubleBtn.onclick=()=>{
  if(PHASE!=="PLAYER") return;
  if(bankroll<bet) return;

  bankroll-=bet;
  bet*=2;
  hands[activeHand].push(draw());
  render();
  nextHandOrDealer();
};

// ==================================================
//                   SPLIT
// ==================================================
splitBtn.onclick=()=>{
  if(PHASE!=="PLAYER") return;
  const h = hands[activeHand];
  if(h.length!==2 || h[0].v!==h[1].v) return;
  if(bankroll<bet) return;

  bankroll-=bet;

  hands.splice(activeHand,1,
    [h[0],draw()],
    [h[1],draw()]
  );

  render();
};

// ==================================================
//             HAND FLOW CONTROL
// ==================================================
function nextHandOrDealer(){
  if(activeHand < hands.length-1){
    activeHand++;
    render();
  } else {
    PHASE="DEALER";
    dealerTurn();
  }
}

// ==================================================
//                DEALER LOGIC
// ==================================================
async function dealerTurn(){
  dealerHand.push(dealerHole);
  dealerHole=null;
  render();

  await sleep(800);

  while(score(dealerHand)<DEALER_STAND){
    dealerHand.push(draw());
    render();
    await sleep(700);
  }

  endRound();
}

// ==================================================
//                 END ROUND
// ==================================================
function endRound(){
  PHASE="END";
  const dealerScore = score(dealerHand);
  const dealerBJ = dealerScore===21 && dealerHand.length===2;

  hands.forEach(h=>{
    const p = score(h);
    const playerBJ = p===21 && h.length===2;

    if(playerBJ && !dealerBJ){
      bankroll += bet * 2.5; // 3:2
    }
    else if(p<=21){
      if(dealerScore>21 || p>dealerScore) bankroll+=bet*2;
      else if(p===dealerScore) bankroll+=bet;
    }
  });

  if(insuranceBet && dealerBJ){
    bankroll += insuranceBet * 3;
  }

  handsLeft--;

  setTimeout(resetRound,2500);
}

function resetRound(){
  bet=0;
  betHistory=[];
  hands=[];
  dealerHand=[];
  dealerHole=null;

  if(bankroll<=0){
    alert("Bankroll finito. Torneo concluso.");
    disableAll();
    return;
  }

  PHASE="BET";
  render();
}

// ==================================================
//                    RENDER
// ==================================================
function render(){
  bankrollEl.innerText=bankroll;
  handsLeftEl.innerText=handsLeft;
  betEl.innerText=bet;

  playerCards.innerHTML="";
  hands.forEach((h,i)=>{
    const div=document.createElement("div");
    div.className="cards";
    if(i===activeHand) div.style.outline="2px solid gold";
    h.forEach(c=>div.appendChild(card(c)));
    playerCards.appendChild(div);
  });

  playerScore.innerText =
    hands[activeHand] ? "Tu: "+score(hands[activeHand]) : "";

  dealerCards.innerHTML="";
  dealerHand.forEach(c=>dealerCards.appendChild(card(c)));
  if(PHASE==="PLAYER" && dealerHole){
    dealerCards.appendChild(hiddenCard());
    dealerScore.innerText="Dealer: ?";
  } else {
    dealerScore.innerText="Dealer: "+score(dealerHand);
  }
}

// ==================================================
//                  ELEMENTS
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

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function disableAll(){
  document.querySelectorAll("button,.chip")
    .forEach(e=>e.disabled=true);
}

// INIT
createShoe();
render();
