// -------------------------
// STATO DEL GIOCO
// -------------------------
let balance = 10000;      // bankroll iniziale
let currentBet = 0;        // puntata corrente
let deck = [];
let dealerHand = [];
let playerHands = [[]];
let activeHand = 0;
let gamePhase = "betting"; // betting | playing | finished
let remainingHands = 30;   // numero totale di mani

// -------------------------
// LIMITI PUNTATA
// -------------------------
const MIN_BET = 50;
const MAX_BET = 1000;

// -------------------------
// CREAZIONE E GESTIONE MAZZO
// -------------------------
const suits = ["♠","♥","♦","♣"];
const values = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function createDeck() {
    let d = [];
    suits.forEach(s => values.forEach(v => d.push({v,s})));
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
// GESTIONE CHIP
// -------------------------
document.querySelectorAll(".chip").forEach(chip=>{
    chip.addEventListener("click", ()=>{
        if(gamePhase!=="betting") return;
        let val = parseInt(chip.dataset.value);

        // Limita puntata
        if(currentBet + val > MAX_BET) {
            alert(`Puntata massima per mano: €${MAX_BET}`);
            return;
        }

        if(balance>=val){
            currentBet+=val; 
            balance-=val; 
            updateUI();
        }
    });
});

// -------------------------
// BOTTONI
// -------------------------
document.getElementById("deal").onclick = startGame;
document.getElementById("hit").onclick = hit;
document.getElementById("stand").onclick = stand;
document.getElementById("split").onclick = splitHand;

// -------------------------
// INIZIO PARTITA
// -------------------------
function startGame(){
    if(currentBet < MIN_BET){ 
        alert(`Puntata minima: €${MIN_BET}`); 
        return; 
    }
    if(remainingHands <= 0){
        alert("Hai finito tutte le mani!");
        return;
    }

    deck = createDeck();
    dealerHand = [drawCard(), drawCard()];
    playerHands = [[drawCard(), drawCard()]];
    activeHand = 0;
    gamePhase = "playing";
    render();
}

// -------------------------
// SPLIT MANI
// -------------------------
function splitHand(){
    let hand = playerHands[activeHand];
    if(hand.length!==2) return;
    if(hand[0].v!==hand[1].v) return;
    if(balance < currentBet){
        alert("Non hai abbastanza soldi per split");
        return;
    }

    balance -= currentBet; // paga seconda mano
    let hand1 = [hand[0], drawCard()];
    let hand2 = [hand[1], drawCard()];
    playerHands = [hand1, hand2];
    activeHand = 0;
    render();
}

// -------------------------
// HIT / STAND
// -------------------------
function hit(){
    playerHands[activeHand].push(drawCard());
    if(handValue(playerHands[activeHand])>21) nextHand();
    renderCards();
}

function stand(){ nextHand(); }

function nextHand(){
    if(activeHand < playerHands.length - 1){
        activeHand++;
        renderCards();
    } else {
        gamePhase="finished";
        dealerPlay();
        renderCards();
    }
}

// -------------------------
// GIOCO DEALER
// -------------------------
function dealerPlay(){
    while(handValue(dealerHand)<17) dealerHand.push(drawCard());

    playerHands.forEach(hand=>{
        let hv = handValue(hand);
        let dv = handValue(dealerHand);

        if(hv>21){ /* bust */ }
        else if(dv>21 || hv>dv) balance += currentBet*2; // vincita
        else if(hv===dv) balance += currentBet;           // pareggio
    });

    currentBet = 0;
    remainingHands--;
    gamePhase = "betting";
    updateUI();
}

// -------------------------
// RENDER
// -------------------------
function render(){
    renderCards();
    updateUI();
}

function renderCards(){
    // Dealer
    const dealerDiv = document.getElementById("dealer");
    dealerDiv.innerHTML = dealerHand.map((c,i)=>`<div class="card" style="transform:translateY(${i*5}px)">${c.v}${c.s}</div>`).join("");

    // Player Hands
    const phDiv = document.getElementById("playerHands");
    phDiv.innerHTML = "";
    playerHands.forEach((hand,i)=>{
        const circle = document.createElement("div");
        circle.className="hand-circle";
        if(i===activeHand) circle.classList.add("active");

        hand.forEach((c,j)=>{
            const cardDiv = document.createElement("div");
            cardDiv.className="card";
            cardDiv.style.transform = `translateY(${-j*10}px)`;
            cardDiv.innerText = `${c.v}${c.s}`;
            circle.appendChild(cardDiv);
        });

        phDiv.appendChild(circle);
    });
}

// -------------------------
// UPDATE UI
// -------------------------
function updateUI(){
    document.getElementById("balance").innerText = balance;
    document.getElementById("currentBet").innerText = currentBet;
    document.getElementById("hands").innerText = remainingHands;
}
