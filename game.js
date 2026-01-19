// ---------------- STATO GIOCO ----------------
const STATE = {
  WAITING_BET: "WAITING_BET",
  PLAYER_TURN: "PLAYER_TURN",
  DEALER_TURN: "DEALER_TURN",
  ROUND_END: "ROUND_END",
  GAME_OVER: "GAME_OVER"
};

let gameState = STATE.WAITING_BET;

// ---------------- VARIABILI ----------------
let bankroll = 10000;
let bet = 0;
let handsLeft = 30;

let deck = [];
let dealer = [];
let player = [];

// ---------------- COSTANTI ----------------
const suits = ["♠","♥","♦","♣"];
const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

// ---------------- DECK ----------------
function createDeck(){
  let d = [];
  suits.forEach(s=>{
    values.forEach(v=>{
      d.push({v,s});
    });
  });
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

// ---------------- SCORE ----------------
function score(cards){
  let total = 0;
  let aces = 0;

  cards.forEach(c=>{
    if(c.v==="A"){ total+=11; aces++; }
    else if(["K","Q","J"].includes(c.v)) total+=10;
    else total+=parseInt(c.v);
  });

  while(total>21 && aces>0){
    total-=10;
    aces--;
  }
  return total;
}

// ---------------- RENDER ----------------
function render(){
  const dDiv = document.getElementById("dealerCards");
  const pDiv = document.getElementById("playerCards");

  dDiv.innerHTML="";
  pDiv.innerHTML="";

  dealer.forEach((c,i)=>{
    const el = document.createElement("div");
    el.className="card "+((c.s==="♥"||c.s==="♦")?"red":"");
    el.innerText = (gameState===STATE.PLAYER_TURN && i===0) ? "?" : c.v+c.s;
    dDiv.appendChild(el);
  });

  player.forEach(c=>{
    const el = document.createElement("div");
    el.className="card "+((c.s==="♥"||c.s==="♦")?"red":"");
    el.innerText = c.v+c.s;
    pDiv.appendChild(el);
  });

  document.getElementById("playerScore").innerText = score(player);
  document.getElementById("dealerScore").innerText =
    gameState===STATE.PLAYER_TURN ? "?" : score(dealer);

  document.getElementById("bankroll").innerText = bankroll;
  document.getElementById("bet").innerText = bet;
  document.getElementById("hands").innerText = handsLeft;
}

// ---------------- PUNTATE ----------------
document.querySelectorAll(".chip").forEach(chip=>{
  chip.onclick = ()=>{
    if(gameState!==STATE.WAITING_BET) return;
    const val = parseInt(chip.dataset.value);
    if(bet+val>1000 || bankroll<val) return;
    bet+=val;
    bankroll-=val;
    render();
  };
});

// ---------------- DEAL ----------------
document.getElementById("dealBtn").onclick = ()=>{
  if(gameState!==STATE.WAITING_BET) return;
  if(bet<50) return;

  deck = createDeck();
  shuffle(deck);

  dealer = [draw(),draw()];
  player = [draw(),draw()];

  gameState = STATE.PLAYER_TURN;
  render();
};

// ---------------- HIT ----------------
document.getElementById("hitBtn").onclick = ()=>{
  if(gameState!==STATE.PLAYER_TURN) return;
  player.push(draw());
  if(score(player)>21){
    endRound();
  }
  render();
};

// ---------------- STAND ----------------
document.getElementById("standBtn").onclick = ()=>{
  if(gameState!==STATE.PLAYER_TURN) return;
  dealerTurn();
};

// ---------------- DOUBLE ----------------
document.getElementById("doubleBtn").onclick = ()=>{
  if(gameState!==STATE.PLAYER_TURN) return;
  if(bankroll<bet) return;
  bankroll-=bet;
  bet*=2;
  player.push(draw());
  dealerTurn();
};

// ---------------- DEALER ----------------
function dealerTurn(){
  gameState = STATE.DEALER_TURN;
  while(score(dealer)<17){
    dealer.push(draw());
  }
  endRound();
}

// ---------------- RISULTATO ----------------
function endRound(){
  const p = score(player);
  const d = score(dealer);

  if(p<=21){
    if(d>21 || p>d) bankroll+=bet*2;
    else if(p===d) bankroll+=bet;
  }

  handsLeft--;
  bet=0;
  gameState = handsLeft<=0 ? STATE.GAME_OVER : STATE.ROUND_END;
  render();

  setTimeout(resetRound,3000);
}

function resetRound(){
  if(gameState===STATE.GAME_OVER){
    alert("Fine gioco");
    return;
  }
  dealer=[];
  player=[];
  gameState = STATE.WAITING_BET;
  render();
}

// INIT
render();
