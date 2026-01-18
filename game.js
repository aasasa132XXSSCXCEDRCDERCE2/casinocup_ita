// 🔥 IMPORT FIREBASE MODULARE
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// 🔥 CONFIG FIREBASE – tue chiavi reali
const firebaseConfig = {
  apiKey: "AIzaSyAGFnP6wNzzy3jgvkjXxwpTmRFOpP3HvgU",
  authDomain: "blackjack-torneo.firebaseapp.com",
  databaseURL: "https://blackjack-torneo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "blackjack-torneo",
  storageBucket: "blackjack-torneo.firebasestorage.app",
  messagingSenderId: "509149383414",
  appId: "1:509149383414:web:f5c09acff20306f7bbfad7",
  measurementId: "G-1NF00DV2HC"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🔥 VARIABILI
let deck=[];
let dealer={cards:[]};
let player={cards:[]};
let bankroll=5000;
let handsLeft=30;
let bet=100;

// 🔹 START GAME
window.startGame = function(){
    document.getElementById("landing").style.display="none";
    document.getElementById("game").style.display="block";
    startHand();
}

// 🔹 CREAZIONE E MESCOLAMENTO
function createDeck(){
    const suits=["♠","♥","♦","♣"];
    const values=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
    let d=[];
    suits.forEach(s=>values.forEach(v=>d.push({v,s})));
    return d;
}

function shuffle(d){
    for(let i=d.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [d[i],d[j]]=[d[j],d[i]];
    }
}

function draw(){ return deck.pop(); }

function score(cards){
    let t=0,a=0;
    cards.forEach(c=>{
        if(c.v==="A"){ t+=11; a++ }
        else if(["K","Q","J"].includes(c.v)) t+=10;
        else t+=parseInt(c.v);
    });
    while(t>21 && a){ t-=10; a--; }
    return t;
}

// 🔹 RENDER
function render(hide){
    show("dealerCards", dealer.cards, hide);
    show("playerCards", player.cards, false);
    document.getElementById("playerScore").innerText="Totale: "+score(player.cards);
    document.getElementById("bankroll").innerText=bankroll;
    document.getElementById("handsLeft").innerText=handsLeft;
}

function show(id, cards, hide){
    const el = document.getElementById(id);
    el.innerHTML = "";
    cards.forEach((c,i)=>{
        const d=document.createElement("div");
        d.className="card "+(["♥","♦"].includes(c.s)?"red":"");
        d.innerText=(hide&&i===0&&id==="dealerCards")?"?":c.v+c.s;
        el.appendChild(d);
    });
}

// 🔹 GIOCO
window.hit = function(){
    player.cards.push(draw());
    if(score(player.cards)>21) endHand();
    render(true);
}

window.stand = function(){ endHand(); }

window.doubleBet = function(){
    if(bankroll>=bet){
        bankroll-=bet;
        bet*=2;
        player.cards.push(draw());
        endHand();
    }
}

// 🔹 INIZIO MANO
function startHand(){
    if(handsLeft<=0 || bankroll<=0){
        endTournament();
        return;
    }
    deck=createDeck();
    shuffle(deck);
    dealer.cards=[draw(),draw()];
    player.cards=[draw(),draw()];
    render(true);
}

// 🔹 FINE MANO
function endHand(){
    while(score(dealer.cards)<17) dealer.cards.push(draw());
    const p=score(player.cards);
    const d=score(dealer.cards);
    if(p<=21 && (d>21 || p>d)) bankroll+=bet;
    else if(p>21 || p<d) bankroll-=bet;
    handsLeft--;
    setTimeout(startHand, 800);
}

// 🔹 FINE TORNEO – INVIO FIREBASE
function endTournament(){
    const name = prompt("Inserisci il tuo nickname");
    if(name){
        const resultsRef = ref(db, "results");
        push(resultsRef, {
            name: name,
            bankroll: bankroll,
            date: Date.now()
        });
    }
    alert("Torneo finito! Bankroll finale: €"+bankroll);
}
