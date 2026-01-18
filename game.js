// ----------------- VARIABILI PRINCIPALI -----------------
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;
let gameOver = false;

const suits = ['♠','♥','♦','♣'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

// Seed e hash anti-cheat
let roundSeed = "";
let roundHash = "";

// ----------------- LOGICA DECK -----------------
function createDeck(){
    let d = [];
    suits.forEach(s => values.forEach(v => d.push({v,s})));
    return d;
}
function shuffle(d){
    for(let i=d.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [d[i],d[j]] = [d[j],d[i]];
    }
}
function draw(){ return deck.pop(); }

// ----------------- CALCOLO PUNTEGGIO -----------------
function score(cards){
    let total = 0;
    let aces = 0;
    cards.forEach(c=>{
        if(c.v==="A"){ total+=11; aces++; }
        else if(["K","Q","J"].includes(c.v)) total+=10;
        else total += parseInt(c.v);
    });
    while(total>21 && aces>0){ total-=10; aces--; }
    return total;
}

// ----------------- UPDATE UI -----------------
function updateUI(){
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("handsLeft").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
    render();
}

// ----------------- CHIPS -----------------
document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
        if(gameOver) return;
        let val = parseInt(c.dataset.value);
        if(bankroll>=val && bet+val <=1000){
            bet += val;
            bankroll -= val;
            betHistory.push(val);
            updateUI();
        }
    });
});

// Undo puntata
document.getElementById("undoBtn").addEventListener("click", ()=>{
    if(betHistory.length>0 && !gameOver){
        let last = betHistory.pop();
        bet -= last;
        bankroll += last;
        updateUI();
    }
});

// ----------------- DEAL -----------------
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(gameOver) return;
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0){ alert("Hai finito le mani!"); return; }

    // Deck e dealer
    deck = createDeck();
    shuffle(deck);
    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand = 0;

    // Genera seed e hash anti-cheat
    roundSeed = Math.floor(Math.random()*1e9).toString();
    roundHash = hashString(JSON.stringify({seed: roundSeed, bet: bet, deck: deck.map(c=>c.v+c.s)}));

    // Nascondi chips quando inizi
    document.getElementById("chips").style.display="none";

    updateUI();
});

// ----------------- HIT -----------------
document.getElementById("hitBtn").addEventListener("click", ()=>{
    if(gameOver) return;
    let hand = playerHands[currentHand];
    hand.push(draw());
    if(score(hand)>21){ // bust
        setTimeout(nextHand, 500);
    }
    updateUI();
});

// ----------------- STAND -----------------
document.getElementById("standBtn").addEventListener("click", ()=>{
    if(gameOver) return;
    nextHand();
});

// ----------------- DOUBLE -----------------
document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(gameOver) return;
    let hand = playerHands[currentHand];
    if(bankroll>=bet){
        bankroll -= bet;
        bet *= 2;
        hand.push(draw());
        nextHand();
        updateUI();
    } else alert("Saldo insufficiente per double");
});

// ----------------- SPLIT -----------------
document.getElementById("splitBtn").addEventListener("click", ()=>{
    if(gameOver) return;
    let hand = playerHands[currentHand];
    if(hand.length===2 && hand[0].v===hand[1].v && bankroll>=bet){
        bankroll -= bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        updateUI();
    } else alert("Non puoi splittare");
});

// ----------------- MANO SUCCESSIVA -----------------
function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length){
        resolveDealer();
    } else updateUI();
}

// ----------------- RISOLUZIONE DEALER -----------------
function resolveDealer(){
    render(true); // Mostra tutte le carte del dealer

    // Dealer automatico
    while(score(dealer)<17){
        dealer.push(draw());
        render(true);
    }

    // Calcolo vincite
    playerHands.forEach(hand=>{
        let p = score(hand);
        let d = score(dealer);
        if(p>21){} // bust perde
        else if(d>21 || p>d) bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5): bet*2;
        else if(p<d){} // perde
        else if(p===d) bankroll += bet; // pareggio restituisce puntata
    });

    handsLeft--;
    sendResultToFirebase();
    bet=0;
    playerHands=[[]];
    dealer=[]; 
    betHistory=[];
    updateUI();

    // Mostra di nuovo le chips dopo 3 secondi o fine torneo
    setTimeout(()=>{
        if(handsLeft>0){
            document.getElementById("chips").style.display="flex";
        } else {
            gameOver=true;
            alert("Hai finito tutte le mani! Non puoi più giocare.");
            document.querySelectorAll("button, .chip").forEach(el=>el.disabled=true);
        }
    }, 3000);
}

// ----------------- RENDER CARTE -----------------
function render(showDealer=false){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        const card = document.createElement("div");
        card.className="card";
        card.innerText = (i===0 && !showDealer) ? "?" : c.v+c.s;
        card.style.background = ["♥","♦"].includes(c.s)?"#ffdddd":"#ffffff";
        card.style.color = ["♥","♦"].includes(c.s)?"red":"black";
        card.style.width="80px";
        card.style.height="120px";
        card.style.display="flex";
        card.style.justifyContent="center";
        card.style.alignItems="center";
        card.style.border="1px solid #000";
        card.style.borderRadius="8px";
        card.style.marginLeft=i===0?"0":"-30px";
        dealerDiv.appendChild(card);
    });
    // Aggiorna punteggio dealer
    const dealerScore = showDealer ? score(dealer) : score([dealer[1]]);
    document.getElementById("dealerScore").innerText = "Dealer: " + dealerScore;

    // Player
    const playerDiv = document.getElementById("playerCards");
    playerDiv.innerHTML="";
    playerHands.forEach(hand=>{
        const handCircle = document.createElement("div");
        handCircle.style.display="inline-flex";
        hand.forEach((c,i)=>{
            const card = document.createElement("div");
            card.className="card";
            card.innerText = c.v+c.s;
            card.style.background = ["♥","♦"].includes(c.s)?"#ffdddd":"#ffffff";
            card.style.color = ["♥","♦"].includes(c.s)?"red":"black";
            card.style.width="80px";
            card.style.height="120px";
            card.style.display="flex";
            card.style.justifyContent="center";
            card.style.alignItems="center";
            card.style.border="1px solid #000";
            card.style.borderRadius="8px";
            card.style.marginLeft=i===0?"0":"-30px";
            handCircle.appendChild(card);
        });
        playerDiv.appendChild(handCircle);
    });

    // Aggiorna punteggio giocatore
    const currentScore = score(playerHands[currentHand]);
    document.getElementById("playerScore").innerText = "Tu: " + currentScore;
}

// ----------------- FIREBASE -----------------
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_"+Date.now();
    const username = firebase.auth().currentUser?.displayName || userId;
    firebase.database().ref("blackjack/players/"+userId).set({
        username: username,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now(),
        hash: roundHash,
        seed: roundSeed
    });
}

// ----------------- ANTI-CHEAT -----------------
function hashString(str){
    let hash=0;
    for(let i=0;i<str.length;i++){
        hash = ((hash<<5)-hash)+str.charCodeAt(i);
        hash |=0;
    }
    return hash;
}

// ----------------- INIZIALIZZA -----------------
updateUI();
