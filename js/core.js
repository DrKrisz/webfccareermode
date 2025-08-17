/* WebCareerGame • Pre-Alpha v0.0.7
   External JS (state, sim, UI). Mobile + desktop safe.
   Keep gameplay deterministic enough for testing but fun.
*/

// Version string injected into the UI and document title.
const APP_VERSION = 'v0.0.7';

// ===== Storage / Globals =====
const LS_KEY = 'webcareergame.save.v007';

const Game = {
  state: {
    // player fields get filled on newGame
    player: null, // {name, age, origin, pos, overall, club, league, status, timeBand, salary, value, balance, yearsLeft, transferListed, alwaysPlay, goldenClub}
    season: 1,
    week: 1,
    currentDate: null,
    schedule: [],
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    seasonMinutes: 0,
    seasonGoals: 0,
    seasonAssists: 0,
    lastOffers: [],
    playedMatchDates: [],
    eventLog: [],
    shopPurchases: {},
    auto: false,
  },
  money(n){ try { return '£' + Math.round(n).toLocaleString('en-GB'); } catch { return '£' + Math.round(n); } },
  save(){ localStorage.setItem(LS_KEY, JSON.stringify(this.state)); },
  load(){
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return false;
    try{
      this.state = JSON.parse(raw);
      migrateState(this.state);
      return true;
    }catch{
      return false;
    }
  },
  reset(){ localStorage.removeItem(LS_KEY); location.reload(); },
  log(msg){ const stamp = new Date(this.state.currentDate || Date.now()).toDateString(); this.state.eventLog.push(`[${stamp}] ${msg}`); },
  newGame(setup){
    const base = 55 + Math.floor(Math.random()*6);
    const overall = Math.min(60, base + (setup.pos==='Defender'?1:0));
    this.state.player = {
      name: setup.name.trim(),
      age: +setup.age,
      origin: setup.origin,
      pos: setup.pos,
      overall,
      club: 'Free Agent',
      league: '',
      status: '-',
      timeBand: '-',
      salary: 0,
      salaryMultiplier: 1,
      passiveIncome: 0,
      houses: 0,
      value: 0,
      balance: 0,
      yearsLeft: 0,
      transferListed: false,
      alwaysPlay: !!setup.alwaysPlay,
      goldenClub: false,
    };
    this.state.season = 1; this.state.week = 1;
    this.state.minutesPlayed = 0; this.state.goals = 0; this.state.assists = 0;
    this.state.seasonMinutes = 0; this.state.seasonGoals = 0; this.state.seasonAssists = 0;
    this.state.lastOffers = []; this.state.playedMatchDates = []; this.state.eventLog = [];
    this.state.shopPurchases = {};
    this.state.auto = false;
    const year = new Date().getFullYear();
    const first = randomWedToSatOfWeek(lastSaturdayOfAugust(year));
    this.state.schedule = buildSchedule(first, 38);
    // start at season start marker day for clarity
    this.state.currentDate = this.state.schedule[0].date;
    this.log(`Career started: ${this.state.player.name}, ${this.state.player.age}, ${this.state.player.pos}, ${this.state.player.origin}`);
    this.save();
  }
};

// ensure missing fields exist for older saves
function migrateState(st){
  st.eventLog = st.eventLog || [];
  st.playedMatchDates = st.playedMatchDates || [];
  st.shopPurchases = st.shopPurchases || {};
  st.auto = !!st.auto;
  if(st.player){
    st.player.salaryMultiplier = st.player.salaryMultiplier || 1;
    st.player.passiveIncome = st.player.passiveIncome || 0;
    st.player.houses = st.player.houses || 0;
    st.player.status = st.player.status || '-';
    st.player.timeBand = st.player.timeBand || '-';
  }
  if(typeof st.currentDate !== 'number'){
    const firstSched = Array.isArray(st.schedule) && st.schedule.length ? st.schedule[0] : null;
    if(firstSched && typeof firstSched.date === 'number') st.currentDate = firstSched.date;
    else st.currentDate = Date.now();
  }
}

// ===== Date / Schedule helpers =====
function lastSaturdayOfAugust(year){ const d = new Date(year,7,31); while(d.getDay()!==6) d.setDate(d.getDate()-1); return d; }
function randomWedToSatOfWeek(anchor){ // returns a date between Wed..Sat of the week of anchor
  const base=new Date(anchor.getTime());
  // shift to Monday of that week
  base.setDate(base.getDate() - ((base.getDay()+6)%7));
  const offset = [3,4,5,6][Math.floor(Math.random()*4)]; // Wed..Sat
  const d = new Date(base.getTime()); d.setDate(base.getDate()+offset); return d;
}
function weekAfter(d){ const n=new Date(d.getTime()); n.setDate(n.getDate()+7); return n; }

function buildSchedule(firstMatchDate, weeks, excludeClub){
  const opponents = makeOpponents().filter(t=>t!==excludeClub);
  const out = [];
  // season start marker one day before first kickoff
  const seasonStart = new Date(firstMatchDate.getTime()); seasonStart.setDate(seasonStart.getDate()-1);
  out.push({date:seasonStart.getTime(), type:'seasonStart', isMatch:false, played:true});
  let last = new Date(firstMatchDate.getTime());
  let current = firstMatchDate;
  for(let i=0;i<weeks;i++){
    const d = randomWedToSatOfWeek(current);
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

function ensureNoSelfMatches(club){
  if(!club) return;
  const others = makeOpponents().filter(t=>t!==club);
  Game.state.schedule.forEach(e=>{
    if(e.isMatch && e.opponent===club){ e.opponent = pick(others); }
  });
}

// ===== Data / RNG helpers =====
function makeOpponents(){
  // 20 Premier League teams (2023/24 season)
  return [
    'Arsenal','Aston Villa','Bournemouth','Brentford','Brighton & Hove Albion',
    'Burnley','Chelsea','Crystal Palace','Everton','Fulham',
    'Liverpool','Luton Town','Manchester City','Manchester United','Newcastle United',
    'Nottingham Forest','Sheffield United','Tottenham Hotspur','West Ham United','Wolverhampton Wanderers'
  ];
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
  const statusFactor = {'rookie':0.10,'decent':0.18,'key player':0.35,'important':0.60,'star player':1.00}[status]||0.2;
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
function applyPostMatchGrowth(st, minutes, rating, goals, assists){
  const targetMap={'second bench':10,'bench':20,'rotater':45,'match player':70,'match starter':90};
  const target=targetMap[st.player.timeBand]||30; let delta=0;
  if(minutes>=target) delta+=0.2; if(rating>=7) delta+=0.2; if(rating>=8) delta+=0.2;
  if(st.player.pos==='Attacker') delta+=goals*.25+assists*.15;
  if(st.player.pos==='Midfield') delta+=goals*.18+assists*.20;
  if(st.player.pos==='Defender') delta+=goals*.12+assists*.08;
  if(minutes<target*.4) delta-=0.15; if(st.player.age>=31) delta-=0.05;
  st.player.overall = Math.max(55, Math.min(100, +(st.player.overall+delta).toFixed(2)));
}

// ===== Market / Contracts =====
function rollMarketOffers(p){
  const count=1+Math.floor(Math.random()*5);
  const clubs=makeOpponents().sort(()=>Math.random()-0.5).slice(0,count);
  return clubs.map(c=>makeOfferForVaried(p,c));
}
function makeOfferFor(player, club){ return makeOfferForVaried(player, club); }
function makeOfferForVaried(player, club){
  const o=player.overall;
  const status = o>=88?pick(['important','star player'])
              : o>=80?pick(['key player','important'])
              : o>=72?'key player'
              : o>=65?'decent':'rookie';
  const timeMap={'rookie':'second bench','decent':pick(['bench','rotater']),'key player':pick(['rotater','match player']),'important':pick(['match player','match starter']),'star player':'match starter'};
  const timeBand=timeMap[status];
  const clubFactor = 0.8 + Math.random()*0.6; // 0.8..1.4
  const posBonus = player.pos==='Attacker'?1.15: player.pos==='Midfield'?1.05: 1.0;
  const years=Math.min(5, Math.max(1, Math.round(randNorm(2.2,1.2))));
  const league='Premier League';
  let salary=computeSalary(player.age,player.overall,league,status,timeBand)*clubFactor*posBonus;
  const lengthFactor = years>=4?0.9: years===3?1.0: years===2?1.08:1.15; // shorter pays more
  salary*=lengthFactor;
  const value=computeValue(player.overall,league,salary);
  return {club,league,years,status,timeBand,salary,value};
}

