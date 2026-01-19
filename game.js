// ================== CONFIG ==================
const MIN_BET = 50;
const MAX_BET = 1000;
const MAX_HANDS = 30;
const RESET_DELAY = 3000;

// ================== STATO GIOCO ==================
let bankroll = 10000;
let handsLeft = MAX_HANDS;
let bet = 0;
let betHistory = [];
let deck = [];
let dealerHand = [];
let dealerHole = null;
let playerHands = [[]]; // per split
let currentHand = 0;
let PHASE = "BET"; // BET, PLAYER, DEALER, ROUND_END
let roundSeed = "";
let roundHash = "";

// ================== CARTE ==================
const suits = ["♠","♥","♦","♣"];
const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// ================== FUNZIONI DECK ==================
function createDeck(){
  let d=[];
  suits.forEach(s=>values.forEach(v=>d.push({v,s})));
  return d;
}
function shuffle(d){
  for(let i=d.length-1;i>0;i--){
    let j=Math.floor(Math.random()*(i+1));
    [d[i],d[j]]=[d[j],d[i]];
  }
}
function draw(){ return deck.pop(); }

// ================== CALCOLO PUNTEGGIO ==================
function score(cards){
  let total=0, aces=0;
  cards.forEach(c=>{
    if(c.v==="A"){ total+=11; aces++; }
    else if(["K","Q","J"].includes(c.v)) total+=10;
    else total+=parseInt(c.v);
  });
  while(total>21 && aces>0){ total-=10; aces--; }
  return total;
}

// ================== UI ==================
function updateUI(){
  document.getElementById("bankroll").innerText=bankroll;
  document.getElementById("handsLeft").innerText=handsLeft;
  document.getElementById("bet").innerText=bet;
  render();
}

// ================== CHIPS ==================
document.querySelectorAll(".chip").forEach(c=>{
  c.onclick=()=>{
    if(PHASE!=="BET") return;
    let val=parseInt(c.dataset.value);
    if(bankroll>=val && bet+val<=MAX_BET){
      bankroll-=val;
      bet+=val;
      betHistory.push(val);
      updateUI();
    }
  }
});

// Undo puntata
document.getElementById("undoBtn").onclick=()=>{
  if(PHASE!=="BET") return;
  if(betHistory.length>0){
    let last=betHistory.pop();
    bet-=last;
    bankroll+=last;
    updateUI();
  }
}

// ================== DEAL ==================
document.getElementById("dealBtn").onclick=()=>{
  if(PHASE!=="BET") return;
  if(bet<MIN_BET) return alert(`Puntata minima ${MIN_BET}€`);
  if(handsLeft<=0) return alert("Hai finito le mani!");

  startRound();
};

function startRound(){
  PHASE="PLAYER";

  deck=createDeck();
  shuffle(deck);

  playerHands=[[draw(), draw()]];
  currentHand=0;

  dealerHand=[draw()];
  dealerHole=draw();

  // Seed e hash anti-cheat
  roundSeed=Math.floor(Math.random()*1e9).toString();
  roundHash=hashString(JSON.stringify({seed:roundSeed,bet:bet,deck:deck.map(c=>c.v+c.s)}));

  // Nascondi chips
  document.getElementById("chips").style.display="none";

  render();

  // BLACKJACK IMMEDIATO
  const pScore=score(playerHands[currentHand]);
  const dScore=score([dealerHand[0], dealerHole]);
  if(pScore===21){
    PHASE="DEALER";
    dealerHand.push(dealerHole);
    dealerHole=null;

    if(dScore===21) bankroll+=bet; // push
    else bankroll+=Math.floor(bet*2.5); // 3:2 payout

    handsLeft--;
    setTimeout(resetRound, RESET_DELAY);
    render();
  }
}

// ================== HIT ==================
document.getElementById("hitBtn").onclick=()=>{
  if(PHASE!=="PLAYER") return;
  const hand=playerHands[currentHand];
  hand.push(draw());
  render();

  if(score(hand)>21){
    // Bust
    setTimeout(nextHand, 500);
  }
}

// ================== STAND ==================
document.getElementById("standBtn").onclick=()=>{
  if(PHASE!=="PLAYER") return;
  nextHand();
}

// ================== DOUBLE ==================
document.getElementById("doubleBtn").onclick=()=>{
  if(PHASE!=="PLAYER") return;
  const hand=playerHands[currentHand];
  if(hand.length!==2) return alert("Double solo sulle prime 2 carte");
  if(bankroll<bet) return alert("Saldo insufficiente");

  bankroll-=bet;
  bet*=2;

  hand.push(draw());
  render();

  if(score(hand)>21){
    setTimeout(nextHand,500);
  } else {
    PHASE="DEALER";
    revealDealer();
  }
}

// ================== SPLIT ==================
document.getElementById("splitBtn").onclick=()=>{
  if(PHASE!=="PLAYER") return;
  const hand=playerHands[currentHand];
  if(hand.length!==2 || hand[0].v!==hand[1].v) return alert("Split solo se prime due carte uguali");
  if(bankroll<bet) return alert("Saldo insufficiente");

  bankroll-=bet;
  const first=[hand[0], draw()];
  const second=[hand[1], draw()];

  playerHands[currentHand]=first;
  playerHands.splice(currentHand+1,0,second);

  render();
}

// ================== MANO SUCCESSIVA ==================
function nextHand(){
  currentHand++;
  if(currentHand>=playerHands.length){
    PHASE="DEALER";
    revealDealer();
  } else {
    render();
  }
}

// ================== DEALER LOGIC ==================
function revealDealer(){
  if(PHASE!=="DEALER") return;
  dealerHand.push(dealerHole);
  dealerHole=null;
  render();

  let dealerInterval=setInterval(()=>{
    const dScore=score(dealerHand);
    if(dScore<17){
      dealerHand.push(draw());
      render();
    } else {
      clearInterval(dealerInterval);
      endRound();
    }
  }, 800);
}

// ================== FINE ROUND ==================
function endRound(){
  const dealerScore=score(dealerHand);
  playerHands.forEach(hand=>{
    const pScore=score(hand);
    if(pScore>21) return; // bust perde
    if(dealerScore>21 || pScore>dealerScore) bankroll+=bet*2;
    else if(pScore===dealerScore) bankroll+=bet;
    // altrimenti perde
  });

  handsLeft--;
  sendResultToFirebase();

  PHASE="ROUND_END";
  setTimeout(resetRound, RESET_DELAY);
}

function resetRound(){
  PHASE="BET";
  bet=0;
  betHistory=[];
  playerHands=[[]];
  dealerHand=[];
  dealerHole=null;

  document.getElementById("chips").style.display="flex";
  updateUI();

  if(handsLeft<=0){
    alert("Hai finito le mani! Non puoi più giocare.");
    document.querySelectorAll("button, .chip").forEach(el=>el.disabled=true);
  }
}

// ================== RENDER ==================
function render(){
  // Dealer
  const dealerDiv=document.getElementById("dealerCards");
  dealerDiv.innerHTML="";
  dealerHand.forEach((c,i)=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerText=c.v+c.s;
    card.style.background=["♥","♦"].includes(c.s)?"#ffdddd":"#ffffff";
    card.style.color=["♥","♦"].includes(c.s)?"red":"black";
    card.style.width="80px";
    card.style.height="120px";
    card.style.display="flex";
    card.style.justifyContent="center";
    card.style.alignItems="center";
    card.style.border="1px solid #000";
    card.style.borderRadius="8px";
    card.style.marginLeft=i===0?"0":"-30px";
    dealerDiv.appendChild(card);
  });

  // Player
  const playerDiv=document.getElementById("playerHandsArea");
  playerDiv.innerHTML="";
  playerHands.forEach(hand=>{
    const handCircle=document.createElement("div");
    handCircle.style.display="inline-flex";
    hand.forEach((c,i)=>{
      const card=document.createElement("div");
      card.className="card";
      card.innerText=c.v+c.s;
      card.style.background=["♥","♦"].includes(c.s)?"#ffdddd":"#ffffff";
      card.style.color=["♥","♦"].includes(c.s)?"red":"black";
      card.style.width="80px";
      card.style.height="120px";
      card.style.display="flex";
      card.style.justifyContent="center";
      card.style.alignItems="center";
      card.style.border="1px solid #000";
      card.style.borderRadius="8px";
      card.style.marginLeft=i===0?"0":"-30px";
      handCircle.appendChild(card);
    });
    playerDiv.appendChild(handCircle);
  });

  // Aggiorna punteggi
  const pScore=score(playerHands[currentHand]);
  const dScore=PHASE==="DEALER" ? score(dealerHand) : score([dealerHand[0]]);
  document.getElementById("playerScore").innerText=`Tu: ${pScore}`;
  document.getElementById("dealerScore").innerText=`Dealer: ${dScore}`;
}

// ================== FIREBASE ==================
function sendResultToFirebase(){
  const userId=firebase.auth().currentUser?.uid||"guest_"+Date.now();
  const username=firebase.auth().currentUser?.displayName||userId;
  firebase.database().ref("blackjack/players/"+userId).set({
    username,
    balance: bankroll,
    handsLeft,
    timestamp: Date.now(),
    hash: roundHash,
    seed: roundSeed
  });
}

// ================== ANTI-CHEAT ==================
function hashString(str){
  let hash=0;
  for(let i=0;i<str.length;i++){
    hash=((hash<<5)-hash)+str.charCodeAt(i);
    hash|=0;
  }
  return hash;
}

// ================== INIZIALIZZA ==================
updateUI()
