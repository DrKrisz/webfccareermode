// ===== Time controls =====
var autoTimeoutId=null; // pending auto tick timer
var autoEpoch=0;        // generation token to invalidate queued ticks

function modalOpen(){ return !!document.querySelector('.modal[open]'); }
function clearAutoTick(){ if(autoTimeoutId){ clearTimeout(autoTimeoutId); autoTimeoutId=null; } autoEpoch++; }

function updateAutoBtn(){ const b=q('#btn-auto'); if(!b) return; b.textContent = `Auto advance: ${Game.state.auto? 'On':'Off'}`; }
function toggleAuto(){
  Game.state.auto=!Game.state.auto;
  Game.save();
  updateAutoBtn();
  renderAll();
  if(Game.state.auto){
    autoEpoch++; // start new generation
    autoTick();
  } else {
    clearAutoTick();
  }
}
function autoTick(){
  if(!Game.state.auto) return;
  if(modalOpen()){ autoTimeoutId=setTimeout(autoTick,300); return; }
  const token=autoEpoch;
  autoTimeoutId=setTimeout(()=>{
    autoTimeoutId=null;
    if(Game.state.auto && token===autoEpoch && !modalOpen()){
      nextDay(token);
    }
  }, 800+Math.floor(Math.random()*600));
}
function nextDay(token){
  if(token!==undefined){
    if(token!==autoEpoch || !Game.state.auto || modalOpen()) return;
  }
  const st=Game.state;
  const entry=st.schedule.find(d=>sameDay(d.date, st.currentDate));
  if(entry && entry.isMatch && !entry.played){
    if(st.player.club==='Free Agent'){
      showPopup('Match day', 'You need a club to play matches.');
      st.week = Math.min(38, st.week+1);
      st.currentDate+=24*3600*1000; Game.save(); renderAll(); if(Game.state.auto) autoTick();
      return;
    }
    simulateMatch(entry); return;
  }
  if(entry && entry.type==='seasonEnd'){ Game.state.auto=false; updateAutoBtn(); openSeasonEnd(); return; }
  st.currentDate+=24*3600*1000; Game.save(); renderAll(); if(Game.state.auto) autoTick();
}

