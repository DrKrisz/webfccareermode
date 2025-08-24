// ===== League snapshot during season =====
function updateLeagueSnapshot(){
  const st=Game.state;
  if(!st.player || st.player.club==='Free Agent') return;
  // Don't overwrite the final league table once the season is processed
  const gamesTotal = leagueWeeks(st.player.league||'Premier League');
  if(st.seasonProcessed && st.leagueSnapshotWeek===gamesTotal) return;
  const played = st.schedule.filter(e=>e.isMatch && e.played).length;
  if(st.leagueSnapshotWeek===played) return;
    const club=st.player.club;
    const teams=makeOpponents(st.player.league||'Premier League').map(t=>({team:t}));
    const games = leagueWeeks(st.player.league||'Premier League');
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

function randomLeagueTable(league, played){
  const teams=makeOpponents(league).map(t=>({team:t}));
  teams.forEach(t=>{
    const lvl=getTeamLevel(t.team);
    const w=randInt(0, Math.min(played, Math.round(played*(0.2+lvl/200))));
    const d=randInt(0, Math.min(played-w, Math.round(played*0.3)));
    const l=played-w-d;
    const gf=w*randInt(1,3)+d*randInt(0,2)+randInt(0,5);
    const ga=l*randInt(1,3)+d*randInt(0,2)+randInt(0,5);
    const pts=w*3+d;
    Object.assign(t,{w,d,l,gf,ga,pts});
  });
  teams.sort((a,b)=>b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga));
  return teams;
}

function openLeagueTable(){
  const st=Game.state;
  const modal=q('#league-modal');
  const content=q('#league-content');
  if(!modal || !content) return;
  const leagues=Object.keys(LEAGUES);
  const select=document.createElement('select');
  leagues.forEach(lg=>{
    const opt=document.createElement('option');
    opt.value=lg;
    opt.textContent=lg;
    if(st.player && st.player.league===lg) opt.selected=true;
    select.append(opt);
  });
  const tableWrap=document.createElement('div');
  function render(){
    const lg=select.value;
    let teams;
    if(st.player && st.player.league===lg){
      updateLeagueSnapshot();
      teams=(st.leagueSnapshot||[]).slice();
    } else {
      const played=st.leagueSnapshotWeek || (st.schedule?st.schedule.filter(e=>e.isMatch && e.played).length:0);
      teams=randomLeagueTable(lg, played);
    }
    const rows=teams.map((t,i)=>{
      const cls=st.player && st.player.club===t.team && st.player.league===lg?' class="highlight"':'';
      return `<tr${cls}><td>${i+1}</td><td>${t.team}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf}</td><td>${t.ga}</td><td>${t.pts}</td></tr>`;
    }).join('');
    tableWrap.innerHTML=`<table class="league-table"><thead><tr><th>Pos</th><th>Team</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  select.onchange=render;
  content.innerHTML='';
  content.append(select);
  content.append(tableWrap);
  render();
  if(modal.showModal) modal.showModal();
  else modal.setAttribute('open','');
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
    const teams=makeOpponents(st.player.league||'Premier League').map(t=>({team:t}));
    if(!teams.find(t=>t.team===club)){ teams.pop(); teams.push({team:club}); }
    teams.forEach(t=>{
      if(t.team===club){ Object.assign(t,stats); }
      else {
        const w=randInt(Math.floor(games*0.13), Math.floor(games*0.66));
        const d=randInt(0,games-w); const l=games-w-d;
        const gf=w*randInt(1,3)+d*randInt(0,2)+randInt(0,10);
        const ga=l*randInt(1,3)+d*randInt(0,2)+randInt(0,10);
        const pts=w*3+d;
        Object.assign(t,{w,d,l,gf,ga,pts});
      }
    });
    teams.sort((a,b)=>b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga));

    // snapshot final table for consistency in week summary
    st.leagueSnapshot = teams.map(t=>({...t}));
    st.leagueSnapshotWeek = games;

    // adjust team levels based on final positions
    teams.forEach((t,i)=>{
      const lvl=getTeamLevel(t.team);
      if(i<3) st.teamLevels[t.team]=Math.min(99,lvl+2);
      else if(i<10) st.teamLevels[t.team]=Math.min(99,lvl+1);
      else if(i>=17) st.teamLevels[t.team]=Math.max(50,lvl-2);
      else st.teamLevels[t.team]=Math.max(50,lvl);
    });

    const pos=teams.findIndex(t=>t.team===club)+1;
    const totalTeams=teams.length;
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
    renderAll();
  }

  const {pos,won,tableHtml} = st.seasonSummary;
  const offerRenew = st.player.club!=='Free Agent' && st.player.yearsLeft<=1;

  const c=q('#match-content'); c.innerHTML='';
  const box=document.createElement('div'); box.className='glass';
  const seasonStat = st.player.pos==='Goalkeeper'
    ? `Season: ${st.seasonMinutes} min, CS ${st.seasonCleanSheets}`
    : `Season: ${st.seasonMinutes} min, G ${st.seasonGoals}, A ${st.seasonAssists}`;
  const careerStat = st.player.pos==='Goalkeeper'
    ? `Career: ${st.minutesPlayed} min, CS ${st.cleanSheets}`
    : `Career: ${st.minutesPlayed} min, G ${st.goals}, A ${st.assists}`;
  box.innerHTML = `<div class="h">Season ${st.season} summary</div>
    <div>League position: ${pos}/${totalTeams} ${won?' - <span class="badge">CHAMPIONS</span>':''}</div>
    <div class="muted" style="margin-top:8px">${seasonStat}</div>
    <div class="muted" style="margin-top:4px">${careerStat}</div>
    <div id="season-actions" style="text-align:center;margin:10px 0">
      <button class="btn primary" id="btn-next-season">Start next season</button>
      <button class="btn" id="btn-contract-rework">Contract</button>
      ${offerRenew?'<button class="btn" id="btn-renew-contract">Renew contract</button>':''}
    </div>
    ${tableHtml}`;
  c.append(box); q('#match-modal').setAttribute('open','');

  q('#btn-next-season').onclick=()=>{
    q('#match-modal').removeAttribute('open');
    const lastSeason = st.player.pos==='Goalkeeper'
      ? {min:st.seasonMinutes, cleanSheets:st.seasonCleanSheets}
      : {min:st.seasonMinutes, goals:st.seasonGoals, assists:st.seasonAssists};
    if(st.player.club!=='Free Agent'){
      // manager feedback
      let msg;
      if(st.player.pos==='Goalkeeper'){
        if(lastSeason.cleanSheets>=10 || lastSeason.min>=1800){
          st.player.salary=Math.round(st.player.salary*1.1);
          msg=`Great season! Salary increased to ${Game.money(weeklySalary(st.player))}/w.`;
        } else if(lastSeason.min<600){
          msg=`Tough season. Salary stays the same at ${Game.money(weeklySalary(st.player))}/w.`;
        } else {
          msg=`Well kid decent season, salary stays at ${Game.money(weeklySalary(st.player))}/w.`;
        }
      } else {
        if(lastSeason.goals>=10 || lastSeason.min>=1800){
          st.player.salary=Math.round(st.player.salary*1.1);
          msg=`Great season! Salary increased to ${Game.money(weeklySalary(st.player))}/w.`;
        } else if(lastSeason.min<600){
          msg=`Tough season. Salary stays the same at ${Game.money(weeklySalary(st.player))}/w.`;
        } else {
          msg=`Well kid decent season, salary stays at ${Game.money(weeklySalary(st.player))}/w.`;
        }
      }
      showPopup('Manager', msg);
      Game.log(`Manager: ${msg}`);

      st.player.yearsLeft = Math.max(0, st.player.yearsLeft-1);
      if(st.player.yearsLeft<=0){
        st.player.club='Free Agent';
        st.player.league='';
        st.player.status='-';
        st.player.timeBand='-';
        st.player.salary=0;
        st.player.yearsLeft=0;
        st.player.releaseClause=0;
        st.player.marketBlocked=0;
        Game.log('Contract ended. You are a Free Agent.');
      } else {
        st.player.marketBlocked = Math.max(0,(st.player.marketBlocked||0)-1);
      }
      const poorSeason = st.player.pos==='Goalkeeper'
        ? lastSeason.min>900 && lastSeason.cleanSheets<4
        : lastSeason.min>900 && (lastSeason.goals+lastSeason.assists)<2;
      if(poorSeason && Math.random()<0.5){
        const lower=makeOpponents(st.player.league||'Premier League').filter(t=>getTeamLevel(t)<getTeamLevel(st.player.club));
        if(lower.length){
          const club=pick(lower);
          st.lastOffers=[makeOfferForVaried(st.player,club,getTeamLevel(club),CLUB_TO_LEAGUE[club])];
          st.player.transferListed=true;
          Game.log('Club considers selling you after poor season.');
        }
      }
    }

    st.season += 1; st.week = 1;
    st.player.age += 1;
    if(st.player.loan){
      st.player.loan.seasonsLeft -= 1;
      if(st.player.loan.seasonsLeft<=0){
        st.player.club = st.player.loan.parentClub;
        st.player.league = st.player.loan.parentLeague;
        Game.log(`Loan ended. Returned to ${st.player.club}.`);
        showPopup('Loan ended', `Returned to ${st.player.club}.`);
        st.player.loan = null;
      }
    }
    const baseYear = new Date(new Date(st.schedule[0].date).getFullYear()+1,7,31).getFullYear();
    const first = realisticMatchDate(lastSaturdayOfAugust(baseYear));
    const league = st.player.league || 'Premier League';
    st.schedule = buildSchedule(first, leagueWeeks(league), st.player.club, league);
    st.currentDate = st.schedule[0].date; // on season start marker
    st.seasonMinutes=0; st.seasonGoals=0; st.seasonAssists=0; st.seasonCleanSheets=0;
    Object.keys(st.shopPurchases||{}).forEach(id=>{ const it=SHOP_ITEMS.find(i=>i.id===id); if(it && it.perSeason) delete st.shopPurchases[id]; });
    st.player.salaryMultiplier=1;
    st.seasonProcessed = false;
    st.seasonSummary = null;
    st.leagueSnapshot = [];
    st.leagueSnapshotWeek = 0;
    const contractInfo = st.player.club==='Free Agent'
      ? 'Free Agent.'
      : `Contract ${st.player.yearsLeft} season${st.player.yearsLeft!==1?'s':''} left.`;
    Game.log(`Season ${st.season} begins. Age ${st.player.age}. ${contractInfo}`);
    Game.state.auto=false; updateAutoBtn();
    Game.save(); renderAll();
    showPopup('Season start', `Season ${st.season} has started.`);
  };
  q('#btn-contract-rework').onclick=()=>{ q('#match-modal').removeAttribute('open'); openContractRework(); };
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

