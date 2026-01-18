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
const imgs = {};

// Caricamento immagini carte
suits.forEach(s => values.forEach(v => {
    imgs[v + s] = `https://raw.githubusercontent.com/hayeah/playing-cards-assets/master/png/${v}${s}.png`;
}));

// --- Funzioni Deck ---
function createDeck() {
    let d = [];
    suits.forEach(s => values.forEach(v => d.push({v, s})));
    return d;
}
function shuffle(d) {
    for (let i = d.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
    }
}
function draw() { return deck.pop(); }
function score(cs) {
    let t = 0, a = 0;
    cs.forEach(c => {
        if (c.v === "A") { t += 11; a++; }
        else if ("KQJ".includes(c.v)) t += 10;
        else t += parseInt(c.v);
    });
    while (t > 21 && a--) t -= 10;
    return t;
}

// --- Aggiorna UI ---
function updateUI() {
    document.getElementById("bankroll").innerText = bankroll;
    document.getElementById("handsLeft").innerText = handsLeft;
    document.getElementById("bet").innerText = bet;
}

// --- Gestione Chips ---
document.querySelectorAll(".chip").forEach(c => {
    c.addEventListener("click", () => {
        let val = parseInt(c.dataset.value);
        if (bankroll >= val && bet + val <= 1000) {
            bet += val;
            bankroll -= val;
            betHistory.push(val);
            updateUI();
        }
    });
});

// Undo puntata
document.getElementById("undoBtn").addEventListener("click", () => {
    if (betHistory.length > 0) {
        let last = betHistory.pop();
        bet -= last;
        bankroll += last;
        updateUI();
    }
});

// --- Deal ---
document.getElementById("dealBtn").addEventListener("click", () => {
    if (bet < 50) { alert("Puntata minima 50€"); return; }
    if (handsLeft <= 0) return;
    deck = createDeck(); shuffle(deck);
    dealer = [draw(), draw()];
    playerHands = [[draw(), draw()]];
    currentHand = 0;
    render();
});

// --- Hit ---
document.getElementById("hitBtn").addEventListener("click", () => {
    let hand = playerHands[currentHand];
    hand.push(draw());
    if (score(hand) > 21) nextHand();
    render();
});

// --- Stand ---
document.getElementById("standBtn").addEventListener("click", () => { nextHand(); });

// --- Double ---
document.getElementById("doubleBtn").addEventListener("click", () => {
    if (bankroll >= bet && playerHands[currentHand].length === 2) {
        bankroll -= bet;
        bet *= 2;
        playerHands[currentHand].push(draw());
        nextHand();
        updateUI();
    } else alert("Non puoi raddoppiare");
});

// --- Split ---
document.getElementById("splitBtn").addEventListener("click", () => {
    let hand = playerHands[currentHand];
    if (hand.length === 2 && hand[0].v === hand[1].v && bankroll >= bet) {
        bankroll -= bet;
        let newHand = [hand.pop(), draw()];
        hand.push(draw());
        playerHands.splice(currentHand + 1, 0, newHand);
        render();
        updateUI();
    } else alert("Non puoi splittare");
});

// --- Gestione mani ---
function nextHand() {
    currentHand++;
    if (currentHand >= playerHands.length) resolveDealer();
    else render();
}

function resolveDealer() {
    while (score(dealer) < 17) dealer.push(draw());
    playerHands.forEach(hand => {
        let p = score(hand), d = score(dealer);
        if (p > 21) { } // busted
        else if (d > 21 || p > d) bankroll += (p === 21 && hand.length === 2) ? Math.floor(bet * 2.5) : bet * 2;
    });
    handsLeft--;
    sendResultToFirebase();
    bet = 0;
    playerHands = [[]];
    dealer = [];
    betHistory = [];
    updateUI();
    render();
}

// --- Render ---
function render() {
    // Dealer
    const dealerDiv = document.getElementById("dealerCards");
    dealerDiv.innerHTML = "";
    dealer.forEach((c, i) => {
        let img = document.createElement("img");
        img.className = "card";
        img.src = (i === 0) ? "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Card_back_01.svg/120px-Card_back_01.svg.png" : imgs[c.v + c.s];
        img.style.transform = `translateY(-${i * 10}px)`;
        dealerDiv.appendChild(img);
    });

    // Player Hands
    const playerArea = document.getElementById("playerHandsArea");
    playerArea.innerHTML = "";
    playerHands.forEach(hand => {
        let handCircle = document.createElement("div");
        handCircle.style.display = "inline-flex";
        handCircle.style.gap = "0px";
        hand.forEach((c, i) => {
            let img = document.createElement("img");
            img.className = "card";
            img.src = imgs[c.v + c.s];
            img.style.marginLeft = i === 0 ? "0" : "-30px";
            img.style.transform = `translateY(-${i * 5}px)`;
            handCircle.appendChild(img);
        });
        playerArea.appendChild(handCircle);
    });
}

// --- Invio risultati a Firebase ---
function sendResultToFirebase() {
    const userId = firebase.auth().currentUser?.uid || "guest_" + Date.now();
    firebase.database().ref("blackjack/players/" + userId).set({
        username: firebase.auth().currentUser?.displayName || userId,
        balance: bankroll,
        handsLeft: handsLeft,
        timestamp: Date.now()
    });
}

// --- Inizializza UI ---
updateUI();
