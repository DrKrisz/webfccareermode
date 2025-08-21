// ===== Market generation =====
function rollMarketOffers(p){
  const count=1+Math.floor(Math.random()*5);
  const clubs=[...ALL_CLUBS].sort(()=>Math.random()-0.5);
  const offers=[];
  for(const {club,league} of clubs){
    if(offers.length>=count) break;
    const lvl=getTeamLevel(club);
    const diff=lvl - p.overall;
    let chance = diff<=0?0.8: diff<5?0.6: diff<10?0.3: 0.05; // big clubs rarely approach weak players
    if(league==='EFL Championship' && (p.overall<75 || p.age<=23)) chance+=0.2;
    if(lvl>85 && p.overall>=80) chance+=0.1;
    if(Math.random()<Math.min(chance,0.95)) offers.push(makeOfferForVaried(p,club,lvl,league));
  }
  if(p.releaseClause && p.overall>=75 && Math.random()<0.15){
    const big=ALL_CLUBS.filter(c=>getTeamLevel(c.club)>85 && c.club!==p.club);
    if(big.length){
      const {club,league}=pick(big);
      const o=makeOfferForVaried(p,club,getTeamLevel(club),league);
      o.releaseClauseFee=p.releaseClause;
      offers.push(o);
    }
  }
  return offers;
}
function makeOfferFor(player, club){ return makeOfferForVaried(player, club, null, CLUB_TO_LEAGUE[club]); }
function makeOfferForVaried(player, club, level, league){
  const o=player.overall;
  let status,timeBand;
  if(player.pos==='Goalkeeper'){
    status = o>=88?'World-class'
            : o>=80?'First-choice'
            : o>=72?'Reserve keeper'
            : 'Backup keeper';
    const timeMap={'Backup keeper':'second bench','Reserve keeper':pick(['bench','rotater']),
      'First-choice':pick(['match player','match starter']),'World-class':'match starter'};
    timeBand=timeMap[status];
  } else {
    status = o>=88?pick(['important','star player'])
            : o>=80?pick(['key player','important'])
            : o>=72?'key player'
            : o>=65?'decent':'rookie';
    const timeMap={'rookie':'second bench','decent':pick(['bench','rotater']),'key player':pick(['rotater','match player']),'important':pick(['match player','match starter']),'star player':'match starter'};
    timeBand=timeMap[status];
  }
  if(league==='EFL Championship' && (player.age<=23 || player.overall<75)){
    const order=['second bench','bench','rotater','match player','match starter'];
    let idx=order.indexOf(timeBand); if(idx<order.length-1) timeBand=order[idx+1];
  }
  const clubFactor = 0.8 + Math.random()*0.6; // 0.8..1.4
  const posBonus = player.pos==='Attacker'?1.15: player.pos==='Midfield'?1.05: 1.0;
  const years=Math.min(5, Math.max(1, Math.round(randNorm(2.2,1.2))));
  league = league || CLUB_TO_LEAGUE[club] || 'Premier League';
  let salary=computeSalary(player.age,player.overall,league,status,timeBand)*clubFactor*posBonus;
  const lengthFactor = years>=4?0.9: years===3?1.0: years===2?1.08:1.15; // shorter pays more
  salary*=lengthFactor;
  const value=computeValue(player.overall,league,salary);
  const lvl = level!=null?level:getTeamLevel(club);
  return {club,league,years,status,timeBand,salary,value,level:lvl};
}

// ===== Market UI =====
function openMarket(){
  const st=Game.state; const info=q('#market-info'); const list=q('#market-list'); const empty=q('#market-empty');
  list.innerHTML=''; empty.classList.add('hidden');
  if(st.player.club!=='Free Agent'){
    if(st.player.marketBlocked>0){
      info.textContent = `Contract locked for ${st.player.marketBlocked} more season${st.player.marketBlocked>1?'s':''}.`;
    } else {
      info.textContent = st.player.transferListed? 'You are listed for transfer. Teams may approach soon.' : 'You are under contract. Request a transfer listing if you want to move.';
      const action = btn(st.player.transferListed?'Refresh offers':'Request transfer listing', ()=>{
        if(st.player.transferListed){ st.lastOffers = Math.random()<0.6 ? rollMarketOffers(st.player) : []; }
        else {
          const approve = Math.random()<0.6; // 60% approve
          if(approve){ st.player.transferListed=true; Game.log('Club approved transfer listing'); showPopup('Transfer market', 'Your club listed you for transfer.'); }
          else { Game.log('Club denied transfer request'); showPopup('Transfer market', 'Club denied your request right now. Perform well and ask again.'); }
        }
        Game.save(); renderAll(); openMarket();
      }, 'btn primary');
      list.append(action);
    }
  } else {
    info.textContent = 'You are a free agent. Choose a club to sign for.';
    if(!st.lastOffers.length) st.lastOffers = rollMarketOffers(st.player);
  }
  if(st.lastOffers.length){
    st.lastOffers.forEach((o,i)=>{
      const row=document.createElement('div'); row.className='glass';
      row.innerHTML=`<div class="flex-between" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <div style="font-weight:800;font-size:16px">${o.club} <span class="pill" style="margin-left:6px">${o.league}</span></div>
          <div class="muted" style="margin-top:4px;display:flex;gap:8px;flex-wrap:wrap">
            <span class="pill">${o.years} season${o.years>1?'s':''}</span>
            <span class="pill">${o.status}</span>
            <span class="pill">${o.timeBand}</span>
            <span class="pill">Lvl ${o.level||getTeamLevel(o.club)}</span>
            <span class="pill">${Game.money(o.salary)}/week</span>
            <span class="pill">value ${fmtValue(o.value)}</span>
            ${o.releaseClauseFee?`<span class="pill">Release ${Game.money(o.releaseClauseFee)}</span>`:''}
          </div>
        </div>
        <div class="row"><button class="btn" data-i="${i}">Accept</button></div>`;
      row.querySelector('button').onclick=()=>acceptOffer(i);
      list.append(row);
    });
  } else if(st.player.club==='Free Agent'){
    empty.classList.remove('hidden');
  }
  q('#market-modal').setAttribute('open','');
}
function acceptOffer(i){
  const o=Game.state.lastOffers[i]; const st=Game.state;
  st.player.club=o.club; st.player.league=o.league; st.player.status=o.status; st.player.timeBand=o.timeBand;
  st.player.salary=Math.round(o.salary); st.player.value=Math.round(o.value);
  st.player.yearsLeft=o.years; st.player.transferListed=false; st.lastOffers=[];
  st.player.releaseClause=Math.round((o.releaseClauseFee?o.releaseClauseFee:o.value)*1.5);
  st.player.marketBlocked=0; st.player.contractReworkYear=0;
  if(o.releaseClauseFee) Game.log(`Release clause of ${Game.money(o.releaseClauseFee)} activated by ${o.club}`);
  const year=new Date().getFullYear();
  const first=realisticMatchDate(lastSaturdayOfAugust(year));
  st.schedule=buildSchedule(first,38,o.club,o.league);
  st.currentDate=st.schedule[0].date;
  st.week=1;
  Game.log(`Signed for ${o.club}, ${o.years}y, ${o.status}, ${o.timeBand}, ${Game.money(o.salary)}/w`);
  Game.save(); renderAll(); q('#market-modal').removeAttribute('open');
}

