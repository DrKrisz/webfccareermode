// ===== UI small helpers =====
function q(sel){ return document.querySelector(sel); }
function btn(label, onClick, cls='btn primary'){ const b=document.createElement('button'); b.className=cls; b.textContent=label; b.onclick=onClick; return b; }
function fmtValue(v){ if(v>=1_000_000) return '£'+(v/1_000_000).toFixed(1)+'m'; if(v>=1_000) return '£'+Math.round(v/100)/10+'k'; return Game.money(v); }

function showPopup(title, msg, onConfirm){
  const modal=q('#message-modal');
  const content=q('#message-content');
  const titleEl=q('#message-modal .sheet-title');
  const actions=q('#message-actions');
  if(modal && content && titleEl && actions){
    titleEl.textContent=title;
    content.textContent=msg;
    actions.innerHTML='';
    if(onConfirm){
      actions.append(
        btn('Cancel', ()=>modal.removeAttribute('open'), 'btn ghost'),
        btn('Confirm', ()=>{ modal.removeAttribute('open'); onConfirm(); })
      );
    } else {
      actions.append(
        btn('OK', ()=>modal.removeAttribute('open'))
      );
    }
    modal.setAttribute('open','');
  }
}

function showCooldownPopup(rest){
  const modal=q('#cooldown-modal');
  const content=q('#cooldown-content');
  if(modal && content){
    content.textContent=`You need to rest ${rest} more day${rest>1?'s':''} before training again.`;
    modal.setAttribute('open','');
  }
}

function toggleSkills(){
  const btn=q('#btn-skills');
  const rows=[...document.querySelectorAll('.skill-detail')];
  if(!rows.length) return;
  const hidden=rows[0].classList.contains('hidden');
  rows.forEach(r=>{ hidden ? r.classList.remove('hidden') : r.classList.add('hidden'); });
  if(btn) btn.textContent = hidden ? 'Hide skills' : 'Skills';
}

// ===== Rendering =====
function renderAll(){
  const st = Game.state; const onLanding = !st.player;
  if(st.player && st.player.skills){
    st.player.overall = computeOverallFromSkills(st.player.skills);
  }
  q('#landing').style.display = onLanding ? 'grid' : 'none';
  q('#manager').style.display = onLanding ? 'none' : 'block';
  if(onLanding) return;
  const league = st.player.league || 'Premier League';
  const weeksTotal = leagueWeeks(league);
  if(!(st.seasonProcessed && st.leagueSnapshotWeek===weeksTotal)) updateLeagueSnapshot();

  // Left info
  q('#v-name').textContent = st.player.name;
  q('#v-age').textContent = st.player.age;
  q('#v-pos').textContent = st.player.pos;
  if(st.player.goldenClub){ q('#v-club').innerHTML = `<span class="gold">★ ${st.player.club}</span>`; }
  else { q('#v-club').textContent = st.player.club; }
  q('#v-league').textContent = st.player.league || '-';
  q('#v-status').textContent = st.player.status;
  const yearsEl=q('#v-years');
  const yearsKey=yearsEl?yearsEl.previousElementSibling:null;
  if(st.player.club==='Free Agent'){
    if(yearsEl) yearsEl.style.display='none';
    if(yearsKey) yearsKey.style.display='none';
  } else {
    if(yearsEl){
      yearsEl.style.display='';
      yearsEl.textContent = st.player.yearsLeft ? `${st.player.yearsLeft} season${st.player.yearsLeft>1?'s':''}` : '-';
    }
    if(yearsKey) yearsKey.style.display='';
  }

  q('#v-season').textContent = st.season;
  q('#v-week').textContent = `${Math.min(st.week,weeksTotal)} / ${weeksTotal}`;
  q('#v-overall').textContent = st.player.overall;
  const skills = st.player.skills || {};
  ['shooting','passing','dribbling','defending','goalkeeping'].forEach(s=>{
    const el=q('#skill-'+s);
    if(el) el.textContent = skills[s];
  });
  q('#v-playtime').textContent = `${st.seasonMinutes} min / ${st.seasonMatches} matches (${st.minutesPlayed} min / ${st.matchesPlayed} matches)`;
  const weeklyIncome = weeklySalary(st.player)+(st.player.passiveIncome||0);
  q('#v-salary').textContent = Game.money(weeklyIncome) + ' /week';
  q('#v-value').textContent = fmtValue(st.player.value);
  q('#v-balance').textContent = Game.money(st.player.balance||0);

  const landing = q('#landing');
  const manager = q('#manager');
  if (onLanding) {
    landing.classList.remove('hidden');
    manager.classList.add('hidden');
    manager.style.display = '';
  } else {
    landing.classList.add('hidden');
    manager.classList.remove('hidden');
    manager.style.display = '';
  }

  // This week panel
  const today = new Date(st.currentDate);
  const todayEntry = st.schedule.find(d=>sameDay(d.date, st.currentDate));
  const cta = q('#week-cta'); if(cta) cta.innerHTML='';
  if(st.player.club==='Free Agent'){
    q('#week-summary').textContent = 'You are a free agent. Explore offers and sign your first deal.';
    if(cta) cta.append(btn('Open market', ()=>openMarket()));
  }
  else if(todayEntry && todayEntry.type==='seasonEnd'){
    q('#week-summary').textContent = 'Season ended. View summary and continue.';
  }
  else if(todayEntry && todayEntry.isMatch){
    q('#week-summary').innerHTML = `Match day: ${st.player.club} vs ${todayEntry.opponent}<div class="muted" style="font-size:11px"></div>`;
  }
  else{
    q('#week-summary').textContent = 'Training and recovery. Prepare for the next game.';
  }

  if(st.player.club!=='Free Agent' && st.leagueSnapshot && st.leagueSnapshot.length){
    const pos = st.leagueSnapshot.findIndex(t=>t.team===st.player.club)+1;
    const leader = st.leagueSnapshot[0];
    const info = document.createElement('div');
    info.className='muted';
    info.style.fontSize='12px';
    const finalFlag = st.seasonProcessed && st.leagueSnapshotWeek===weeksTotal ? ' (final)' : '';
    const teamCount = makeOpponents(league).length;
    info.textContent = `Table: ${pos}/${teamCount}${finalFlag} • Leader ${leader.team} ${leader.pts} pts`;
    q('#week-summary').append(info);
  }

  const trainBtn=q('#btn-train');
  if(trainBtn){
    trainBtn.disabled=!!st.player.injury;
  }

  const nextBtn=q('#btn-next');
  if(nextBtn){
    nextBtn.disabled = !!st.auto;
    if(todayEntry && todayEntry.isMatch && !todayEntry.played){
      nextBtn.textContent = st.player.club==='Free Agent' ? 'Skip match' : 'Simulate match';
    }
    else if(todayEntry && todayEntry.type==='seasonEnd') nextBtn.textContent='Season summary';
    else nextBtn.textContent='Next day';
  }

  const playBtn=q('#btn-play');
  if(playBtn){
    if(todayEntry && todayEntry.type==='seasonEnd'){
      playBtn.disabled=false;
      playBtn.textContent='Next season';
    }
    else if(st.player.club==='Free Agent'){
      playBtn.disabled=true;
      playBtn.textContent='Play match';
    }
    else if(todayEntry && todayEntry.isMatch && !todayEntry.played && !st.auto && !autoTimeoutId && !st.player.injury){
      playBtn.disabled=false;
      playBtn.textContent='Play match';
    } else {
      playBtn.disabled=true;
      playBtn.textContent='Play match';
    }
  }

  q('#date-label').textContent = today.toDateString();
  renderCalendar();
  renderLiveLog();
  updateAutoBtn();
}

function renderCalendar(){
  const grid=q('#calendar'); grid.innerHTML='';
  const st=Game.state; const winStart=new Date(st.currentDate); winStart.setDate(winStart.getDate()-14);
  for(let i=0;i<28;i++){
    const d=new Date(winStart.getTime()); d.setDate(d.getDate()+i);
    const entry=st.schedule.find(x=>sameDay(x.date, d.getTime()));
    const item=document.createElement('div');
    item.className='day'+(entry&&entry.isMatch?' match':'')+(sameDay(d.getTime(), st.currentDate)?' today':'')+(entry&&entry.played&&entry.isMatch?' played':'');
    if(entry && entry.played && entry.result){
      item.classList.add(entry.result==='W'?'win':entry.result==='L'?'loss':'draw');
    }
    const dateStr=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
    let extra=''; if(entry&&entry.result){ extra=`<div class="res">${entry.result} ${entry.scoreline}</div>`; }
    let label='';
    if(entry){
      if(entry.type==='seasonStart') label='<div style="font-size:11px">Season start</div>';
      else if(entry.type==='seasonEnd') label='<div style="font-size:11px">Season end</div>';
      else if(entry.isMatch){
        let comp=entry.competition||'League';
        if(entry.competition==='Carabao Cup' && entry.round) comp+=` ${entry.round}`;
        label=`<div style="font-size:11px;">vs ${entry.opponent}</div><div style="font-size:10px">${comp} game</div>`;
      }
    }
    item.innerHTML=`<div class="muted">${dateStr}</div><div class="dot"></div>${label}${extra||''}`;

    if(entry && entry.isMatch){
      if(sameDay(entry.date, st.currentDate)){
        item.style.cursor='pointer';
        item.title = entry.played ? 'View match summary' : 'Play match';
        item.onclick = ()=> entry.played ? viewMatchSummary(entry) : openMatch(entry);
      }
      else if(entry.played){
        item.style.cursor='pointer';
        item.title='View match summary';
        item.onclick=()=> viewMatchSummary(entry);
      }
    }
    grid.append(item);
  }
}

function renderLiveLog(){
  const el=q('#live-log');
  if(!el) return;
  const st=Game.state;
  const last=st.eventLog.slice().reverse();
  el.innerHTML='';
  last.forEach(line=>{
    const div=document.createElement('div');
    div.textContent=line;
    const low=line.toLowerCase();
    if(low.includes(': w ')) div.className='log-win';
    else if(low.includes(': l ')) div.className='log-loss';
    else if(low.includes(': d ')) div.className='log-draw';
    else if(low.includes('payday')) div.className='log-payday';
    else if(low.includes('signed for')) div.className='log-sign';
    el.append(div);
  });
  el.scrollTop = 0;
}

function injectVersion(){
  const before = document.title;
  const next = before.replace(/v[\d.]+/, APP_VERSION);
  document.title = (before === next) ? `${before} ${APP_VERSION}` : next;
  document.querySelectorAll('.app-version').forEach(el => el.textContent = APP_VERSION);
}

