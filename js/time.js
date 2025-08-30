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
function nextDay(token, fast=false){
  if(token!==undefined){
    if(token!==autoEpoch || !Game.state.auto || modalOpen()) return;
  }
  const st=Game.state;
  const entry=st.schedule.find(d=>sameDay(d.date, st.currentDate));
  if(entry && entry.isMatch && !entry.played){
    if(st.player.club==='Free Agent'){
      showPopup('Match day', 'You need a club to play matches.');
      const maxWeeks = leagueWeeks(st.player.league||'Premier League');
      st.week = Math.min(maxWeeks, st.week+1);
      st.currentDate+=24*3600*1000; Game.save(); if(!fast) renderAll(); if(!fast && Game.state.auto) autoTick();
      return;
    }
    simulateMatch(entry, fast); return;
  }
  if(entry && entry.type==='training'){
    simulateTraining();
  }
  if(entry && entry.type==='seasonEnd'){ Game.state.auto=false; updateAutoBtn(); openSeasonEnd(); return; }
  if(st.player.injury){
    st.player.injury.days -= 1;
    if(st.player.injury.days<=0){
      st.player.injury=null;
      if(st.player.preInjuryStatus){
        st.player.status=st.player.preInjuryStatus;
        delete st.player.preInjuryStatus;
      } else {
        st.player.status='-';
      }
      Game.log('Recovered from injury.');
      showPopup('Recovery', 'You are fit to play again.');
    } else {
      st.player.status=`Injured (${st.player.injury.type}, ${st.player.injury.days}d)`;
    }
  }
  st.currentDate+=24*3600*1000; Game.save(); if(!fast) { renderAll(); if(Game.state.auto) autoTick(); }
}

function skipMonth(){
  const startMonth = new Date(Game.state.currentDate).getMonth();
  let guard=0;
  while(new Date(Game.state.currentDate).getMonth()===startMonth && guard<60){
    nextDay(undefined, true);
    guard++;
  }
  renderAll();
}

function skipSeason(){
  let guard=0;
  let seasonEnded=false;
  while(guard<400){
    const st=Game.state;
    const entry=st.schedule.find(d=>sameDay(d.date, st.currentDate));
    if(entry && entry.type==='seasonEnd'){
      nextDay(undefined, true);
      seasonEnded=true;
      break;
    }
    nextDay(undefined, true);
    guard++;
  }
  if(!seasonEnded) renderAll();
}

