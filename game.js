// --- Variabili principali ---
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;

// Semi e valori carte
const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// --- Creazione deck ---
function createDeck(){
    let d = [];
    suits.forEach(s => values.forEach(v => d.push({v,s})));
    return d;
}

// --- Mischia deck ---
function shuffle(d){
    for(let i=d.length-1;i>0;i--){
        let j = Math.floor(Math.random()*(i+1));
        [d[i], d[j]] = [d[j], d[i]];
    }
}

// --- Pesca carta ---
function draw(){ return deck.pop(); }

// --- Calcolo punteggio mano ---
function score(hand){
    let total = 0, aces = 0;
    hand.forEach(c=>{
        if(c.v==="A"){ total+=11; aces++; }
        else if("KQJ".includes(c.v)) total+=10;
        else total+=parseInt(c.v);
    });
    while(total>21 && aces>0){ total-=10; aces--; }
    return total;
}

// --- Aggiorna UI ---
function updateUI(){
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("handsLeft").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
}

// --- Gestione Chips ---
document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
        let val = parseInt(c.dataset.value);
        if(bankroll>=val && bet+val <= 1000){
            bet += val;
            bankroll -= val;
            betHistory.push(val);
            updateUI();
        }
    });
});

// --- Undo puntata ---
document.getElementById("undoBtn").addEventListener("click", ()=>{
    if(betHistory.length>0){
        let last = betHistory.pop();
        bet -= last;
        bankroll += last;
        updateUI();
    }
});

// --- DEAL ---
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0) return;
    deck = createDeck();
    shuffle(deck);
    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand=0;
    hideChips();
    render();
});

// --- HIT ---
document.getElementById("hitBtn").addEventListener("click", ()=>{
    let hand = playerHands[currentHand];
    hand.push(draw());
    if(score(hand)>21) nextHand();
    render();
});

// --- STAND ---
document.getElementById("standBtn").addEventListener("click", ()=>{
    nextHand();
});

// --- DOUBLE ---
document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(bankroll<bet) return;
    bankroll -= bet;
    bet *= 2;
    let hand = playerHands[currentHand];
    hand.push(draw());
    nextHand();
});

// --- SPLIT ---
document.getElementById("splitBtn").addEventListener("click", ()=>{
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

// --- Nasconde chips dopo DEAL ---
function hideChips(){
    document.getElementById("chips").style.display="none";
}

// --- Mostra chips per nuova mano ---
function showChips(){
    document.getElementById("chips").style.display="flex";
}

// --- Passa alla mano successiva ---
function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length) resolveDealer();
    else render();
}

// --- Dealer automatico ---
function resolveDealer(){
    while(score(dealer)<17) dealer.push(draw());
    playerHands.forEach(hand=>{
        let p = score(hand);
        let d = score(dealer);
        if(p>21){}
        else if(d>21 || p>d) bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5): bet*2;
    });
    handsLeft--;
    sendResultToFirebase();
    resetHand();
}

// --- Reset mano ---
function resetHand(){
    bet=0;
    playerHands=[[]];
    dealer=[];
    betHistory=[];
    updateUI();
    render();
    showChips();
}

// --- Render ---
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        const cardDiv = document.createElement("div");
        cardDiv.className="card";
        cardDiv.innerText = (i===0 && playerHands[currentHand]) ? "?" : c.v+c.s;
        const spanScore = document.getElementById("dealerScore");
        spanScore.innerText = (i===0 && playerHands[currentHand]) ? "" : "Totale: "+score(dealer);
        dealerDiv.appendChild(cardDiv);
    });
    // Player
    const playerDiv = document.getElementById("playerHandsArea");
    playerDiv.innerHTML="";
    playerHands.forEach(hand=>{
        const handCircle = document.createElement("div");
        handCircle.style.display="inline-flex";
        handCircle.style.gap="0px";
        hand.forEach((c,i)=>{
            const cardDiv = document.createElement("div");
            cardDiv.className="card";
            cardDiv.innerText = c.v+c.s;
            handCircle.appendChild(cardDiv);
        });
        playerDiv.appendChild(handCircle);
    });
    // Player score
    const playerScoreDiv = document.getElementById("playerScore");
    playerScoreDiv.innerText = "Totale: "+score(playerHands[currentHand]);
}

// --- Anti-cheat & Firebase ---
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_"+Date.now();
    const username = firebase.auth().currentUser?.displayName || userId;
    const hash = btoa(JSON.stringify({handsLeft, bankroll, timestamp: Date.now()})); // semplice hash
    firebase.database().ref("blackjack/players/"+userId).set({
        username: username,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now(),
        hash: hash
    });
}

// --- Inizializza UI ---
updateUI();
render();
