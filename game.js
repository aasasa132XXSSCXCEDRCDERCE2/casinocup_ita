// ---------------- STATO ----------------
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;

let deck = [];
let dealer = [];
let player = [];

let gameState = "BETTING"; // BETTING | PLAYER | DEALER | END

// ---------------- DECK ----------------
const suits = ["♠","♥","♦","♣"];
const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function createDeck(){
  deck = [];
  suits.forEach(s=>{
    values.forEach(v=>{
      deck.push({v,s});
    });
  });
  deck.sort(()=>Math.random()-0.5);
}

function draw(){
  return deck.pop();
}

// ---------------- SCORE ----------------
function score(hand){
  let total = 0, aces = 0;
  hand.forEach(c=>{
    if(c.v==="A"){ total+=11; aces++; }
    else if(["K","Q","J"].includes(c.v)) total+=10;
    else total+=parseInt(c.v);
  });
  while(total>21 && aces>0){ total-=10; aces--; }
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
    el.className="card";
    el.textContent = (gameState==="PLAYER" && i===0) ? "?" : c.v+c.s;
    dDiv.appendChild(el);
  });

  player.forEach(c=>{
    const el = document.createElement("div");
    el.className="card";
    el.textContent = c.v+c.s;
    pDiv.appendChild(el);
  });

  document.getElementById("playerScore").innerText = score(player);
  document.getElementById("dealerScore").innerText =
    gameState==="PLAYER" ? "?" : score(dealer);

  document.getElementById("bankroll").innerText = bankroll;
  document.getElementById("handsLeft").innerText = handsLeft;
  document.getElementById("bet").innerText = bet;
}

// ---------------- CHIP ----------------
document.querySelectorAll(".chip").forEach(c=>{
  c.onclick = ()=>{
    if(gameState!=="BETTING") return;
    const v = parseInt(c.dataset.value);
    if(bankroll>=v){
      bankroll-=v;
      bet+=v;
      render();
    }
  };
});

// ---------------- DEAL ----------------
document.getElementById("dealBtn").onclick = ()=>{
  if(gameState!=="BETTING") return;
  if(bet<50) return alert("Minimo 50€");
  if(handsLeft<=0) return;

  createDeck();
  dealer=[draw(),draw()];
  player=[draw(),draw()];
  gameState="PLAYER";
  render();
};

// ---------------- HIT ----------------
document.getElementById("hitBtn").onclick = ()=>{
  if(gameState!=="PLAYER") return;
  player.push(draw());
  if(score(player)>21) endRound();
  render();
};

// ---------------- STAND ----------------
document.getElementById("standBtn").onclick = ()=>{
  if(gameState!=="PLAYER") return;
  gameState="DEALER";
  while(score(dealer)<17){
    dealer.push(draw());
  }
  endRound();
};

// ---------------- END ----------------
function endRound(){
  gameState="END";
  let p=score(player), d=score(dealer);

  if(p<=21){
    if(d>21 || p>d) bankroll+=bet*2;
    else if(p===d) bankroll+=bet;
  }

  handsLeft--;
  bet=0;
  render();

  setTimeout(()=>{
    dealer=[];
    player=[];
    gameState="BETTING";
    render();
  },3000);
}

// INIT
render();
