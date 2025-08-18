// ===== Season end summary & rollover =====
function openSeasonEnd(){
  const st=Game.state;
  if(st.seasonProcessed) return;
  st.seasonProcessed = true;
  Game.save();

  // compute player's team stats from season
  const stats={w:0,d:0,l:0,gf:0,ga:0};
  st.schedule.filter(e=>e.isMatch).forEach(e=>{
    if(e.played){
      if(e.result==='W') stats.w++;
      else if(e.result==='D') stats.d++;
      else stats.l++;
      if(e.scoreline){ const [gf,ga]=e.scoreline.split('-').map(Number); stats.gf+=gf; stats.ga+=ga; }
    } else {
      stats.l++; // unplayed matches count as losses
    }
  });
  stats.pts=stats.w*3+stats.d;

  const club=st.player.club;
  const teams=makeOpponents().map(t=>({team:t}));
  if(!teams.find(t=>t.team===club)){ teams.pop(); teams.push({team:club}); }
  teams.forEach(t=>{
    if(t.team===club){ Object.assign(t,stats); }
    else {
      const w=randInt(5,25); const d=randInt(0,38-w); const l=38-w-d;
      const gf=w*randInt(1,3)+d*randInt(0,2)+randInt(0,10);
      const ga=l*randInt(1,3)+d*randInt(0,2)+randInt(0,10);
      const pts=w*3+d;
      Object.assign(t,{w,d,l,gf,ga,pts});
    }
  });
  teams.sort((a,b)=>b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga));
  const pos=teams.findIndex(t=>t.team===club)+1;
  const won=pos===1;
  if(won){ st.player.goldenClub=true; Game.log('🏆 League won! Club marked gold.'); }
  else { st.player.goldenClub=false; }

  // contract years decrement at season end
  if(st.player.yearsLeft>0){
    st.player.yearsLeft -= 1;
    if(st.player.yearsLeft<=0){
      st.player.yearsLeft=0; st.player.club='Free Agent'; st.player.league=''; st.player.status='-'; st.player.timeBand='-'; st.player.salary=0;
      Game.log('Contract ended. You are a Free Agent.');
    }
  }

  const rows=teams.map((t,i)=>{
    const cls=[];
    if(t.team===club) cls.push('highlight');
    if(i===0) cls.push('pos1');
    else if(i===1) cls.push('pos2');
    else if(i===2) cls.push('pos3');
    else if(i===3 || i===4) cls.push('pos4-5');
    else if(i>=17) cls.push('pos-bottom');
    return `<tr${cls.length?` class="${cls.join(' ')}"`:''}><td>${i+1}</td><td>${t.team}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.pts}</td></tr>`;
  }).join('');
  const tableHtml=`<table class="league-table"><thead><tr><th>Pos</th><th>Team</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table>`;

  const c=q('#match-content'); c.innerHTML='';
  const box=document.createElement('div'); box.className='glass';
  box.innerHTML = `<div class="h">Season ${st.season} summary</div>
    <div>League position: ${pos}/20 ${won?' - <span class="badge">CHAMPIONS</span>':''}</div>
    <div class="muted" style="margin-top:8px">Season: ${st.seasonMinutes} min, G ${st.seasonGoals}, A ${st.seasonAssists}</div>
    <div class="muted" style="margin-top:4px">Career: ${st.minutesPlayed} min, G ${st.goals}, A ${st.assists}</div>
    ${tableHtml}
    <div style="margin-top:10px"><button class="btn primary" id="btn-next-season">Start next season</button></div>`;
  c.append(box); q('#match-modal').setAttribute('open','');

  q('#btn-next-season').onclick=()=>{
    q('#match-modal').removeAttribute('open');
    const lastSeason = {min:st.seasonMinutes, goals:st.seasonGoals, assists:st.seasonAssists};
    // manager feedback
    let msg='Well kid decent season, please work more.';
    if(lastSeason.goals>=10 || lastSeason.min>=1800){
      msg='Great season! Your salary increased.';
      st.player.salary=Math.round(st.player.salary*1.1);
    } else if(lastSeason.min<600){
      msg='Tough season. Salary stays the same.';
    }
    showMessage(msg);
    Game.log(`Manager: ${msg}`);
    st.season += 1; st.week = 1;
    st.player.age += 1;
    const baseYear = new Date(new Date(st.schedule[0].date).getFullYear()+1,7,31).getFullYear();
    const first = randomWedToSatOfWeek(lastSaturdayOfAugust(baseYear));
    st.schedule = buildSchedule(first, 38, st.player.club);
    st.currentDate = st.schedule[0].date; // on season start marker
    st.seasonMinutes=0; st.seasonGoals=0; st.seasonAssists=0;
    Object.keys(st.shopPurchases||{}).forEach(id=>{ const it=SHOP_ITEMS.find(i=>i.id===id); if(it && it.perSeason) delete st.shopPurchases[id]; });
    st.player.salaryMultiplier=1;
    st.seasonProcessed = false;
    Game.log(`Season ${st.season} begins. Age ${st.player.age}. Contract ${st.player.yearsLeft} season${st.player.yearsLeft!==1?'s':''} left.`);
    Game.state.auto=false; updateAutoBtn();
    Game.save(); renderAll();
  };
}

