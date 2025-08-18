// ===== Time controls =====
function updateAutoBtn(){ const b=q('#btn-auto'); if(!b) return; b.textContent = `Auto advance: ${Game.state.auto? 'On':'Off'}`; }
function toggleAuto(){ Game.state.auto=!Game.state.auto; Game.save(); updateAutoBtn(); renderAll(); if(Game.state.auto) autoTick(); }
function autoTick(){
  if(!Game.state.auto) return;
  const entry = Game.state.schedule.find(d=>sameDay(d.date, Game.state.currentDate));
  if(entry && entry.type==='seasonEnd'){ Game.state.auto=false; updateAutoBtn(); return; }
  setTimeout(()=>{ if(Game.state.auto){ nextDay(); } }, 800+Math.floor(Math.random()*600));
}
function nextDay(){
  const st=Game.state;
  const entry=st.schedule.find(d=>sameDay(d.date, st.currentDate));
  if(entry && entry.isMatch && !entry.played){ simulateMatch(entry); return; }
  if(entry && entry.type==='seasonEnd'){ Game.state.auto=false; updateAutoBtn(); openSeasonEnd(); return; }
  st.currentDate+=24*3600*1000; Game.save(); renderAll(); autoTick();
}

