// --- Configurazione e variabili principali ---
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let selectedChip = 0;
let betHistory = [];

let deck = [];
let dealer = [];
let playerHands = [[]];
let currentHand = 0;

const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const imgs = {};
suits.forEach(s=>values.forEach(v=>{
    imgs[v+s]=`https://raw.githubusercontent.com/hayeah/playing-cards-assets/master/png/${v}${s}.png`;
}));

// --- Aggiorna UI ---
function updateUI(){
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("hands").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
}

// --- Gestione chip ---
document.querySelectorAll(".chip").forEach(btn=>{
    btn.addEventListener("click", ()=>{
        let val = parseInt(btn.dataset.value);
        if(bankroll >= val && bet + val <= 1000){ // max 1000
            bet += val;
            bankroll -= val;
            betHistory.push(val);
            updateUI();
        }
    });
});

// Undo puntata
document.getElementById("undoBet").addEventListener("click", ()=>{
    if(betHistory.length>0){
        let last = betHistory.pop();
        bet -= last;
        bankroll += last;
        updateUI();
    }
});

// --- Creazione e gestione mazzo ---
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

// --- Render carte ---
function render(){
    show("dealerCards", dealer, true);
    showPlayerHands();
}

function show(id,cards,hide=false){
    let d=document.getElementById(id); 
    d.innerHTML="";
    cards.forEach((c,i)=>{
        let img=document.createElement("img");
        img.className="card";
        img.src = (hide && i===0 && id==="dealerCards")
            ? "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Card_back_01.svg/120px-Card_back_01.svg.png"
            : imgs[c.v+c.s];
        img.style.transition = "transform 0.3s ease";
        img.style.transform = `translateY(-${i*10}px)`;
        d.appendChild(img);
    });
}

// Mostra le mani dei giocatori (split visivo)
function showPlayerHands(){
    const playerArea = document.getElementById("playerCards");
    playerArea.innerHTML = "";

    playerHands.forEach((hand,index)=>{
        let handCircle = document.createElement("div");
        handCircle.style.display = "inline-flex";
        handCircle.style.margin = "0 10px";
        handCircle.style.position = "relative";
        hand.forEach((c,i)=>{
            let img = document.createElement("img");
            img.className="card";
            img.src = imgs[c.v+c.s];
            img.style.marginLeft = i===0? "0":"-30px";
            img.style.transition = "transform 0.3s ease";
            handCircle.appendChild(img);
        });
        playerArea.appendChild(handCircle);
    });
}

// --- Azioni Giocatore ---
function deal(){
    if(bet < 50){ alert("Puntata minima 50€"); return; }
    if(handsLeft<=0) return;

    deck = createDeck(); shuffle(deck);
    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand=0;
    render();
}

function hit(){
    let hand = playerHands[currentHand];
    hand.push(draw());
    if(score(hand)>21) nextHand();
    render();
}

function stand(){ nextHand(); }

function doubleBet(){
    if(bankroll < bet) return;
    bankroll -= bet; bet *= 2;
    playerHands[currentHand].push(draw());
    nextHand();
    updateUI();
}

function split(){
    let hand = playerHands[currentHand];
    if(hand.length===2 && hand[0].v===hand[1].v && bankroll>=bet){
        bankroll -= bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        render();
        updateUI();
    } else alert("Non puoi splittare");
}

// --- Gestione mani multiple e risoluzione ---
function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length) resolveDealer();
    else render();
}

function resolveDealer(){
    while(score(dealer)<17) dealer.push(draw());
    playerHands.forEach(hand=>{
        let p = score(hand);
        let d = score(dealer);
        if(p>21) {} 
        else if(d>21 || p>d) bankroll += (p===21 && hand.length===2)? Math.floor(bet*2.5): bet*2;
    });

    handsLeft--;
    sendResultToFirebase();
    bet=0; 
    playerHands=[[]];
    dealer=[];
    betHistory=[];
    updateUI();
    render();
}

// --- Invio risultati a Firebase ---
function sendResultToFirebase(){
    const userId = firebase.auth().currentUser?.uid || "guest_" + Date.now();
    firebase.database().ref("blackjack/players/"+userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now()
    });
}
