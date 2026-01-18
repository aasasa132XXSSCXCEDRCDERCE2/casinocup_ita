// -------------------------
// STATO DEL GIOCO
// -------------------------
let balance = 10000;
let currentBet = 0;
let deck = [];
let dealerHand = [];
let playerHands = [[]];
let activeHand = 0;
let gamePhase = "betting"; // betting | playing | finished
const MIN_BET = 50;
const MAX_BET = 1000;
let handsLeft = 30;

// -------------------------
// CREAZIONE MAZZO
// -------------------------
const suits = ["♠","♥","♦","♣"];
const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function createDeck(){
    let d=[];
    suits.forEach(s=>values.forEach(v=>d.push({v,s})));
    return d.sort(()=>Math.random()-0.5); // shuffle semplice
}

function drawCard(){ return deck.pop(); }

function handValue(hand){
    let total=0, aces=0;
    hand.forEach(c=>{
        if(c.v==="A"){ total+=11; aces++; }
        else if(["K","Q","J"].includes(c.v)) total+=10;
        else total+=parseInt(c.v);
    });
    while(total>21 && aces>0){ total-=10; aces--; }
    return total;
}

// -------------------------
// FIREBASE DATABASE
// -------------------------
const dbRef = firebase.database().ref("blackjack/players");

function sendResultToFirebase(){
    const playerId = localStorage.getItem("playerId") || Date.now().toString();
    localStorage.setItem("playerId", playerId);

    dbRef.child(playerId).set({
        balance: balance,
        handsLeft: handsLeft,
        timestamp: Date.now()
    });
}

// -------------------------
// GESTIONE CHIP
// -------------------------
function selectChip(val){
    if(gamePhase!=="betting") return;
    if(balance < val) return alert("Non hai abbastanza soldi!");
    if(currentBet + val > MAX_BET) return alert("Puntata massima: €"+MAX_BET);
    balance -= val;
    currentBet += val;
    updateUI();
}

// -------------------------
// BOTTONI
// -------------------------
document.getElementById("deal").onclick = startGame;
document.getElementById("hit").onclick = hit;
document.getElementById("stand").onclick = stand;
document.getElementById("double").onclick = doubleBet;
document.getElementById("split").onclick = splitHand;

// -------------------------
// INIZIO PARTITA
// -------------------------
function startGame(){
    if(currentBet < MIN_BET){ alert("Puntata minima: €"+MIN_BET); return; }
    if(handsLeft<=0){ alert("Hai finito tutte le mani!"); return; }

    deck = createDeck();
    dealerHand = [drawCard(), drawCard()];
    playerHands = [[drawCard(), drawCard()]];
    activeHand = 0;
    gamePhase = "playing";
    renderHands();
}

// -------------------------
// SPLIT
// -------------------------
function splitHand(){
    let hand = playerHands[activeHand];
    if(hand.length===2 && hand[0].v===hand[1].v && balance >= currentBet){
        balance -= currentBet;
        let newHand = [hand.pop(), drawCard()];
        hand.push(drawCard());
        playerHands.splice(activeHand+1,0,newHand);
        renderHands();
    } else {
        alert("Non puoi splittare");
    }
}

// -------------------------
// AZIONI
// -------------------------
function hit(){
    let hand = playerHands[activeHand];
    hand.push(drawCard());
    if(handValue(hand)>21) nextHand();
    renderHands();
}

function stand(){nextHand();}

function doubleBet(){
    if(balance < currentBet) return alert("Non abbastanza soldi per DOUBLE");
    balance -= currentBet;
    currentBet *= 2;
    playerHands[activeHand].push(drawCard());
    nextHand();
}

// -------------------------
// PASSA ALLA MANO SUCCESSIVA
// -------------------------
function nextHand(){
    activeHand++;
    if(activeHand >= playerHands.length) resolveDealer();
    else renderHands();
}

// -------------------------
// RISOLUZIONE
// -------------------------
function resolveDealer(){
    while(handValue(dealerHand)<17) dealerHand.push(drawCard());

    playerHands.forEach(hand=>{
        let p = handValue(hand);
        let d = handValue(dealerHand);

        if(p>21){} // perde
        else if(d>21 || p> d){ balance += currentBet*2; } // vince
        else if(p===d){ balance += currentBet; } // pareggio
        // else perde
    });

    handsLeft--;
    currentBet = 0;
    playerHands = [[]];
    activeHand = 0;
    gamePhase = "betting";
    renderHands();
    updateUI();
    sendResultToFirebase(); // invia risultati
}

// -------------------------
// RENDERING DELLE MANI
// -------------------------
function renderHands(){
    const dealerDiv = document.getElementById("dealerCards");
    const playerDiv = document.getElementById("playerCards");

    // Dealer
    dealerDiv.innerHTML = "";
    dealerHand.forEach((c,i)=>{
        const card = document.createElement("div");
        card.className = "card";
        card.innerText = (i===0 && gamePhase==="playing") ? "?" : c.v+c.s;
        dealerDiv.appendChild(card);
    });

    // Player Hands (split)
    playerDiv.innerHTML = "";
    playerHands.forEach((hand,index)=>{
        const handCircle = document.createElement("div");
        handCircle.style.display="inline-block";
        handCircle.style.margin="0 5px";
        handCircle.style.padding="10px";
        handCircle.style.border="2px solid #8B4513"; // legno
        handCircle.style.borderRadius="50%";
        handCircle.style.background="#006400"; // felt verde
        handCircle.style.minWidth="80px";

        hand.forEach(c=>{
            const card = document.createElement("div");
            card.className="card";
            card.innerText = c.v+c.s;
            handCircle.appendChild(card);
        });
        playerDiv.appendChild(handCircle);
    });
}

// -------------------------
// AGGIORNA UI
// -------------------------
function updateUI(){
    document.getElementById("bankroll").innerText = balance;
    document.getElementById("hands").innerText = handsLeft;
    document.getElementById("bet").innerText = currentBet;
}
