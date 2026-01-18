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
let seed = Date.now(); // seed anti-cheat univoco per sessione

// --- Creazione Deck ---
function createDeck(seedOverride=null){
    let d = [];
    suits.forEach(s=>values.forEach(v=>{
        d.push({v,s});
    }));
    if(seedOverride) shuffle(d, seedOverride);
    else shuffle(d);
    return d;
}

// --- Shuffle con seed ---
function shuffle(array, seedOverride=null){
    let s = seedOverride || seed;
    for(let i=array.length-1;i>0;i--){
        s = (s * 9301 + 49297) % 233280;
        let j = Math.floor(s / 233280 * (i+1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Draw ---
function draw(){ return deck.pop(); }

// --- Calcolo punteggio ---
function score(cs){
    let t=0, a=0;
    cs.forEach(c=>{
        if(c.v==="A"){ t+=11; a++; }
        else if("KQJ".includes(c.v)) t+=10;
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
    document.getElementById("playerScore").innerText = playerHands[currentHand]? score(playerHands[currentHand]): 0;
    document.getElementById("dealerScore").innerText = dealer.length>1? score(dealer): 0;
}

// --- Gestione Chips ---
document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
        let val = parseInt(c.dataset.value);
        if(bankroll>=val && bet+val<=1000){
            bet+=val; bankroll-=val; betHistory.push(val);
            updateUI();
        }
    });
});

// --- Undo puntata ---
document.getElementById("undoBtn").addEventListener("click", ()=>{
    if(betHistory.length>0){
        let last = betHistory.pop();
        bet-=last;
        bankroll+=last;
        updateUI();
    }
});

// --- DEAL ---
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0) return;
    deck = createDeck(Date.now());
    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand=0;
    render();
    hideChips();
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
    if(bankroll<bet) { alert("Non hai soldi sufficienti"); return; }
    bankroll-=bet;
    bet*=2;
    playerHands[currentHand].push(draw());
    nextHand();
    updateUI();
});

// --- SPLIT ---
document.getElementById("splitBtn").addEventListener("click", ()=>{
    let hand = playerHands[currentHand];
    if(hand.length===2 && hand[0].v===hand[1].v && bankroll>=bet){
        bankroll-=bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        render();
        updateUI();
    } else alert("Non puoi splittare");
});

// --- Gestione mani ---
function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length) resolveDealer();
    else render();
}

// --- Risoluzione dealer automatica ---
function resolveDealer(){
    while(score(dealer)<17) dealer.push(draw());
    // calcolo vincite
    playerHands.forEach(hand=>{
        let p=score(hand), d=score(dealer);
        if(p>21) {} // bust
        else if(d>21 || p>d) bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5): bet*2;
    });
    handsLeft--;
    sendResultToFirebase();
    bet=0;
    dealer=[]; playerHands=[[]]; betHistory=[];
    updateUI();
    showChips();
    render();
}

// --- Render del tavolo ---
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        const div = document.createElement("div");
        div.className="card";
        div.innerText = (i===0) ? "?" : c.v+c.s;
        div.style.transform=`translateY(-${i*10}px)`;
        dealerDiv.appendChild(div);
    });
    // Player
    const playerArea = document.getElementById("playerHandsArea");
    playerArea.innerHTML="";
    playerHands.forEach(hand=>{
        const handCircle = document.createElement("div");
        handCircle.style.display="inline-flex";
        handCircle.style.gap="0px";
        hand.forEach((c,i)=>{
            const div = document.createElement("div");
            div.className="card";
            div.innerText = c.v+c.s;
            div.style.marginLeft = i===0? "0":"-25px";
            div.style.transform=`translateY(-${i*5}px)`;
            handCircle.appendChild(div);
        });
        playerArea.appendChild(handCircle);
    });
    updateUI();
}

// --- Mostra/Nascondi chips ---
function hideChips(){ document.getElementById("chips").style.display="none"; }
function showChips(){ document.getElementById("chips").style.display="flex"; }

// --- Invio risultati a Firebase ---
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_" + Date.now();
    const username = firebase.auth().currentUser?.displayName || userId;
    const data = {
        username: username,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now(),
        seed: seed
    };
    firebase.database().ref("blackjack/players/"+userId).set(data);
}

// --- Anti-cheat e blocco multi-account/reload ---
window.addEventListener("beforeunload", function(e){
    localStorage.setItem("blackjack_played","true");
});
if(localStorage.getItem("blackjack_played")){
    alert("Hai già giocato in questa sessione. Non puoi rientrare.");
    document.body.innerHTML="<h1 style='color:white; text-align:center;'>Sessione terminata</h1>";
}

// --- Inizializza UI ---
updateUI();
showChips();
