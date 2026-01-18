// --- Variabili principali ---
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;
let handSeed = 0; // seed anti-cheat
const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const imgs = {}; // Carte non reali ma realistiche
suits.forEach(s=>values.forEach(v=>{
    imgs[v+s]=`${v}${s}`;
}));

// --- UI Elements ---
const bankrollEl = document.getElementById("bankroll");
const handsEl = document.getElementById("handsLeft");
const betEl = document.getElementById("bet");
const dealerDiv = document.getElementById("dealerCards");
const dealerScoreEl = document.getElementById("dealerScore");
const playerArea = document.getElementById("playerHandsArea");
const playerScoreEl = document.getElementById("playerScore");
const chipsDiv = document.getElementById("chips");

// --- Funzioni Deck ---
function createDeck(seed=null){
    let d = [];
    suits.forEach(s=>values.forEach(v=>d.push({v,s})));
    if(seed!==null){
        // semplice pseudo-shuffle con seed
        for(let i=d.length-1;i>0;i--){
            let j = (Math.floor((Math.sin(seed+i)*10000)) % (i+1) + i+1) % (i+1);
            [d[i],d[j]] = [d[j],d[i]];
        }
    } else shuffle(d);
    return d;
}
function shuffle(d){ for(let i=d.length-1;i>0;i--){ let j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; } }
function draw(){ return deck.pop(); }
function score(cs){
    let t=0,a=0;
    cs.forEach(c=>{
        if(c.v==="A"){t+=11;a++;}
        else if("KQJ".includes(c.v)) t+=10;
        else t+=parseInt(c.v);
    });
    while(t>21 && a--) t-=10;
    return t;
}

// --- Aggiorna UI ---
function updateUI(){
    bankrollEl.innerText = bankroll;
    handsEl.innerText = handsLeft;
    betEl.innerText = bet;
    render();
}

// --- Chips --- 
document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
        let val = parseInt(c.dataset.value);
        if(bankroll>=val && bet+val <=1000){
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

// --- Deal ---
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0) return;
    handSeed = Date.now(); // seed anti-cheat unico per mano
    deck = createDeck(handSeed);
    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand=0;
    chipsDiv.style.display="none"; // nascondi chips dopo deal
    updateUI();
});

// --- Hit ---
document.getElementById("hitBtn").addEventListener("click", ()=>{
    let hand = playerHands[currentHand];
    hand.push(draw());
    if(score(hand)>21) nextHand();
    updateUI();
});

// --- Stand ---
document.getElementById("standBtn").addEventListener("click", ()=>{
    nextHand();
});

// --- Double ---
document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(bankroll<bet) return;
    bankroll -= bet;
    bet *=2;
    playerHands[currentHand].push(draw());
    nextHand();
    updateUI();
});

// --- Split ---
document.getElementById("splitBtn").addEventListener("click", ()=>{
    let hand = playerHands[currentHand];
    if(hand.length===2 && hand[0].v===hand[1].v && bankroll>=bet){
        bankroll -= bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        updateUI();
    } else alert("Non puoi splittare");
});

// --- Gestione mano ---
function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length) resolveDealer();
    else updateUI();
}

// --- Risolvi Dealer ---
function resolveDealer(){
    while(score(dealer)<17) dealer.push(draw());
    playerHands.forEach(hand=>{
        let p = score(hand), d = score(dealer);
        if(p>21){} // bust
        else if(d>21 || p>d) bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5): bet*2;
    });
    handsLeft--;
    sendResultToFirebase();
    bet=0; playerHands=[[]]; dealer=[];
    betHistory=[];
    chipsDiv.style.display="flex"; // riattiva chips
    updateUI();
}

// --- Render ---
function render(){
    // Dealer
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        let div = document.createElement("div");
        div.className="card";
        div.innerText = (i===0)? "?" : c.v+c.s;
        div.style.transform = `translateY(-${i*10}px)`;
        dealerDiv.appendChild(div);
    });
    dealerScoreEl.innerText = `Dealer: ${score(dealer)}`;

    // Player
    playerArea.innerHTML="";
    playerHands.forEach(hand=>{
        let handDiv = document.createElement("div");
        handDiv.style.display="inline-flex";
        handDiv.style.gap="0px";
        hand.forEach((c,i)=>{
            let div = document.createElement("div");
            div.className="card";
            div.innerText = c.v+c.s;
            div.style.marginLeft = i===0?"0":"-30px";
            div.style.transform = `translateY(-${i*5}px)`;
            handDiv.appendChild(div);
        });
        playerArea.appendChild(handDiv);
    });
    playerScoreEl.innerText = `Tu: ${score(playerHands[currentHand])}`;
}

// --- Firebase ---
// invio risultato mano, con seed anti-cheat
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_"+Date.now();
    firebase.database().ref("blackjack/players/"+userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now(),
        handSeed: handSeed
    });
}

// --- Inizializza UI ---
updateUI();
