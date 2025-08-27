// ===== Helper functions for league simulation =====
function createRNG(seed){
  let s=seed>>>0;
  return function(){
    s=(s*1664525+1013904223)>>>0;
    return s/4294967296;
  };
}

function poissonRandom(lambda, rand=Math.random){
  let L=Math.exp(-lambda),k=0,p=1;
  do{ k++; p*=rand(); }while(p>L);
  return k-1;
}

// Calculate relative team strength from dynamic team levels.
function teamStrength(club){
  const lvl = getTeamLevel(club); // use current level instead of static baseline
  return (lvl-70)/60; // roughly -0.16..0.33
}

function shuffle(arr, rand=Math.random){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(rand()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

function buildFixtures(clubs, rand=Math.random){
  const teams=clubs.slice();
  if(teams.length%2===1) teams.push('BYE');
  shuffle(teams, rand);
  const n=teams.length;
  const rounds=[];
  for(let r=0;r<n-1;r++){
    const week=[];
    for(let i=0;i<n/2;i++){
      const home=teams[i], away=teams[n-1-i];
      if(home!=='BYE' && away!=='BYE') week.push({home, away});
    }
    rounds.push(week);
    teams.splice(1,0,teams.pop()); // rotate
  }
  const returnRounds=rounds.map(week=>week.map(m=>({home:m.away, away:m.home})));
  return rounds.concat(returnRounds);
}

function getFixtures(league){
  const st=Game.state;
  st.leagueFixtures = st.leagueFixtures || {};
  st.leagueSeeds = st.leagueSeeds || {};
  if(!st.leagueFixtures[league]){
    const clubs=makeOpponents(league);
    st.leagueSeeds[league]=Math.floor(Math.random()*1e9);
    st.leagueFixtures[league]=buildFixtures(clubs);
  }
  return st.leagueFixtures[league];
}

// ===== League snapshot during season =====
function updateLeagueSnapshot(){
  const st=Game.state;
  if(!st.player || st.player.club==='Free Agent') return;
  const gamesTotal=leagueWeeks(st.player.league||'Premier League');
  if(st.seasonProcessed && st.leagueSnapshotWeek===gamesTotal) return;
  const played=(st.schedule||[]).filter(e=>e.isMatch && e.played).length;
  if(st.leagueSnapshot && st.leagueSnapshot.length>0 && st.leagueSnapshotWeek===played) return;
  const league=st.player.league||'Premier League';
  getFixtures(league);
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
  const st=Game.state;
  const clubs=makeOpponents(league);
  const fixtures=getFixtures(league);
  const teams=clubs.map(c=>({team:c,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
  const map=Object.fromEntries(teams.map(t=>[t.team,t]));
  const rand=createRNG(st.leagueSeeds[league]||0);

  // apply real results to fixtures
  if(st.schedule){
    st.schedule.filter(e=>e.isMatch && e.played && e.competition==='League').forEach(e=>{
      const [gf,ga]=e.scoreline.split('-').map(Number);
      const club=st.player.club;
      let match=fixtures.flat().find(m=>m.home===club && m.away===e.opponent && m.gh==null);
      if(match){ match.gh=gf; match.ga=ga; }
      else {
        match=fixtures.flat().find(m=>m.home===e.opponent && m.away===club && m.gh==null);
        if(match){ match.gh=ga; match.ga=gf; }
      }
    });
  }

  const weeks=Math.min(played, fixtures.length);
  for(let r=0;r<weeks;r++){
    fixtures[r].forEach(m=>{
      const {home,away}=m;
      const sh=teamStrength(home);
      const sa=teamStrength(away);
      const lambdaHome=1.30*Math.exp(0.15+(sh-sa));
      const lambdaAway=1.30*Math.exp(sa-sh);
      const gh=m.gh!=null?m.gh:poissonRandom(lambdaHome, rand);
      const ga=m.ga!=null?m.ga:poissonRandom(lambdaAway, rand);
      const h=map[home], a=map[away];
      h.gf+=gh; h.ga+=ga; a.gf+=ga; a.ga+=gh;
      if(gh>ga){ h.w++; a.l++; h.pts+=3; }
      else if(gh<ga){ a.w++; h.l++; a.pts+=3; }
      else { h.d++; a.d++; h.pts++; a.pts++; }
    });
  }
  teams.sort((a,b)=>b.pts-a.pts || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf || a.team.localeCompare(b.team));
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
