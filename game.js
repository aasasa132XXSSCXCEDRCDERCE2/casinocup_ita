// ================================
// --- VARIABILI PRINCIPALI ---
// ================================
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;
let gameSeed = Math.random().toString(36).substring(2,12); // anti-cheat seed

const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// ================================
// --- CREAZIONE CARTE (CSS REALISTICO) ---
// ================================
function createDeck() {
    let d = [];
    suits.forEach(s => values.forEach(v => d.push({v,s})));
    return d;
}

function shuffle(d) {
    for(let i=d.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [d[i], d[j]] = [d[j], d[i]];
    }
}

function draw(){
    return deck.pop();
}

function score(cards){
    let total=0, aces=0;
    cards.forEach(c=>{
        if(c.v==="A"){ total+=11; aces++; }
        else if("KQJ".includes(c.v)) total+=10;
        else total+=parseInt(c.v);
    });
    while(total>21 && aces>0){ total-=10; aces--; }
    return total;
}

// ================================
// --- UI UPDATE ---
// ================================
function updateUI(){
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("handsLeft").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
}

// ================================
// --- GESTIONE CHIPS ---
// ================================
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

document.getElementById("undoBtn").addEventListener("click", ()=>{
    if(betHistory.length>0){
        let last = betHistory.pop();
        bet -= last;
        bankroll += last;
        updateUI();
    }
});

// ================================
// --- DEAL ---
// ================================
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0) return;

    deck = createDeck();
    shuffle(deck);

    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand = 0;

    // Nascondi chips
    document.getElementById("chipsContainer").style.display="none";

    render();
});

// ================================
// --- AZIONI GIOCATORE ---
// ================================
document.getElementById("hitBtn").addEventListener("click", ()=>{
    let hand = playerHands[currentHand];
    hand.push(draw());
    if(score(hand)>21) nextHand();
    render();
});

document.getElementById("standBtn").addEventListener("click", ()=>{
    nextHand();
});

document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(bankroll<bet){ alert("Saldo insufficiente per double"); return; }
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
        render();
        updateUI();
    } else alert("Non puoi splittare");
});

// ================================
// --- GESTIONE MANO ---
// ================================
function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length) dealerPlay();
    else render();
}

// ================================
// --- DEALE PLAY ---
// ================================
function dealerPlay(){
    while(score(dealer)<17) dealer.push(draw());

    playerHands.forEach(hand=>{
        let p = score(hand);
        let d = score(dealer);

        if(p>21){} // perso
        else if(d>21 || p>d) bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5): bet*2;
        else if(p<d){} // perso
        else if(p===d) bankroll += bet; // push
    });

    handsLeft--;
    sendResultToFirebase();

    // Reset per la prossima mano
    bet = 0;
    playerHands = [[]];
    dealer = [];
    currentHand = 0;
    betHistory = [];

    // Rimuovi azioni e mostra chips
    document.getElementById("chipsContainer").style.display="flex";

    updateUI();
    render();
}

// ================================
// --- RENDER CARTE ---
// ================================
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        const card = document.createElement("div");
        card.className="card";
        card.innerText = c.v + c.s;
        card.style.top = `${i*10}px`;
        dealerDiv.appendChild(card);
    });

    // Giocatore
    const playerArea = document.getElementById("playerHandsArea");
    playerArea.innerHTML="";
    playerHands.forEach(hand=>{
        const handDiv = document.createElement("div");
        handDiv.style.display="inline-flex";
        handDiv.style.gap="5px";
        hand.forEach((c,i)=>{
            const card = document.createElement("div");
            card.className="card";
            card.innerText=c.v+c.s;
            card.style.marginLeft=i===0?"0":"-20px";
            handDiv.appendChild(card);
        });
        playerArea.appendChild(handDiv);
    });
}

// ================================
// --- INVIO RISULTATI A FIREBASE ---
// ================================
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_" + Date.now();
    const hash = hashHand(playerHands, dealer, gameSeed);

    firebase.database().ref("blackjack/players/"+userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        handHash: hash,
        timestamp: Date.now()
    });
}

// ================================
// --- HASH ANTI-CHEAT ---
// ================================
function hashHand(playerHands, dealer, seed){
    let str = JSON.stringify(playerHands)+JSON.stringify(dealer)+seed;
    let hash = 0;
    for(let i=0;i<str.length;i++){
        hash = ((hash<<5)-hash)+str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

// ================================
// --- INIT ---
// ================================
updateUI();
render();
