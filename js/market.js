// ===== Market UI =====
function openMarket(){
  const st=Game.state; const info=q('#market-info'); const list=q('#market-list'); const empty=q('#market-empty');
  list.innerHTML=''; empty.classList.add('hidden');
  if(st.player.club!=='Free Agent'){
    info.textContent = st.player.transferListed? 'You are listed for transfer. Teams may approach soon.' : 'You are under contract. Request a transfer listing if you want to move.';
    const action = btn(st.player.transferListed?'Refresh offers':'Request transfer listing', ()=>{
      if(st.player.transferListed){ st.lastOffers = Math.random()<0.6 ? rollMarketOffers(st.player) : []; }
      else {
        const approve = Math.random()<0.6; // 60% approve
        if(approve){ st.player.transferListed=true; Game.log('Club approved transfer listing'); alert('Your club listed you for transfer.'); }
        else { Game.log('Club denied transfer request'); alert('Club denied your request right now. Perform well and ask again.'); }
      }
      Game.save(); renderAll(); openMarket();
    }, 'btn primary');
    list.append(action);
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
  ensureNoSelfMatches(o.club);
  Game.log(`Signed for ${o.club}, ${o.years}y, ${o.status}, ${o.timeBand}, ${Game.money(o.salary)}/w`);
  Game.save(); renderAll(); q('#market-modal').removeAttribute('open');
}

