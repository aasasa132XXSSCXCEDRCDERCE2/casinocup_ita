// ===============================================
// GAME.JS - BLACKJACK TORNEO
// ===============================================

// --- Variabili principali ---
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;
let handInProgress = false;

const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const cardDisplay = {}; // carte disegnate in CSS (non immagini)

// --- Creazione Deck ---
function createDeck(){
    let d=[];
    suits.forEach(s=>values.forEach(v=>{
        d.push({v,s});
    }));
    return d;
}

// --- Mischia Deck ---
function shuffle(d){
    for(let i=d.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [d[i],d[j]]=[d[j],d[i]];
    }
}

// --- Pesca carta ---
function draw(){
    if(deck.length===0) deck = createDeck(); shuffle(deck);
    return deck.pop();
}

// --- Calcolo punteggio ---
function score(cs){
    let t=0, a=0;
    cs.forEach(c=>{
        if(c.v==='A'){ t+=11; a++; }
        else if(['K','Q','J'].includes(c.v)) t+=10;
        else t+=parseInt(c.v);
    });
    while(t>21 && a--) t-=10;
    return t;
}

// --- Aggiorna UI ---
function updateUI(){
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("handsLeft").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
}

// --- Mostra Chips ---
function showChips(){
    document.getElementById("chips").style.display = handInProgress ? "none" : "flex";
}

// --- Gestione puntata ---
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

// --- Deal ---
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(handInProgress) return;
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0){ alert("Torneo finito"); return; }

    handInProgress = true;
    showChips();
    deck = createDeck();
    shuffle(deck);
    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand = 0;

    render();
});

// --- Azioni Player ---
document.getElementById("hitBtn").addEventListener("click", ()=>{
    if(!handInProgress) return;
    let hand = playerHands[currentHand];
    hand.push(draw());
    if(score(hand) > 21) nextHand();
    render();
});

document.getElementById("standBtn").addEventListener("click", ()=>{
    if(!handInProgress) return;
    nextHand();
});

document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(!handInProgress || bankroll<bet) return;
    bankroll -= bet;
    bet *=2;
    playerHands[currentHand].push(draw());
    nextHand();
    updateUI();
});

document.getElementById("splitBtn").addEventListener("click", ()=>{
    if(!handInProgress) return;
    let hand = playerHands[currentHand];
    if(hand.length===2 && hand[0].v===hand[1].v && bankroll>=bet){
        bankroll -= bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        render();
        updateUI();
    } else alert("Non puoi splittare");
});

// --- Passa alla mano successiva ---
function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length){
        resolveDealer();
    } else render();
}

// --- Risolvi mano Dealer ---
function resolveDealer(){
    while(score(dealer)<17) dealer.push(draw());
    playerHands.forEach(hand=>{
        let p = score(hand);
        let d = score(dealer);
        if(p>21){} // sforato
        else if(d>21 || p>d) bankroll += (p===21 && hand.length===2) ? Math.floor(bet*2.5) : bet*2;
    });

    handsLeft--;
    sendResultToFirebase();
    resetHand();
}

// --- Reset mano ---
function resetHand(){
    bet = 0;
    playerHands = [[]];
    dealer = [];
    betHistory = [];
    handInProgress = false;
    updateUI();
    showChips();
    render();
}

// --- Render ---
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML = "";
    dealer.forEach((c,i)=>{
        const span = document.createElement("div");
        span.className = "card";
        span.innerText = i===0 ? "?" : `${c.v}${c.s}`;
        span.title = `${c.v}${c.s} - Totale: ${score(dealer.slice(0,i+1))}`;
        dealerDiv.appendChild(span);
    });

    // Player
    const playerArea = document.getElementById("playerHandsArea");
    playerArea.innerHTML = "";
    playerHands.forEach(hand=>{
        let handDiv = document.createElement("div");
        handDiv.className = "handCircle";
        hand.forEach(c=>{
            const span = document.createElement("div");
            span.className = "card";
            span.innerText = `${c.v}${c.s}`;
            handDiv.appendChild(span);
        });
        const total = document.createElement("div");
        total.innerText = `Totale: ${score(hand)}`;
        total.className = "handTotal";
        handDiv.appendChild(total);
        playerArea.appendChild(handDiv);
    });
}

// --- Invio risultati Firebase ---
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_" + Date.now();
    firebase.database().ref("blackjack/players/"+userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now()
    });
}

// --- Inizializzazione ---
updateUI();
showChips();
render();
