// --- Variabili principali ---
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;

const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// Carte "realistiche" disegnate tramite HTML/CSS
function createCardDiv(card){
    let div = document.createElement("div");
    div.className = "card";
    div.innerText = card.v + card.s;
    return div;
}

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
function score(hand){
    let t=0, aces=0;
    hand.forEach(c=>{
        if(c.v==="A"){ t+=11; aces++; }
        else if("KQJ".includes(c.v)) t+=10;
        else t+=parseInt(c.v);
    });
    while(t>21 && aces--) t-=10;
    return t;
}

// --- UI ---
function updateUI(){
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("handsLeft").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
    render();
}

// --- Gestione Chips ---
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

// --- Azioni ---
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(bet < 50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0){ alert("Torneo finito!"); return; }

    deck = createDeck();
    shuffle(deck);

    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand = 0;

    // Nascondi chips per spazio azioni
    document.getElementById("chipsContainer").style.display="none";

    updateUI();
    render();
});

document.getElementById("hitBtn").addEventListener("click", ()=>{
    let hand = playerHands[currentHand];
    hand.push(draw());
    if(score(hand) > 21){
        alert("Hai sballato!");
        nextHand();
    }
    updateUI();
});

document.getElementById("standBtn").addEventListener("click", ()=>{
    nextHand();
});

document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(bankroll<bet){ alert("Saldo insufficiente!"); return; }
    bankroll -= bet;
    bet *= 2;
    let hand = playerHands[currentHand];
    hand.push(draw());
    nextHand();
    updateUI();
});

document.getElementById("splitBtn").addEventListener("click", ()=>{
    let hand = playerHands[currentHand];
    if(hand.length===2 && hand[0].v===hand[1].v && bankroll>=bet){
        bankroll -= bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        updateUI();
        render();
    } else { alert("Non puoi splittare"); }
});

// --- Gestione mani ---
function nextHand(){
    currentHand++;
    if(currentHand >= playerHands.length){
        resolveDealer();
    } else {
        updateUI();
    }
}

function resolveDealer(){
    while(score(dealer)<17) dealer.push(draw());

    playerHands.forEach(hand=>{
        let p = score(hand);
        let d = score(dealer);

        if(p>21){
            // Giocatore sballato, perde
        } else if(d>21 || p>d){
            bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5) : bet*2;
        }
        // Se pareggio o perde, non cambia bankroll
    });

    handsLeft--;
    sendResultToFirebase();
    bet = 0;
    playerHands = [[]];
    dealer = [];
    currentHand = 0;
    betHistory = [];

    // Mostra di nuovo chips per nuova puntata
    document.getElementById("chipsContainer").style.display="flex";

    updateUI();
}

// --- Render ---
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        let cardDiv = createCardDiv(c);
        if(i===0 && playerHands[currentHand]) cardDiv.style.background="#444"; // coperta
        dealerDiv.appendChild(cardDiv);
    });

    // Player
    const playerArea = document.getElementById("playerHandsArea");
    playerArea.innerHTML="";
    playerHands.forEach(hand=>{
        let handDiv = document.createElement("div");
        handDiv.style.display="flex";
        handDiv.style.gap="5px";
        hand.forEach(c=>{
            handDiv.appendChild(createCardDiv(c));
        });
        playerArea.appendChild(handDiv);
    });

    // Totale giocatore
    if(playerHands[currentHand])
        document.getElementById("playerScore").innerText = "Totale: " + score(playerHands[currentHand]);
    else
        document.getElementById("playerScore").innerText = "Totale: 0";

    // Totale dealer (solo se fine mano)
    document.getElementById("dealerScore").innerText = "Dealer: " + (dealer.length>0? score(dealer) : "?");
}

// --- Anti-cheat + Firebase ---
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_"+Date.now();
    // Hash mano
    const hash = btoa(JSON.stringify(playerHands)+Date.now());

    firebase.database().ref("blackjack/players/"+userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        handHash: hash,
        timestamp: Date.now()
    });
}

// --- Inizializza UI ---
updateUI();
