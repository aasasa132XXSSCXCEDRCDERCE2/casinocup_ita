// =========================
// BLACKJACK TORNEO - game.js
// =========================

// --- Variabili principali ---
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;
let roundActive = false; // blocco tasto deal fino a fine round

const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// Generazione carte testuali senza immagini
const cardSymbols = {S:'♠',H:'♥',D:'♦',C:'♣'};

// =========================
// FUNZIONI DECK
// =========================
function createDeck(){
    let d = [];
    suits.forEach(s => values.forEach(v => d.push({v,s})));
    return d;
}

function shuffle(d){
    for(let i=d.length-1; i>0; i--){
        let j = Math.floor(Math.random()*(i+1));
        [d[i], d[j]] = [d[j], d[i]];
    }
}

function draw(){
    if(deck.length === 0) deck = shuffle(createDeck());
    return deck.pop();
}

function score(hand){
    let total = 0, aces = 0;
    hand.forEach(c => {
        if(c.v === 'A'){ total+=11; aces++; }
        else if(['K','Q','J'].includes(c.v)) total+=10;
        else total+=parseInt(c.v);
    });
    while(total>21 && aces>0){ total-=10; aces--; }
    return total;
}

// =========================
// AGGIORNA UI
// =========================
function updateUI(){
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("handsLeft").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
}

// =========================
// GESTIONE CHIPS
// =========================
document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
        let val = parseInt(c.dataset.value);
        if(bankroll >= val && bet + val <= 1000){
            bet += val;
            bankroll -= val;
            betHistory.push(val);
            updateUI();
        }
    });
});

// Undo puntata
document.getElementById("undoBtn").addEventListener("click", ()=>{
    if(betHistory.length>0){
        let last = betHistory.pop();
        bet -= last;
        bankroll += last;
        updateUI();
    }
});

// =========================
// DEAL
// =========================
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(roundActive) return; // blocco finché il round non è finito
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0) { alert("Torneo finito!"); return; }

    roundActive = true;
    deck = createDeck();
    shuffle(deck);

    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand = 0;

    hideChips(true); // nascondi chips durante il round
    render();
});

// =========================
// HIT
// =========================
document.getElementById("hitBtn").addEventListener("click", ()=>{
    if(!roundActive) return;
    let hand = playerHands[currentHand];
    hand.push(draw());

    render();
    if(score(hand)>21){
        // bust
        setTimeout(()=> nextHand(), 500);
    }
});

// =========================
// STAND
// =========================
document.getElementById("standBtn").addEventListener("click", ()=>{
    if(!roundActive) return;
    nextHand();
});

// =========================
// DOUBLE
// =========================
document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(!roundActive) return;
    let hand = playerHands[currentHand];
    if(bankroll<bet){ alert("Non hai abbastanza soldi per double"); return; }

    bankroll -= bet;
    bet *= 2;
    hand.push(draw());
    render();
    setTimeout(()=> nextHand(), 500);
});

// =========================
// SPLIT
// =========================
document.getElementById("splitBtn").addEventListener("click", ()=>{
    if(!roundActive) return;
    let hand = playerHands[currentHand];
    if(hand.length===2 && hand[0].v===hand[1].v && bankroll>=bet){
        bankroll -= bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        render();
        updateUI();
    } else {
        alert("Non puoi splittare");
    }
});

// =========================
// GESTIONE MANI
// =========================
function nextHand(){
    currentHand++;
    if(currentHand >= playerHands.length){
        dealerPlay();
    } else {
        render();
    }
}

// =========================
// DEALER LOGIC AUTOMATICA
// =========================
function dealerPlay(){
    // Dealer pesca fino a 17 o più
    while(score(dealer)<17){
        dealer.push(draw());
    }

    // Calcola vincite
    playerHands.forEach(hand=>{
        let p = score(hand);
        let d = score(dealer);

        if(p>21){
            // perde
        } else if(d>21 || p>d){
            bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5) : bet*2;
        } else if(p<d){
            // perde
        } else {
            // pareggio → restituisci puntata
            bankroll += bet;
        }
    });

    handsLeft--;
    sendResultToFirebase();

    // Reset round
    bet=0;
    playerHands = [[]];
    dealer = [];
    betHistory=[];
    roundActive = false;
    hideChips(false);
    updateUI();
    render();
}

// =========================
// RENDER CARTE E VALORI
// =========================
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        const cardDiv = document.createElement("div");
        cardDiv.className="card";
        cardDiv.innerText = cardSymbols[c.s] + c.v;
        cardDiv.style.marginLeft = i*20 + "px";
        dealerDiv.appendChild(cardDiv);
    });
    // Player
    const playerDiv = document.getElementById("playerHandsArea");
    playerDiv.innerHTML="";
    playerHands.forEach(hand=>{
        const handDiv = document.createElement("div");
        handDiv.style.display="inline-flex";
        handDiv.style.gap="5px";
        hand.forEach(c=>{
            const cardDiv = document.createElement("div");
            cardDiv.className="card";
            cardDiv.innerText = cardSymbols[c.s] + c.v;
            handDiv.appendChild(cardDiv);
        });
        playerDiv.appendChild(handDiv);
    });

    // Mostra punteggio sotto le carte
    const playerScoreDiv = document.getElementById("playerScore");
    playerScoreDiv.innerText = "Totale: "+score(playerHands[currentHand]);

    const dealerScoreDiv = document.getElementById("dealerScore");
    dealerScoreDiv.innerText = "Totale: "+score(dealer);
}

// =========================
// CHIPS VISUAL
// =========================
function hideChips(hide){
    document.getElementById("chipsContainer").style.display = hide? "none":"flex";
}

// =========================
// INVIO RISULTATI FIREBASE
// =========================
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_" + Date.now();
    firebase.database().ref("blackjack/players/"+userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now(),
        seed: Math.random().toString(36).substring(2) // anti-cheat semplice
    });
}

// =========================
// INIZIALIZZA
// =========================
updateUI();
render();
