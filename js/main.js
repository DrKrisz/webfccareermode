// ===== Download / Retire =====
function downloadLog(){ const st=Game.state; const text=(st.eventLog||[]).join('\n'); const blob=new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='webcareergame-log.txt'; a.click(); URL.revokeObjectURL(url); }
function retirePrompt(){ const st=Game.state; const c=q('#retire-content'); c.innerHTML=''; const box=document.createElement('div'); box.className='glass';
  box.innerHTML=`<div class="h">Career summary</div>
    <div class="kv">
      <div class="k">Name</div><div class="v">${st.player.name}</div>
      <div class="k">Overall</div><div class="v">${st.player.overall}</div>
      <div class="k">Club</div><div class="v">${st.player.club}</div>
      <div class="k">Minutes</div><div class="v">${st.minutesPlayed}</div>
      <div class="k">Goals</div><div class="v">${st.goals}</div>
      <div class="k">Assists</div><div class="v">${st.assists}</div>
      <div class="k">Balance</div><div class="v">${Game.money(st.player.balance||0)}</div>
    </div>`;
  c.append(box); q('#retire-modal').setAttribute('open','');
}

// ===== Events / Boot =====
function wireEvents(){
  const form = document.getElementById('setup-form');
  if(form){
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name=q('#name').value||'Player';
      const age=q('#age').value||16;
      const origin=q('#origin').value;
      const pos=[...document.querySelectorAll('input[name=pos]')].find(x=>x.checked)?.value||'Attacker';
      const alwaysPlay=q('#always-play').checked;
      Game.newGame({name,age,origin,pos,alwaysPlay});
      renderAll();
      openMarket();
    });
  }
  const click = (id, fn)=>{ const el=q(id); if(el) el.onclick=fn; };
  click('#btn-market', ()=>openMarket());
  click('#btn-shop', ()=>openShop());
  click('#close-market', ()=>q('#market-modal').removeAttribute('open'));
  click('#close-shop', ()=>q('#shop-modal').removeAttribute('open'));
  click('#btn-next', ()=>nextDay());
  click('#btn-auto', ()=>toggleAuto());
  click('#btn-train', ()=>openTraining());
  click('#close-training', ()=>q('#training-modal').removeAttribute('open'));
  click('#btn-play', ()=>{ const entry=Game.state.schedule.find(d=>sameDay(d.date, Game.state.currentDate)); if(entry && entry.isMatch && !entry.played) openMatch(entry); });
  click('#btn-save', ()=>{ Game.save(); alert('Saved'); });
  click('#btn-reset', ()=>{ if(confirm('Delete your local save and restart')) Game.reset(); });
  click('#btn-retire', ()=>retirePrompt());
  click('#retire-cancel', ()=>q('#retire-modal').removeAttribute('open'));
  click('#retire-confirm', ()=>{ q('#retire-modal').removeAttribute('open'); Game.reset(); });
  click('#btn-log', ()=>downloadLog());
  click('#close-match', ()=>q('#match-modal').removeAttribute('open'));
  click('#close-message', ()=>q('#message-modal').removeAttribute('open'));
}

(function boot(){
  wireEvents();
  injectVersion();
  if(!Game.load()){
    console.warn('Failed to load save state; starting fresh');
  }
  renderAll();
})();
