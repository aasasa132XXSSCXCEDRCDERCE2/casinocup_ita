/* =========================
   VARIABILI GLOBALI
========================= */
let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];

let deck = [];
let dealer = [];
let playerHands = [];
let currentHand = 0;
let gameActive = false;

const suits = ['S','H','D','C'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const cardImg = (v,s)=>`https://raw.githubusercontent.com/hayeah/playing-cards-assets/master/png/${v}${s}.png`;

/* =========================
   DECK
========================= */
function createDeck(){
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

/* =========================
   SCORE
========================= */
function score(hand){
    let total=0, aces=0;
    hand.forEach(c=>{
        if(c.v==='A'){total+=11; aces++;}
        else if('KQJ'.includes(c.v)) total+=10;
        else total+=parseInt(c.v);
    });
    while(total>21 && aces--) total-=10;
    return total;
}

/* =========================
   UI UPDATE
========================= */
function updateUI(){
    bankrollEl.textContent = bankroll;
    handsLeftEl.textContent = handsLeft;
    betEl.textContent = bet;
}

/* =========================
   RENDER
========================= */
function render(){
    dealerCards.innerHTML='';
    dealer.forEach((c,i)=>{
        const img=document.createElement('img');
        img.className='card';
        img.src = gameActive && i===0 ? 
            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Card_back_01.svg/120px-Card_back_01.svg.png'
            : cardImg(c.v,c.s);
        dealerCards.appendChild(img);
    });

    playerArea.innerHTML='';
    playerHands.forEach((hand,i)=>{
        const h=document.createElement('div');
        h.className='hand';
        if(i===currentHand) h.style.borderColor='gold';
        hand.forEach(c=>{
            const img=document.createElement('img');
            img.className='card';
            img.src=cardImg(c.v,c.s);
            h.appendChild(img);
        });
        playerArea.appendChild(h);
    });
}

/* =========================
   BETTING
========================= */
chips.forEach(chip=>{
    chip.onclick=()=>{
        const v=parseInt(chip.dataset.value);
        if(!gameActive && bankroll>=v && bet+v<=1000){
            bankroll-=v;
            bet+=v;
            betHistory.push(v);
            updateUI();
        }
    };
});
undoBtn.onclick=()=>{
    if(betHistory.length){
        const v=betHistory.pop();
        bet-=v;
        bankroll+=v;
        updateUI();
    }
};

/* =========================
   GAME FLOW
========================= */
dealBtn.onclick=()=>{
    if(bet<50 || handsLeft<=0) return alert('Puntata non valida');
    deck=createDeck(); shuffle(deck);
    dealer=[draw(),draw()];
    playerHands=[[draw(),draw()]];
    currentHand=0;
    gameActive=true;
    render();
};

hitBtn.onclick=()=>{
    if(!gameActive) return;
    const h=playerHands[currentHand];
    h.push(draw());
    if(score(h)>21) nextHand();
    render();
};

standBtn.onclick=()=> nextHand();

doubleBtn.onclick=()=>{
    if(!gameActive) return;
    if(bankroll>=bet){
        bankroll-=bet; bet*=2;
        playerHands[currentHand].push(draw());
        nextHand();
    }
};

splitBtn.onclick=()=>{
    const h=playerHands[currentHand];
    if(h.length===2 && h[0].v===h[1].v && bankroll>=bet){
        bankroll-=bet;
        const newHand=[h.pop(),draw()];
        h.push(draw());
        playerHands.splice(currentHand+1,0,newHand);
        render();
        updateUI();
    }
};

function nextHand(){
    currentHand++;
    if(currentHand>=playerHands.length) endRound();
    else render();
}

function endRound(){
    while(score(dealer)<17) dealer.push(draw());

    playerHands.forEach(h=>{
        const p=score(h), d=score(dealer);
        if(p<=21 && (d>21 || p>d)){
            bankroll+= (p===21 && h.length===2)? Math.floor(bet*2.5): bet*2;
        }
    });

    handsLeft--;
    bet=0; betHistory=[];
    dealer=[]; playerHands=[];
    gameActive=false;
    updateUI();
    render();
}

/* =========================
   DOM
========================= */
const bankrollEl=document.getElementById('bankroll');
const handsLeftEl=document.getElementById('handsLeft');
const betEl=document.getElementById('bet');
const dealerCards=document.getElementById('dealerCards');
const playerArea=document.getElementById('playerArea');
const chips=document.querySelectorAll('.chip');

updateUI();
