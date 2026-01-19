// ----------------- VARIABILI PRINCIPALI -----------------
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];
let deck = [];
let dealer = [];
let player = [];
let gameOver = false;
let gameState = "WAITING_BET"; // WAITING_BET, PLAYER_TURN, ROUND_END, GAME_OVER

const suits = ['♠','♥','♦','♣'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

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

// ----------------- GESTIONE CHIPS -----------------
document.querySelectorAll(".chip").forEach(c=>{
    c.addEventListener("click", ()=>{
        if(gameState !== "WAITING_BET") return;
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
    if(gameState !== "WAITING_BET") return;
    if(betHistory.length>0){
        let last = betHistory.pop();
        bet -= last;
        bankroll += last;
        updateUI();
    }
});

// ----------------- DEAL -----------------
document.getElementById("dealBtn").addEventListener("click", ()=>{
    if(gameState !== "WAITING_BET") return;
    if(bet<50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0){ alert("Hai finito le mani!"); return; }

    deck = createDeck();
    shuffle(deck);
    dealer = [draw(), draw()];
    player = [draw(), draw()];

    gameState = "PLAYER_TURN";

    document.getElementById("chips").style.display="none";

    updateUI();
});

// ----------------- HIT -----------------
document.getElementById("hitBtn").addEventListener("click", ()=>{
    if(gameState !== "PLAYER_TURN") return;
    player.push(draw());
    if(score(player)>21){ // bust
        setTimeout(endRound,500);
    }
    updateUI();
});

// ----------------- STAND -----------------
document.getElementById("standBtn").addEventListener("click", ()=>{
    if(gameState !== "PLAYER_TURN") return;
    endRound();
});

// ----------------- DOUBLE -----------------
document.getElementById("doubleBtn").addEventListener("click", ()=>{
    if(gameState !== "PLAYER_TURN") return;
    if(bankroll>=bet){
        bankroll -= bet;
        bet *=2;
        player.push(draw());
        setTimeout(endRound,500);
    } else alert("Saldo insufficiente per double");
});

// ----------------- FINE ROUND -----------------
function endRound(){
    gameState="ROUND_END";

    // Dealer automatico
    while(score(dealer)<17){
        dealer.push(draw());
    }

    const playerScore = score(player);
    const dealerScore = score(dealer);

    // Calcolo vincite
    if(playerScore>21){
        // bust, perde
    } else if(dealerScore>21 || playerScore>dealerScore){
        bankroll += bet*2;
    } else if(playerScore===dealerScore){
        bankroll += bet; // pareggio
    } // else perde

    handsLeft--;
    sendResultToFirebase();

    updateUI();

    // Reset round dopo 3 secondi
    setTimeout(()=>{
        if(handsLeft<=0){
            gameOver=true;
            alert("Hai finito tutte le mani!");
            document.querySelectorAll("button, .chip").forEach(el=>el.disabled=true);
            return;
        }
        player=[];
        dealer=[];
        bet=0;
        betHistory=[];
        gameState="WAITING_BET";
        document.getElementById("chips").style.display="flex";
        updateUI();
    },3000);
}

// ----------------- RENDER -----------------
function render(){
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML="";
    dealer.forEach((c,i)=>{
        const card = document.createElement("div");
        card.className="card";
        card.innerText = c.v+c.s;
        card.style.background = ["♥","♦"].includes(c.s)?"#ffdddd":"#ffffff";
        card.style.color = ["♥","♦"].includes(c.s)?"red":"black";
        card.style.width="50px";
        card.style.height="70px";
        card.style.display="flex";
        card.style.justifyContent="center";
        card.style.alignItems="center";
        card.style.border="1px solid #000";
        card.style.borderRadius="5px";
        card.style.marginLeft=i===0?"0":"-20px";
        dealerDiv.appendChild(card);
    });

    // Player
    const playerDiv = document.getElementById("playerCards");
    playerDiv.innerHTML="";
    player.forEach((c,i)=>{
        const card = document.createElement("div");
        card.className="card";
        card.innerText = c.v+c.s;
        card.style.background = ["♥","♦"].includes(c.s)?"#ffdddd":"#ffffff";
        card.style.color = ["♥","♦"].includes(c.s)?"red":"black";
        card.style.width="50px";
        card.style.height="70px";
        card.style.display="flex";
        card.style.justifyContent="center";
        card.style.alignItems="center";
        card.style.border="1px solid #000";
        card.style.borderRadius="5px";
        card.style.marginLeft=i===0?"0":"-20px";
        playerDiv.appendChild(card);
    });

    // Aggiorna punteggi
    document.getElementById("dealerScore").innerText = "Dealer: "+score(dealer);
    document.getElementById("playerScore").innerText = "Tu: "+score(player);
}

// ----------------- FIREBASE -----------------
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_"+Date.now();
    const username = firebase.auth().currentUser?.displayName || userId;
    firebase.database().ref("blackjack/players/"+userId).set({
        username: username,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now()
    });
}

// Inizializza UI
updateUI();
