// ===== Alert Log =====
const alertLog=[];
function renderAlertLog(){
  const el=q('#alert-log');
  if(!el) return;
  el.innerHTML='';
  alertLog.forEach(line=>{
    const div=document.createElement('div');
    div.textContent=line;
    el.append(div);
  });
}
window.onerror=(msg,src,line,col,err)=>{
  alertLog.push(`${msg} (${src}:${line})`);
  renderAlertLog();
};
window.onunhandledrejection=e=>{
  alertLog.push(`Unhandled: ${e.reason}`);
  renderAlertLog();
};

// Small helper to bind event listeners only when the element exists.
// Keeps the wiring code terse throughout the file.
const bind = (selector, fn) => {
  const el = q(selector);
  if (el) el.onclick = fn;
};

// ===== Download / Retire =====
function downloadLog(){ const st=Game.state; const text=(st.eventLog||[]).join('\n'); const blob=new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='webcareergame-log.txt'; a.click(); URL.revokeObjectURL(url); }
function retirePrompt(){ const st=Game.state; const c=q('#retire-content'); c.innerHTML=''; const box=document.createElement('div'); box.className='glass';
  const stats = st.player.pos==='Goalkeeper'
    ? `<div class="k">Clean sheets</div><div class="v">${st.cleanSheets}</div>`
    : `<div class="k">Goals</div><div class="v">${st.goals}</div><div class="k">Assists</div><div class="v">${st.assists}</div>`;
  box.innerHTML=`<div class="h">Career summary</div>
    <div class="kv">
      <div class="k">Name</div><div class="v">${st.player.name}</div>
      <div class="k">Overall</div><div class="v">${st.player.overall}</div>
      <div class="k">Club</div><div class="v">${st.player.club}</div>
      <div class="k">Minutes</div><div class="v">${st.minutesPlayed}</div>
      ${stats}
      <div class="k">Balance</div><div class="v">${Game.money(st.player.balance||0)}</div>
    </div>`;
  c.append(box); q('#retire-modal').setAttribute('open','');
}

// ===== Events / Boot =====
function wireEvents(){
  wireCoreEvents();
  wireDevTools();
}

// Attach core gameplay and UI events.
function wireCoreEvents(){
  const form = document.getElementById('setup-form');
  if(form){
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name=q('#name').value||'Player';
      const age=q('#age').value||16;
      const origin=q('#origin').value;
      const posEl=[...document.querySelectorAll('input[name=pos]')].find(x=>x.checked);
      const pos=posEl ? posEl.value : 'Attacker';
      const alwaysPlay=q('#always-play').checked;
      Game.newGame({name,age,origin,pos,alwaysPlay});
      renderAll();
      openMarket();
      showPopup('Season start', `Season ${Game.state.season} has started.`);
    });
  }

  bind('#btn-market', ()=>openMarket());
  bind('#btn-shop', ()=>openShop());
  bind('#btn-contract', ()=>openContractRework());
  bind('#btn-league', ()=>openLeagueTable());
  bind('#close-market', ()=>q('#market-modal').removeAttribute('open'));
  bind('#close-shop', ()=>q('#shop-modal').removeAttribute('open'));
  bind('#close-contract', ()=>q('#contract-modal').removeAttribute('open'));
  bind('#close-league', ()=>{ const dlg=q('#league-modal'); if(dlg){ if(dlg.close) dlg.close(); else dlg.removeAttribute('open'); } });
  bind('#btn-next', ()=>nextDay());
  bind('#btn-auto', ()=>toggleAuto());
  bind('#btn-train', ()=>openTraining());
  bind('#btn-skills', ()=>toggleSkills());
  bind('#close-training', ()=>cancelTraining());
  bind('#close-cooldown', ()=>q('#cooldown-modal').removeAttribute('open'));
  bind('#cooldown-ok', ()=>q('#cooldown-modal').removeAttribute('open'));
  bind('#btn-play', ()=>{
    const entry=Game.state.schedule.find(d=>sameDay(d.date, Game.state.currentDate));
    if(!entry) return;
    if(entry.isMatch && !entry.played){
      openMatch(entry);
    } else if(entry.type==='seasonEnd'){
      startNextSeason();
    }
  });
  bind('#btn-retire', ()=>retirePrompt());
  bind('#retire-cancel', ()=>q('#retire-modal').removeAttribute('open'));
  bind('#retire-confirm', ()=>{ q('#retire-modal').removeAttribute('open'); Game.reset(); });
  bind('#btn-log', ()=>downloadLog());
  bind('#close-match', ()=>q('#match-modal').removeAttribute('open'));
  bind('#close-message', ()=>q('#message-modal').removeAttribute('open'));
  bind('#btn-alert-log', ()=>{ renderAlertLog(); q('#alert-log-modal').setAttribute('open',''); });
  bind('#close-alert-log', ()=>q('#alert-log-modal').removeAttribute('open'));
  bind('#btn-dev', ()=>q('#dev-modal').setAttribute('open',''));
  bind('#close-dev', ()=>q('#dev-modal').removeAttribute('open'));
}

// Attach developer / debug actions.
function wireDevTools(){
  const actions = {
    '#dev-injure': ()=>{
      const st=Game.state;
      if(st.player && !st.player.injury){
        st.player.preInjuryStatus = st.player.status;
        st.player.injury={type:'dev injury', days:7};
        st.player.status=`Injured (dev injury, 7d)`;
        Game.log('Dev: forced injury');
        Game.save();
        renderAll();
        showPopup('Dev tools','Player injured for 7 days.');
      }
    },
    '#dev-heal': ()=>{
      const st=Game.state;
      if(st.player){
        st.player.injury=null;
        if(st.player.preInjuryStatus){
          st.player.status=st.player.preInjuryStatus;
          delete st.player.preInjuryStatus;
        } else {
          st.player.status='-';
        }
        Game.log('Dev: healed injury');
        Game.save();
        renderAll();
        showPopup('Dev tools','Player healed.');
      }
    },
    '#dev-loan': ()=>{
      if(Game.state.player){
        requestLoan();
      }
    },
    '#dev-offers': ()=>{
      const st=Game.state;
      if(st.player){
        st.player.transferListed=true;
        st.lastOffers=rollMarketOffers(st.player);
        Game.save();
        renderAll();
        q('#dev-modal').removeAttribute('open');
        openMarket();
      }
    },
    '#dev-skip-month': ()=>{
      skipMonth();
      Game.log('Dev: skipped month');
      showPopup('Dev tools','Skipped one month.');
    },
    '#dev-skip-season': ()=>{
      skipSeason();
      q('#dev-modal').removeAttribute('open');
      Game.log('Dev: skipped season');
      showPopup('Dev tools','Skipped to season end.');
    },
    '#dev-force-season': ()=>{
      startNextSeason();
      q('#dev-modal').removeAttribute('open');
      Game.log('Dev: forced new season');
      showPopup('Dev tools','Started next season.');
    },
    '#dev-set-balance': ()=>{
      const st=Game.state;
      const val=+q('#dev-balance').value;
      if(st.player && !isNaN(val)){
        st.player.balance=val;
        Game.log('Dev: balance set');
        Game.save();
        renderAll();
        showPopup('Dev tools', `Balance set to ${Game.money(val)}.`);
      }
    },
    '#dev-set-overall': ()=>{
      const st=Game.state;
      const val=+q('#dev-overall').value;
      if(st.player && !isNaN(val)){
        st.player.overall=val;
        Game.log('Dev: overall set');
        Game.save();
        renderAll();
        showPopup('Dev tools', `Overall set to ${val}.`);
      }
    }
  };
  Object.entries(actions).forEach(([id, fn]) => bind(id, fn));
}

  (function boot(){
    wireEvents();
    injectVersion();
    const loaded = Game.load();
    if(!loaded){
      if(!setupFromUrl()){
        console.warn('Failed to load save state; starting fresh');
      }
    }
    renderAll();
  })();

  function setupFromUrl(){
    const params = new URLSearchParams(location.search);
    if(!params.has('name')) return false;
    const setup = {
      name: params.get('name') || 'Player',
      age: params.get('age') || 16,
      origin: params.get('origin') || 'Europe',
      pos: params.get('pos') || 'Attacker',
      alwaysPlay: params.get('alwaysPlay') === '1'
    };
    Game.newGame(setup);
    renderAll();
    openMarket();
    showPopup('Season start', `Season ${Game.state.season} has started.`);
    history.replaceState(null, '', location.pathname);
    return true;
  }
