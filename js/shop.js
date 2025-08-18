// ===== Shop =====
const SHOP_ITEMS=[
  {id:'trainer',name:'Personal Trainer',desc:'Gain +1 overall instantly',cost:500,limit:3,perSeason:true,apply:st=>{st.player.overall=Math.min(100,st.player.overall+1);}},
  {id:'boots',name:'Shiny Boots',desc:'Boost market value by £500',cost:250,limit:2,perSeason:true,apply:st=>{st.player.value+=500;}},
  {id:'sponsor',name:'Sponsorship Deal',desc:'Salary +10% for this season',cost:2000,limit:1,perSeason:true,apply:st=>{st.player.salaryMultiplier=(st.player.salaryMultiplier||1)*1.1;}},
  {id:'house',name:'Small House',desc:'Earn £100 weekly income forever',cost:10000,limit:3,perSeason:false,apply:st=>{st.player.passiveIncome=(st.player.passiveIncome||0)+100; st.player.houses=(st.player.houses||0)+1;}},
  {id:'gym',name:'Gym Membership',desc:'Improve overall by +2 this season',cost:1500,limit:1,perSeason:true,apply:st=>{st.player.overall=Math.min(100,st.player.overall+2);}},
  {id:'car',name:'Sports Car',desc:'Raise value by £2000',cost:3000,limit:1,perSeason:true,apply:st=>{st.player.value+=2000;}}
];

function openShop(){
  const st=Game.state;
  const c=q('#shop-content'); if(c) c.innerHTML='';
  const box=document.createElement('div'); box.className='glass';
  box.style.display='grid'; box.style.gap='12px';
  box.innerHTML='<div class="h">Club shop</div>';
  SHOP_ITEMS.forEach(item=>{
    const purchases = st.shopPurchases || (st.shopPurchases = {});
    const count=purchases[item.id]||0;
    const left=item.limit-count;
    const row=document.createElement('div'); row.className='shop-item';
    const disabled=left<=0;
    row.innerHTML=`<div><div>${item.name}</div><div class="muted desc">${item.desc}</div></div><button class="btn" data-id="${item.id}" ${disabled?'disabled':''}>Buy ${Game.money(item.cost)}${item.limit>1?` (${left} left)`:''}</button>`;
    row.querySelector('button').onclick=()=>buyItem(item);
    box.append(row);
  });
  c.append(box);
  q('#shop-modal').setAttribute('open','');
}

function buyItem(item){
  const st=Game.state;
  const purchases = st.shopPurchases || (st.shopPurchases = {});
  const count=purchases[item.id]||0;
  if(count>=item.limit){ showPopup('Shop', 'Item limit reached.'); return; }
  if((st.player.balance||0)<item.cost){ showPopup('Shop', 'Not enough funds.'); return; }
  st.player.balance-=item.cost;
  purchases[item.id]=count+1;
  item.apply(st);
  Game.log(`Bought ${item.name} for ${Game.money(item.cost)}`);
  showPopup('Shop', `Bought ${item.name}!`);
  Game.save(); renderAll(); openShop();
}

