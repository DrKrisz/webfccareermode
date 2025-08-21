/* WebCareerGame • Pre-Alpha v0.1.0
   Game state and persistence helpers.
*/

// Version string injected into the UI and document title.
const APP_VERSION = 'v0.1.0';

// ===== Storage / Globals =====
const LS_KEY = 'webcareergame.save.v010';

// Base strength levels for each club (0-100 scale roughly reflecting squad quality)
const TEAM_BASE_LEVELS = {
  'Arsenal': 85,
  'Aston Villa': 78,
  'Bournemouth': 70,
  'Brentford': 74,
  'Brighton': 78,
  'Burnley': 68,
  'Chelsea': 82,
  'Crystal Palace': 72,
  'Everton': 72,
  'Fulham': 73,
  'Liverpool': 88,
  'Man City': 90,
  'Man Utd': 84,
  'Newcastle': 80,
  'Nottm Forest': 70,
  'Sheffield Utd': 70,
  'Tottenham': 80,
  'West Ham': 75,
  'Wolves': 71,
  'Luton Town': 68,
  // EFL Championship
  'Birmingham City': 65,
  'Blackburn Rovers': 68,
  'Bristol City': 66,
  'Cardiff City': 66,
  'Coventry City': 72,
  'Huddersfield Town': 64,
  'Hull City': 67,
  'Ipswich Town': 65,
  'Leeds United': 74,
  'Leicester City': 82,
  'Middlesbrough': 72,
  'Millwall': 67,
  'Norwich City': 72,
  'Plymouth Argyle': 63,
  'Preston North End': 67,
  'Queens Park Rangers': 63,
  'Rotherham United': 60,
  'Sheffield Wednesday': 64,
  'Southampton': 80,
  'Stoke City': 68,
  'Sunderland': 69,
  'Swansea City': 67,
  'Watford': 70,
  'West Brom': 71
};

const Game = {
  state: {
    // player fields get filled on newGame
    player: null, // {name, age, origin, pos, overall, club, league, status, timeBand, salary, value, balance, yearsLeft, transferListed, alwaysPlay, goldenClub, releaseClause, marketBlocked, contractReworkYear, loan}
    season: 1,
    week: 1,
    currentDate: null,
    schedule: [],
    minutesPlayed: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    seasonCleanSheets: 0,
    seasonMinutes: 0,
    seasonGoals: 0,
    seasonAssists: 0,
    lastOffers: [],
    playedMatchDates: [],
    eventLog: [],
    shopPurchases: {},
    auto: false,
    lastTrainingDate: null,
    seasonProcessed: false,
    teamLevels: {},
    leagueSnapshot: [],
    leagueSnapshotWeek: 0,
    seasonSummary: null,
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
      releaseClause: 0,
      marketBlocked: 0,
      contractReworkYear: 0,
      loan: null,
    };
    this.state.season = 1; this.state.week = 1;
    this.state.minutesPlayed = 0; this.state.goals = 0; this.state.assists = 0; this.state.cleanSheets = 0;
    this.state.seasonMinutes = 0; this.state.seasonGoals = 0; this.state.seasonAssists = 0; this.state.seasonCleanSheets = 0;
    this.state.lastOffers = []; this.state.playedMatchDates = []; this.state.eventLog = [];
    this.state.shopPurchases = {};
    this.state.auto = false;
    this.state.lastTrainingDate = null;
    this.state.seasonProcessed = false;
    this.state.teamLevels = {...TEAM_BASE_LEVELS};
    this.state.leagueSnapshot = [];
    this.state.leagueSnapshotWeek = 0;
    this.state.seasonSummary = null;
    const year = new Date().getFullYear();
    const first = realisticMatchDate(lastSaturdayOfAugust(year));
    this.state.schedule = buildSchedule(first, 38, null, 'Premier League');
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
  st.lastTrainingDate = st.lastTrainingDate || null;
  st.seasonProcessed = !!st.seasonProcessed;
  st.teamLevels = st.teamLevels || {...TEAM_BASE_LEVELS};
  st.leagueSnapshot = st.leagueSnapshot || [];
  st.leagueSnapshotWeek = st.leagueSnapshotWeek || 0;
  st.seasonSummary = st.seasonSummary || null;
  st.cleanSheets = st.cleanSheets || 0;
  st.seasonCleanSheets = st.seasonCleanSheets || 0;
  if(st.player){
    st.player.salaryMultiplier = st.player.salaryMultiplier || 1;
    st.player.passiveIncome = st.player.passiveIncome || 0;
    st.player.houses = st.player.houses || 0;
    st.player.status = st.player.status || '-';
    st.player.timeBand = st.player.timeBand || '-';
    st.player.releaseClause = st.player.releaseClause || 0;
    st.player.marketBlocked = st.player.marketBlocked || 0;
    st.player.contractReworkYear = st.player.contractReworkYear || 0;
    st.player.loan = st.player.loan || null;
  }
  if(typeof st.currentDate !== 'number'){
    const firstSched = Array.isArray(st.schedule) && st.schedule.length ? st.schedule[0] : null;
    if(firstSched && typeof firstSched.date === 'number') st.currentDate = firstSched.date;
    else st.currentDate = Date.now();
  }
}

