// --- Variabili principali ---
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;
const suits = ['♠','♥','♦','♣'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// --- Anti-cheat base ---
function hashHand(hand){ return hand.map(c=>c.v+c.s).sort().join("-"); }

// --- Aggiorna UI ---
function updateUI(){
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("handsLeft").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
}

// --- Chips cliccabili ---
document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
        let val = parseInt(c.dataset.value);
        if(bankroll >= val && bet + val <= 1000){
            bet += val;
            bankroll -= val;
            betHistory.push(val);
            updateUI();
        } else if(bet + val > 1000){
            alert("Hai superato la puntata massima: perdi la mano!");
            resetHand();
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

// --- Deck ---
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

// --- Score ---
function score(cs){
    let total=0, aces=0;
    cs.forEach(c=>{
        if(c.v==="A"){ total+=11; aces++; }
        else if(["K","Q","J"].includes(c.v)) total+=10;
        else total+=parseInt(c.v);
    });
    while(total>21 && aces>0){ total-=10; aces--; }
    return total;
}

// --- Deal ---
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0){ alert("Torneo finito!"); return; }
    deck = createDeck(); shuffle(deck);
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
    if(score(hand)>21){
        alert("Hai sballato!");
        nextHand();
    }
    render();
});

// --- STAND ---
document.getElementById("standBtn").addEventListener("click", ()=>{
    nextHand();
});

// --- DOUBLE ---
document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(bankroll<bet){ alert("Non hai abbastanza soldi per DOUBLE"); return; }
    bankroll -= bet; 
    bet *= 2;
    playerHands[currentHand].push(draw());
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
    } else alert("Non puoi SPLITTARE");
});

// --- Funzione reset mano se punti oltre max ---
function resetHand(){
    bet=0;
    betHistory=[];
    updateUI();
}

// --- Gestione mani ---
function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length) resolveDealer();
    else render();
}

// --- Risoluzione dealer ---
function resolveDealer(){
    while(score(dealer)<17) dealer.push(draw());

    playerHands.forEach(hand=>{
        let p = score(hand), d = score(dealer);
        if(p>21){ /* perso */ }
        else if(d>21 || p>d) bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5): bet*2;
    });

    handsLeft--;
    sendResultToFirebase();
    bet=0; playerHands=[[]]; dealer=[]; betHistory=[]; currentHand=0;
    showChips();
    updateUI();
    render();
}

// --- Mostra/Nascondi chips ---
function hideChips(){
    document.getElementById("chipsContainer").style.display="none";
}
function showChips(){
    document.getElementById("chipsContainer").style.display="flex";
}

// --- Render carte ---
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        let div = document.createElement("div");
        div.className="card "+((c.s==="♥"||c.s==="♦")?"red":"black");
        div.innerText = i===0 ? "?" : c.v+c.s;
        dealerDiv.appendChild(div);
    });

    // Player
    const playerArea = document.getElementById("playerHandsArea");
    playerArea.innerHTML="";
    playerHands.forEach(hand=>{
        let handCircle = document.createElement("div");
        handCircle.style.display="inline-flex";
        handCircle.style.margin="5px";
        hand.forEach(c=>{
            let div = document.createElement("div");
            div.className="card "+((c.s==="♥"||c.s==="♦")?"red":"black");
            div.innerText = c.v+c.s;
            handCircle.appendChild(div);
        });
        playerArea.appendChild(handCircle);
    });

    // Punteggi
    document.getElementById("playerScore").innerText = "Totale: "+score(playerHands[currentHand]);
    let dealerScore = dealer.length>0 ? score(dealer) : 0;
    document.getElementById("dealerScore").innerText = "Dealer: "+(dealer.length>0 ? dealerScore : "?");
}

// --- Invio Firebase ---
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_"+Date.now();
    firebase.database().ref("blackjack/players/"+userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now(),
        handHash: playerHands.map(h=>hashHand(h))
    });
}

// --- Inizializza ---
updateUI();
render();
showChips();
