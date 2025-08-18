// ===== League snapshot during season =====
function updateLeagueSnapshot(){
  const st=Game.state;
  if(!st.player || st.player.club==='Free Agent') return;
  const played = st.schedule.filter(e=>e.isMatch && e.played).length;
  if(st.leagueSnapshotWeek===played) return;
  const club=st.player.club;
  const teams=makeOpponents().map(t=>({team:t}));
  const stats={w:0,d:0,l:0,gf:0,ga:0};
  st.schedule.filter(e=>e.isMatch && e.played).forEach(e=>{
    if(e.result==='W') stats.w++;
    else if(e.result==='D') stats.d++;
    else stats.l++;
    if(e.scoreline){ const [gf,ga]=e.scoreline.split('-').map(Number); stats.gf+=gf; stats.ga+=ga; }
  });
  stats.pts=stats.w*3+stats.d;
  teams.forEach(t=>{
    if(t.team===club){ Object.assign(t,stats); }
    else {
      const lvl=getTeamLevel(t.team);
      const w=randInt(0, Math.min(played, Math.round(played*(0.2+lvl/200))));
      const d=randInt(0, Math.min(played-w, Math.round(played*0.3)));
      const l=played-w-d;
      const gf=w*randInt(1,3)+d*randInt(0,2)+randInt(0,5);
      const ga=l*randInt(1,3)+d*randInt(0,2)+randInt(0,5);
      const pts=w*3+d;
      Object.assign(t,{w,d,l,gf,ga,pts});
    }
  });
  teams.sort((a,b)=>b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga));
  st.leagueSnapshot=teams;
  st.leagueSnapshotWeek=played;
  Game.save();
}

// ===== Season end summary & rollover =====
function openSeasonEnd(){
  const st=Game.state;
  if(!st.seasonSummary){
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

    // snapshot final table for consistency in week summary
    st.leagueSnapshot = teams.map(t=>({...t}));
    st.leagueSnapshotWeek = 38;

    // adjust team levels based on final positions
    teams.forEach((t,i)=>{
      const lvl=getTeamLevel(t.team);
      if(i<3) st.teamLevels[t.team]=Math.min(99,lvl+2);
      else if(i<10) st.teamLevels[t.team]=Math.min(99,lvl+1);
      else if(i>=17) st.teamLevels[t.team]=Math.max(50,lvl-2);
      else st.teamLevels[t.team]=Math.max(50,lvl);
    });

    const pos=teams.findIndex(t=>t.team===club)+1;
    const won=pos===1;
    if(won){ st.player.goldenClub=true; Game.log('🏆 League won! Club marked gold.'); }
    else { st.player.goldenClub=false; }

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

    st.seasonSummary = {teams,pos,won,tableHtml};
    st.seasonProcessed=true;
    Game.save();
  }

  const {pos,won,tableHtml} = st.seasonSummary;
  const offerRenew = st.player.club!=='Free Agent' && st.player.yearsLeft<=1;

  const c=q('#match-content'); c.innerHTML='';
  const box=document.createElement('div'); box.className='glass';
  box.innerHTML = `<div class="h">Season ${st.season} summary</div>
    <div>League position: ${pos}/20 ${won?' - <span class="badge">CHAMPIONS</span>':''}</div>
    <div class="muted" style="margin-top:8px">Season: ${st.seasonMinutes} min, G ${st.seasonGoals}, A ${st.seasonAssists}</div>
    <div class="muted" style="margin-top:4px">Career: ${st.minutesPlayed} min, G ${st.goals}, A ${st.assists}</div>
    ${tableHtml}
    <div style="margin-top:10px"><button class="btn primary" id="btn-next-season">Start next season</button>${offerRenew?' <button class="btn" id="btn-renew-contract">Renew contract</button>':''}</div>`;
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

    if(st.player.club!=='Free Agent'){
      st.player.yearsLeft = Math.max(0, st.player.yearsLeft-1);
      if(st.player.yearsLeft<=0){ st.player.club='Free Agent'; st.player.league=''; st.player.status='-'; st.player.timeBand='-'; st.player.salary=0; Game.log('Contract ended. You are a Free Agent.'); }
      st.player.marketBlocked = Math.max(0,(st.player.marketBlocked||0)-1);
      const poorSeason = lastSeason.min>900 && (lastSeason.goals+lastSeason.assists)<2;
      if(poorSeason && Math.random()<0.5){
        const lower=makeOpponents().filter(t=>getTeamLevel(t)<getTeamLevel(st.player.club));
        if(lower.length){
          const club=pick(lower);
          st.lastOffers=[makeOfferForVaried(st.player,club,getTeamLevel(club))];
          st.player.transferListed=true;
          Game.log('Club considers selling you after poor season.');
        }
      }
    }

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
    st.seasonSummary = null;
    st.leagueSnapshot = [];
    st.leagueSnapshotWeek = 0;
    Game.log(`Season ${st.season} begins. Age ${st.player.age}. Contract ${st.player.yearsLeft} season${st.player.yearsLeft!==1?'s':''} left.`);
    Game.state.auto=false; updateAutoBtn();
    Game.save(); renderAll();
  };
  if(offerRenew){ q('#btn-renew-contract').onclick=()=>renewContractOffer(); }
}

function renewContractOffer(){
  const st=Game.state; if(st.player.club==='Free Agent') return;
  const choice=prompt('Renew contract:\n1) Better role\n2) Long term deal');
  if(choice==='1'){
    const statusOrder=['rookie','decent','key player','important','star player'];
    const timeOrder=['second bench','bench','rotater','match player','match starter'];
    const sIdx=Math.min(statusOrder.length-1,statusOrder.indexOf(st.player.status)+1);
    const tIdx=Math.min(timeOrder.length-1,timeOrder.indexOf(st.player.timeBand)+1);
    st.player.status=statusOrder[sIdx];
    st.player.timeBand=timeOrder[tIdx];
    st.player.salary=Math.round(st.player.salary*1.05);
    st.player.yearsLeft=2;
    st.player.marketBlocked=1;
    st.player.releaseClause=Math.round(st.player.value*1.2);
    Game.log('Contract renewed with improved role');
  } else if(choice==='2'){
    st.player.salary=Math.round(st.player.salary*1.02);
    st.player.yearsLeft=4;
    st.player.marketBlocked=2;
    st.player.releaseClause=Math.round(st.player.value*2);
    Game.log('Contract renewed with long term deal');
  } else { return; }
  Game.save(); renderAll();
  q('#match-modal').removeAttribute('open');
  openSeasonEnd();
}

