<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Blackjack Casinò Realistico</title>
<style>
body {
    margin:0; font-family:Arial,sans-serif; overflow:hidden; background:#333;
}
#table {
    width:100vw;
    height:100vh;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    background: radial-gradient(circle at center, #0b4d24 0%, #07331e 70%); /* felt verde */
    border: 40px solid #8b4513; /* bordo legno */
    border-radius: 30px;
    box-shadow: 0 0 30px rgba(0,0,0,0.5);
    position:relative;
}
.dealer, .hands {
    display:flex; justify-content:center; margin:10px;
}
.hand-circle {
    width:220px; height:160px; border-radius:50%; border:3px solid #d4af37;
    margin:0 20px; display:flex; justify-content:center; align-items:center;
    position:relative;
    background: rgba(0,0,0,0.2);
}
.hand-circle.active { box-shadow:0 0 20px #fff; }
.card {
    width:60px; height:90px; border-radius:5px; background:white;
    display:flex; justify-content:center; align-items:center;
    font-weight:bold; font-size:18px; margin-left:-20px;
    box-shadow:0 2px 6px rgba(0,0,0,0.5);
}
#chips { position:absolute; bottom:20px; display:flex; gap:10px; }
.chip { width:50px; height:50px; border-radius:50%; background:#f1c40f;
    display:flex; justify-content:center; align-items:center; font-weight:bold; cursor:pointer;
}
#ui { position:absolute; top:20px; color:white; text-align:right; right:20px; }
button { background:#d4af37; border:none; padding:8px 14px; margin:2px; cursor:pointer; border-radius:5px; }
</style>
</head>
<body>
<div id="table">
    <div class="dealer" id="dealer"></div>
    <div class="hands" id="playerHands"></div>

    <div id="chips">
        <div class="chip" data-value="50">50</div>
        <div class="chip" data-value="100">100</div>
        <div class="chip" data-value="500">500</div>
        <div class="chip" data-value="1000">1000</div>
    </div>

    <div id="ui">
        Bankroll: €<span id="balance">1000</span><br>
        Puntata: €<span id="currentBet">0</span><br>
        <button id="deal">DAI CARTE</button>
        <button id="hit">HIT</button>
        <button id="stand">STAND</button>
        <button id="split">SPLIT</button>
    </div>
</div>

<script>
// -------------------------
// STATO
// -------------------------
let balance = 1000;
let currentBet = 0;
let deck = [];
let dealerHand = [];
let playerHands = [[]];
let activeHand = 0;
let gamePhase = "betting"; // betting | playing | finished

// -------------------------
// DECK
// -------------------------
function createDeck() {
    const suits = ["♠","♥","♦","♣"];
    const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    let d = [];
    for(let s of suits) for(let v of values) d.push({s,v});
    return d.sort(()=>Math.random()-0.5);
}
function drawCard(){ return deck.pop(); }
function handValue(hand){
    let total=0, aces=0;
    for(let c of hand){
        if(c.v==="A"){total+=11; aces++;}
        else if(["K","Q","J"].includes(c.v)) total+=10;
        else total+=parseInt(c.v);
    }
    while(total>21 && aces>0){total-=10; aces--;}
    return total;
}

// -------------------------
// CHIP BUTTONS
// -------------------------
document.querySelectorAll(".chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
        if(gamePhase!=="betting") return;
        let val = parseInt(chip.dataset.value);
        if(balance>=val){ currentBet+=val; balance-=val; updateUI();}
    });
});

// -------------------------
// BUTTONS
// -------------------------
document.getElementById("deal").onclick = startGame;
document.getElementById("hit").onclick = hit;
document.getElementById("stand").onclick = stand;
document.getElementById("split").onclick = splitHand;

// -------------------------
// START GAME
// -------------------------
function startGame(){
    if(currentBet===0) { alert("Seleziona almeno una chip!"); return; }
    deck = createDeck();
    dealerHand = [drawCard(), drawCard()];
    playerHands = [[drawCard(), drawCard()]];
    activeHand = 0;
    gamePhase = "playing";
    render();
}

// -------------------------
// SPLIT
// -------------------------
function splitHand(){
    let hand = playerHands[activeHand];
    if(hand.length!==2) return;
    if(hand[0].v!==hand[1].v) return;
    if(balance<currentBet) return;
    balance -= currentBet;
    let hand1 = [hand[0], drawCard()];
    let hand2 = [hand[1], drawCard()];
    playerHands = [hand1, hand2];
    activeHand = 0;
    render();
}

// -------------------------
// HIT/STAND
// -------------------------
function hit(){
    playerHands[activeHand].push(drawCard());
    if(handValue(playerHands[activeHand])>21) nextHand();
    render();
}
function stand(){ nextHand(); }

function nextHand(){
    if(activeHand<playerHands.length-1){ activeHand++; render(); }
    else { gamePhase="finished"; dealerPlay(); render(); }
}

// -------------------------
// DEALER
// -------------------------
function dealerPlay(){
    while(handValue(dealerHand)<17) dealerHand.push(drawCard());
    // pagamenti base
    playerHands.forEach(h=>{
        let hv=handValue(h), dv=handValue(dealerHand);
        if(hv>21){ /* bust */ }
        else if(dv>21 || hv>dv) balance += currentBet*2;
        else if(hv===dv) balance += currentBet;
    });
    currentBet=0; gamePhase="betting"; updateUI();
}

// -------------------------
// RENDER
// -------------------------
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealer");
    dealerDiv.innerHTML = dealerHand.map(c=>`<div class="card">${c.v}${c.s}</div>`).join("");

    // Player Hands
    const phDiv = document.getElementById("playerHands");
    phDiv.innerHTML = "";
    playerHands.forEach((hand,i)=>{
        const circle = document.createElement("div");
        circle.className="hand-circle";
        if(i===activeHand) circle.classList.add("active");
        circle.innerHTML = hand.map(c=>`<div class="card">${c.v}${c.s}</div>`).join("");
        phDiv.appendChild(circle);
    });

    updateUI();
}

// -------------------------
// UPDATE UI
// -------------------------
function updateUI(){
    document.getElementById("balance").innerText = balance;
    document.getElementById("currentBet").innerText = currentBet;
}
</script>
</body>
</html>
