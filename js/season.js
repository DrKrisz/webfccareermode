// ===== Season end summary & rollover =====
function startNextSeason(){
  const st=Game.state;
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
  const relegated = st.relegated||[];
  const promoted = st.promoted||[];
  if(relegated.length || promoted.length){
    applyPromotionRelegation(promoted,relegated);
    if(relegated.includes(st.player.club)) st.player.league='EFL Championship';
    else if(promoted.includes(st.player.club)) st.player.league='Premier League';
    relegated.forEach(c=>{ Game.log(`${c} relegated to EFL Championship.`); showPopup('Relegated', `${c} move to Championship.`); });
    promoted.forEach(c=>{ Game.log(`${c} promoted to Premier League.`); showPopup('Promoted', `${c} move to Premier League.`); });
    st.relegated=[]; st.promoted=[];
  }
  const baseYear = new Date(new Date(st.schedule[0].date).getFullYear()+1,7,31).getFullYear();
  const first = realisticMatchDate(lastSaturdayOfAugust(baseYear));
  const league = st.player.league || 'Premier League';
  st.schedule = buildSchedule(first, leagueWeeks(league), st.player.club, league);
  st.currentDate = st.schedule[0].date; // on season start marker
  st.seasonMinutes=0; st.seasonMatches=0; st.seasonGoals=0; st.seasonAssists=0; st.seasonCleanSheets=0;
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
}
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
    const games = leagueWeeks(st.player.league||'Premier League');
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

    // determine promotion/relegation across Premier League and Championship
    let promoted=[], relegated=[];
    if(st.player.league==='Premier League'){
      relegated = teams.slice(-3).map(t=>t.team);
      const champTable = randomLeagueTable('EFL Championship', leagueWeeks('EFL Championship'));
      promoted = champTable.slice(0,3).map(t=>t.team);
      // adjust levels for Championship teams generated here
      champTable.forEach((t,i)=>{
        const lvl=getTeamLevel(t.team);
        if(promoted.includes(t.team)) st.teamLevels[t.team]=Math.min(99,lvl+4);
        else if(i>=champTable.length-3) st.teamLevels[t.team]=Math.max(50,lvl-4);
        else if(i<10) st.teamLevels[t.team]=Math.min(99,lvl+1);
        else st.teamLevels[t.team]=Math.max(50,lvl);
      });
    } else if(st.player.league==='EFL Championship'){
      promoted = teams.slice(0,3).map(t=>t.team);
      const premTable = randomLeagueTable('Premier League', leagueWeeks('Premier League'));
      relegated = premTable.slice(-3).map(t=>t.team);
      // adjust levels for Premier League teams generated here
      premTable.forEach((t,i)=>{
        const lvl=getTeamLevel(t.team);
        if(relegated.includes(t.team)) st.teamLevels[t.team]=Math.max(50,lvl-4);
        else if(i<10) st.teamLevels[t.team]=Math.min(99,lvl+1);
        else st.teamLevels[t.team]=Math.max(50,lvl);
      });
    } else {
      promoted = teams.slice(0,3).map(t=>t.team);
      relegated = teams.slice(-3).map(t=>t.team);
    }

    // snapshot final table for consistency in week summary
    st.leagueSnapshot = teams.map(t=>({...t}));
    st.leagueSnapshotWeek = games;

    // adjust team levels based on final positions
    teams.forEach((t,i)=>{
      const lvl=getTeamLevel(t.team);
      if(promoted.includes(t.team)) st.teamLevels[t.team]=Math.min(99,lvl+4);
      else if(i<10) st.teamLevels[t.team]=Math.min(99,lvl+1);
      else if(relegated.includes(t.team)) st.teamLevels[t.team]=Math.max(50,lvl-4);
      else if(i>=17) st.teamLevels[t.team]=Math.max(50,lvl-2);
      else st.teamLevels[t.team]=Math.max(50,lvl);
    });

    // adjust levels for teams not in the player's league list
    promoted.forEach(t=>{
      if(!teams.find(tm=>tm.team===t)){
        const lvl=getTeamLevel(t);
        st.teamLevels[t]=Math.min(99,lvl+4);
      }
    });
    relegated.forEach(t=>{
      if(!teams.find(tm=>tm.team===t)){
        const lvl=getTeamLevel(t);
        st.teamLevels[t]=Math.max(50,lvl-4);
      }
    });
    st.relegated=relegated;
    st.promoted=promoted;

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

    st.seasonSummary = {teams,pos,totalTeams,won,tableHtml};
    st.seasonProcessed=true;
    Game.save();
    renderAll();
  }

  const {pos,won,totalTeams,tableHtml} = st.seasonSummary;
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
    startNextSeason();
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

