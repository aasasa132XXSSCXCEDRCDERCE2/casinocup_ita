let bankroll = 10000;
let handsLeft = 30;
let bet = 0;
let betHistory = [];

let deck = [];
let dealer = [];
let playerHands = [];
let currentHand = 0;
let gameActive = false;

const suits = ['♠','♥','♦','♣'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

/* ===== DECK ===== */
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

/* ===== SCORE ===== */
function score(hand){
    let t=0,a=0;
    hand.forEach(c=>{
        if(c.v==='A'){t+=11;a++;}
        else if('KQJ'.includes(c.v)) t+=10;
        else t+=parseInt(c.v);
    });
    while(t>21 && a--) t-=10;
    return t;
}

/* ===== UI ===== */
function updateUI(){
    bankrollEl.textContent = bankroll;
    handsLeftEl.textContent = handsLeft;
    betEl.textContent = bet;
}

/* ===== RENDER ===== */
function render(){
    dealerCards.innerHTML='';
    dealer.forEach((c,i)=>{
        const div=document.createElement('div');
        div.className='card '+((c.s==='♥'||c.s==='♦')?'red':'');
        div.innerHTML=`<div>${c.v}${c.s}</div><div>${c.s}</div>`;
        dealerCards.appendChild(div);
    });
    dealerTotal.textContent = dealer.length ? 'Totale: '+score(dealer) : '';

    playerArea.innerHTML='';
    playerHands.forEach((hand,i)=>{
        const h=document.createElement('div');
        h.className='hand';
        if(i===currentHand) h.style.borderColor='gold';

        const cards=document.createElement('div');
        cards.className='cards';

        hand.forEach(c=>{
            const div=document.createElement('div');
            div.className='card '+((c.s==='♥'||c.s==='♦')?'red':'');
            div.innerHTML=`<div>${c.v}${c.s}</div><div>${c.s}</div>`;
            cards.appendChild(div);
        });

        const t=document.createElement('div');
        t.className='total';
        t.textContent='Totale: '+score(hand);

        h.appendChild(cards);
        h.appendChild(t);
        playerArea.appendChild(h);
    });
}

/* ===== BET ===== */
document.querySelectorAll('.chip').forEach(chip=>{
    chip.onclick=()=>{
        const v=parseInt(chip.dataset.value);
        if(!gameActive && bankroll>=v && bet+v<=1000){
            bankroll-=v; bet+=v; betHistory.push(v);
            updateUI();
        }
    };
});
undoBtn.onclick=()=>{
    if(betHistory.length){
        const v=betHistory.pop();
        bankroll+=v; bet-=v;
        updateUI();
    }
};

/* ===== GAME ===== */
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
    playerHands[currentHand].push(draw());
    if(score(playerHands[currentHand])>21) nextHand();
    render();
};

standBtn.onclick=()=>nextHand();

doubleBtn.onclick=()=>{
    if(!gameActive || bankroll<bet) return;
    bankroll-=bet; bet*=2;
    playerHands[currentHand].push(draw());
    nextHand();
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

/* ===== DOM ===== */
const bankrollEl=document.getElementById('bankroll');
const handsLeftEl=document.getElementById('handsLeft');
const betEl=document.getElementById('bet');
const dealerCards=document.getElementById('dealerCards');
const dealerTotal=document.getElementById('dealerTotal');
const playerArea=document.getElementById('playerArea');

updateUI();
