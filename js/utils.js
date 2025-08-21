/* WebCareerGame • Pre-Alpha v0.1.0
   Shared helper functions for simulation and economy.
*/

// ===== League data =====
const LEAGUES = {
  'Premier League': [
    'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton',
    'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
    'Liverpool', 'Man City', 'Man Utd', 'Newcastle', 'Nottm Forest',
    'Sheffield Utd', 'Tottenham', 'West Ham', 'Wolves', 'Luton Town'
  ],
  'EFL Championship': [
    'Birmingham City','Blackburn Rovers','Bristol City','Cardiff City','Coventry City',
    'Huddersfield Town','Hull City','Ipswich Town','Leeds United','Leicester City',
    'Middlesbrough','Millwall','Norwich City','Plymouth Argyle','Preston North End',
    'Queens Park Rangers','Rotherham United','Sheffield Wednesday','Southampton',
    'Stoke City','Sunderland','Swansea City','Watford','West Brom'
  ]
};
const CLUB_TO_LEAGUE = {};
Object.entries(LEAGUES).forEach(([lg,teams])=>teams.forEach(t=>{CLUB_TO_LEAGUE[t]=lg;}));
const ALL_CLUBS = Object.entries(LEAGUES).flatMap(([lg,teams])=>teams.map(t=>({club:t,league:lg})));

function getTeamLevel(club){
  return (Game.state.teamLevels && Game.state.teamLevels[club]) || TEAM_BASE_LEVELS[club] || 60;
}

// ===== Date / Schedule helpers =====
function lastSaturdayOfAugust(year){ const d = new Date(year,7,31); while(d.getDay()!==6) d.setDate(d.getDate()-1); return d; }
function realisticMatchDate(anchor){ // returns a plausible Premier League matchday for the week of anchor
  const base=new Date(anchor.getTime());
  // shift to Monday of that week
  base.setDate(base.getDate() - ((base.getDay()+6)%7));
  const roll=Math.random();
  let offset;
  if(roll<0.75) offset=5;         // Saturday
  else if(roll<0.95) offset=6;    // Sunday
  else if(roll<0.98) offset=4;    // Friday night
  else offset=7;                  // Monday night
  const d = new Date(base.getTime()); d.setDate(base.getDate()+offset); return d;
}
function weekAfter(d){ const n=new Date(d.getTime()); n.setDate(n.getDate()+7); return n; }

function buildSchedule(firstMatchDate, weeks, excludeClub, league=Game.state.player?.league||'Premier League'){
  const opponents = makeOpponents(league).filter(t=>t!==excludeClub);
  const out = [];
  // season start marker one day before first kickoff
  const seasonStart = new Date(firstMatchDate.getTime()); seasonStart.setDate(seasonStart.getDate()-1);
  out.push({date:seasonStart.getTime(), type:'seasonStart', isMatch:false, played:true});
  let last = new Date(firstMatchDate.getTime());
  let current = firstMatchDate;
  for(let i=0;i<weeks;i++){
    const d = realisticMatchDate(current);
    if(d.getTime() <= last.getTime()) d.setDate(last.getDate()+2); // ensure increasing
    last = d;
    out.push({date:d.getTime(), opponent:opponents[i%opponents.length], isMatch:true, played:false, result:null, scoreline:null, type:'match', competition:'League'});
    current = weekAfter(current);
  }
  // season end marker two days after final match
  const end=new Date(last.getTime()); end.setDate(end.getDate()+2);
  out.push({date:end.getTime(), type:'seasonEnd', isMatch:false, played:true});
  return out;
}

function ensureNoSelfMatches(club, league=Game.state.player?.league||'Premier League'){
  if(!club) return;
  const others = makeOpponents(league).filter(t=>t!==club);
  Game.state.schedule.forEach(e=>{
    if(e.isMatch && e.opponent===club){ e.opponent = pick(others); }
  });
}

// ===== Data / RNG helpers =====
function makeOpponents(league=Game.state.player?.league||'Premier League'){
  return LEAGUES[league] || LEAGUES['Premier League'];
}
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function randNorm(mu=0, sigma=1){ const u=1-Math.random(); const v=1-Math.random(); return mu+sigma*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function randInt(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
function sameDay(a,b){ const da=new Date(a), db=new Date(b); return da.getFullYear()===db.getFullYear() && da.getMonth()===db.getMonth() && da.getDate()===db.getDate(); }

// ===== Economy / Growth =====
function computeSalary(age,overall,league,status,timeBand){
  const overSq = overall*overall;
  const coef = 15;
  const leagueFactor = league==='Premier League'?1.5:1;
  const statusFactor = {
    'rookie':0.10,'decent':0.18,'key player':0.35,'important':0.60,'star player':1.00,
    'Backup keeper':0.05,'Reserve keeper':0.15,'First-choice':0.40,'World-class':1.00
  }[status]||0.2;
  const timeFactor = {'second bench':0.30,'bench':0.50,'rotater':0.80,'match player':1.00,'match starter':1.20}[timeBand]||0.6;
  const ageFactor = age<=18?0.75: age<=23?0.95: age<=28?1.10: age<=31?1.00: 0.85;
  const weekly = overSq*coef*timeFactor*leagueFactor*statusFactor*ageFactor;
  return Math.max(500, Math.min(weekly, 600000));
}
function computeValue(overall,league,weeklySalary){
  const leagueFactor=league==='Premier League'?1.15:1;
  const base=(overall*overall)*330*leagueFactor;
  const fromSalary=weeklySalary*52*4; // salary-derived valuation proxy
  return Math.max(base, fromSalary);
}

function weeklySalary(p){
  return Math.round((p.salary||0)*(p.salaryMultiplier||1));
}
function applyPostMatchGrowth(st, minutes, rating, goals, assists, played, conceded=0){
  const targetMap={'second bench':10,'bench':20,'rotater':45,'match player':70,'match starter':90};
  const target=targetMap[st.player.timeBand]||30; let delta=0;
  if(minutes>=target) delta+=0.2; if(rating>=7) delta+=0.2; if(rating>=8) delta+=0.2;
  if(st.player.pos==='Goalkeeper'){
    if(conceded===0) delta+=0.25;
    else delta-=0.05*conceded;
  } else {
    if(st.player.pos==='Attacker') delta+=goals*.25+assists*.15;
    if(st.player.pos==='Midfield') delta+=goals*.18+assists*.20;
    if(st.player.pos==='Defender') delta+=goals*.12+assists*.08;
  }
  if(minutes<target*.4) delta-=0.15; if(st.player.age>=31) delta-=0.05;
  const clubLvl=getTeamLevel(st.player.club);
  if(clubLvl<75) delta+=0.1; // lower level clubs boost growth
  delta += played?0.1:-0.05;
  st.player.overall = Math.max(55, Math.min(100, +(st.player.overall+delta).toFixed(2)));
}

