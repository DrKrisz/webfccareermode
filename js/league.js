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
  leagues.push('Carabao Cup');
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
    if(lg==='Carabao Cup'){
      const cup=(st.schedule||[]).filter(e=>e.competition==='Carabao Cup');
      const rows=cup.map(e=>{
        const res=e.played?`${e.result}${e.scoreline?` ${e.scoreline}`:''}`:'TBD';
        return `<tr><td>${e.round||''}</td><td>${e.opponent}</td><td>${res}</td></tr>`;
      }).join('');
      tableWrap.innerHTML=`<table class="league-table"><thead><tr><th>Round</th><th>Opponent</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>`;
      return;
    } else if(st.player && st.player.league===lg){
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
