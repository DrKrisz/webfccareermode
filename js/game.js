/* WebCareerGame • Pre-Alpha v0.1.0
   Game state and persistence helpers.
*/

// Version string injected into the UI and document title.
const APP_VERSION = 'v0.1.0';

// ===== Storage / Globals =====

const TEAM_BASE_LEVELS = {
  // Premier League 2025/26
  'Arsenal': 89,
  'Aston Villa': 74,
  'Bournemouth': 70,
  'Brentford': 73,
  'Brighton': 76,
  'Burnley': 68,
  'Chelsea': 85,
  'Crystal Palace': 66,
  'Everton': 72,
  'Fulham': 71,
  'Leeds United': 72,
  'Liverpool': 90,
  'Man City': 88,
  'Man Utd': 82,
  'Newcastle': 80,
  'Nottm Forest': 70,
  'Sunderland': 70,
  'Tottenham': 78,
  'West Ham': 74,
  'Wolves': 67,

  // EFL Championship 2025/26
  'Birmingham City': 65,
  'Blackburn Rovers': 67,
  'Bristol City': 66,
  'Charlton Athletic': 64,
  'Coventry City': 68,
  'Derby County': 69,
  'Hull City': 66,
  'Ipswich Town': 66,
  'Leicester City': 70,
  'Middlesbrough': 70,
  'Millwall': 67,
  'Norwich City': 69,
  'Oxford United': 64,
  'Portsmouth': 64,
  'Preston North End': 66,
  'Queens Park Rangers': 64,
  'Sheffield Utd': 72,
  'Sheffield Wednesday': 64,
  'Southampton': 72,
  'Stoke City': 67,
  'Swansea City': 67,
  'Watford': 68,
  'West Brom': 69,
  'Wrexham': 65
,
  // La Liga 2025/26
  'Alaves': 69,
  'Athletic Club': 77,
  'Atletico Madrid': 85,
  'Barcelona': 88,
  'Celta Vigo': 72,
  'Cadiz': 68,
  'Espanyol': 69,
  'Getafe': 70,
  'Girona': 72,
  'Granada': 68,
  'Las Palmas': 68,
  'Mallorca': 70,
  'Osasuna': 71,
  'Rayo Vallecano': 70,
  'Real Betis': 76,
  'Real Madrid': 90,
  'Real Sociedad': 80,
  'Sevilla': 78,
  'Valencia': 74,
  'Villarreal': 78,

  // Serie A 2025/26
  'Atalanta': 84,
  'Bologna': 78,
  'Cagliari': 69,
  'Empoli': 68,
  'Fiorentina': 79,
  'Genoa': 73,
  'Hellas Verona': 71,
  'Inter': 89,
  'Juventus': 87,
  'Lazio': 82,
  'Lecce': 67,
  'Milan': 86,
  'Monza': 72,
  'Napoli': 85,
  'Parma': 70,
  'Roma': 83,
  'Salernitana': 68,
  'Sassuolo': 74,
  'Torino': 75,
  'Udinese': 72
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
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    cleanSheets: 0,
    seasonCleanSheets: 0,
    seasonMinutes: 0,
    seasonMatches: 0,
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
  save(){ /* saving disabled */ },
  load(){ return false; },
  reset(){ location.reload(); },
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
      injury: null,
    };
    this.state.season = 1; this.state.week = 1;
    this.state.minutesPlayed = 0; this.state.matchesPlayed = 0; this.state.goals = 0; this.state.assists = 0; this.state.cleanSheets = 0;
    this.state.seasonMinutes = 0; this.state.seasonMatches = 0; this.state.seasonGoals = 0; this.state.seasonAssists = 0; this.state.seasonCleanSheets = 0;
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
    const league = 'Premier League';
    const first = realisticMatchDate(lastSaturdayOfAugust(year));
    this.state.schedule = buildSchedule(first, leagueWeeks(league), null, league);
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
    st.player.injury = st.player.injury || null;
  }
  if(typeof st.currentDate !== 'number'){
    const firstSched = Array.isArray(st.schedule) && st.schedule.length ? st.schedule[0] : null;
    if(firstSched && typeof firstSched.date === 'number') st.currentDate = firstSched.date;
    else st.currentDate = Date.now();
  }
}

