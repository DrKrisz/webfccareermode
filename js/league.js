// ===== Helper functions for league simulation =====
function poissonRandom(lambda){
  let L=Math.exp(-lambda),k=0,p=1;
  do{ k++; p*=Math.random(); }while(p>L);
  return k-1;
}

function teamStrength(club){
  const lvl=TEAM_BASE_LEVELS[club] || 70;
  return (lvl-70)/40; // roughly -0.25..0.5
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

function buildFixtures(clubs){
  const teams=clubs.slice();
  shuffle(teams);
  const n=teams.length;
  const rounds=[];
  for(let r=0;r<n-1;r++){
    const week=[];
    for(let i=0;i<n/2;i++){
      week.push({home:teams[i], away:teams[n-1-i]});
    }
    rounds.push(week);
    teams.splice(1,0,teams.pop()); // rotate
  }
  const returnRounds=rounds.map(week=>week.map(m=>({home:m.away, away:m.home})));
  return rounds.concat(returnRounds);
}

// ===== League snapshot during season =====
function updateLeagueSnapshot(){
  const st=Game.state;
  if(!st.player || st.player.club==='Free Agent') return;
  const gamesTotal=leagueWeeks(st.player.league||'Premier League');
  if(st.seasonProcessed && st.leagueSnapshotWeek===gamesTotal) return;
  const played=st.schedule.filter(e=>e.isMatch && e.played).length;
  if(st.leagueSnapshotWeek===played) return;
  const league=st.player.league||'Premier League';
  const club=st.player.club;
  const teams=randomLeagueTable(league, played);
  const stats={w:0,d:0,l:0,gf:0,ga:0};
  st.schedule.filter(e=>e.isMatch && e.played).forEach(e=>{
    if(e.result==='W') stats.w++; else if(e.result==='D') stats.d++; else stats.l++;
    if(e.scoreline){ const [gf,ga]=e.scoreline.split('-').map(Number); stats.gf+=gf; stats.ga+=ga; }
  });
  stats.pts=stats.w*3+stats.d;
  const idx=teams.findIndex(t=>t.team===club);
  if(idx>=0) Object.assign(teams[idx],stats);
  st.leagueSnapshot=teams;
  st.leagueSnapshotWeek=played;
  Game.save();
}

function randomLeagueTable(league, played){
  const clubs=makeOpponents(league);
  const fixtures=buildFixtures(clubs);
  const teams=clubs.map(c=>({team:c,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
  const map=Object.fromEntries(teams.map(t=>[t.team,t]));
  const weeks=Math.min(played, fixtures.length);
  for(let r=0;r<weeks;r++){
    fixtures[r].forEach(({home,away})=>{
      const sh=teamStrength(home);
      const sa=teamStrength(away);
      const gh=poissonRandom(Math.exp(sh-sa+0.15));
      const ga=poissonRandom(Math.exp(sa-sh));
      const h=map[home], a=map[away];
      h.gf+=gh; h.ga+=ga; a.gf+=ga; a.ga+=gh;
      if(gh>ga){ h.w++; a.l++; h.pts+=3; }
      else if(gh<ga){ a.w++; h.l++; a.pts+=3; }
      else { h.d++; a.d++; h.pts++; a.pts++; }
    });
  }
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
      tableWrap.innerHTML=renderCarabaoCupTable(cup);
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
