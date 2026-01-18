// --- Variabili principali ---
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;
let roundActive = false;

const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// --- Funzioni Deck ---
function createDeck() {
    let d = [];
    suits.forEach(s => values.forEach(v => d.push({v,s})));
    return d;
}
function shuffle(d){
    for(let i=d.length-1;i>0;i--){
        let j = Math.floor(Math.random()*(i+1));
        [d[i], d[j]]=[d[j], d[i]];
    }
}
function draw(){ return deck.pop(); }
function score(cs){
    let t=0,a=0;
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
}

// --- Gestione Chips ---
document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
        if(roundActive) return; // blocco durante mano
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
    if(roundActive) return;
    if(betHistory.length>0){
        let last = betHistory.pop();
        bet -= last;
        bankroll += last;
        updateUI();
    }
});

// --- Deal ---
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(roundActive) return;
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0) return;

    roundActive = true;
    deck = createDeck(); shuffle(deck);
    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand = 0;

    render();
});

// --- Hit ---
document.getElementById("hitBtn").addEventListener("click", ()=>{
    if(!roundActive) return;
    let hand = playerHands[currentHand];
    hand.push(draw());
    render();

    if(score(hand)>21){
        // Bust
        setTimeout(()=>{endRound();},3000);
    }
});

// --- Stand ---
document.getElementById("standBtn").addEventListener("click", ()=>{
    if(!roundActive) return;
    dealerPlay();
});

// --- Double ---
document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(!roundActive) return;
    if(bankroll < bet) return;
    bankroll -= bet;
    bet *= 2;
    playerHands[currentHand].push(draw());
    render();
    if(score(playerHands[currentHand])>21){
        setTimeout(()=>{endRound();},3000);
    } else {
        dealerPlay();
    }
});

// --- Split ---
document.getElementById("splitBtn").addEventListener("click", ()=>{
    if(!roundActive) return;
    let hand = playerHands[currentHand];
    if(hand.length===2 && hand[0].v===hand[1].v && bankroll>=bet){
        bankroll -= bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        updateUI();
        render();
    } else {
        alert("Non puoi splittare");
    }
});

// --- Dealer Gioca ---
function dealerPlay(){
    let dealerInterval = setInterval(()=>{
        if(score(dealer)<17){
            dealer.push(draw());
            render();
        } else {
            clearInterval(dealerInterval);
            setTimeout(()=>{endRound();}, 1000);
        }
    }, 500); // ogni 0.5s pesca una carta
}

// --- Fine Round ---
function endRound(){
    playerHands.forEach(hand=>{
        let p = score(hand);
        let d = score(dealer);

        if(p>21){
            // bust
        } else if(d>21 || p>d){
            bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5) : bet*2;
        }
    });

    handsLeft--;
    sendResultToFirebase();
    roundActive = false;
    bet = 0;
    playerHands=[[]];
    dealer=[];
    betHistory=[];
    updateUI();
    render();
}

// --- Render ---
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        let div = document.createElement("div");
        div.className="card";
        div.innerText = c.v+c.s;
        dealerDiv.appendChild(div);
    });
    document.getElementById("dealerScore").innerText = "Totale Dealer: "+score(dealer);

    // Player
    const playerDiv = document.getElementById("playerHandsArea");
    playerDiv.innerHTML="";
    playerHands.forEach(hand=>{
        let handCircle = document.createElement("div");
        handCircle.style.display="inline-flex";
        handCircle.style.gap="5px";
        hand.forEach(c=>{
            let div = document.createElement("div");
            div.className="card";
            div.innerText = c.v+c.s;
            handCircle.appendChild(div);
        });
        let total = document.createElement("div");
        total.innerText = "Totale: "+score(hand);
        handCircle.appendChild(total);
        playerDiv.appendChild(handCircle);
    });
}

// --- Firebase invio risultati ---
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_"+Date.now();
    firebase.database().ref("blackjack/players/"+userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now()
    });
}

// --- Inizializza UI ---
updateUI();
render();
