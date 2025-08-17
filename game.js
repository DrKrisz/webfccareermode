/* WebCareerGame • Pre‑Alpha v0.0.5
   External JS (state, sim, UI). Mobile + desktop safe.
   Keep gameplay deterministic enough for testing but fun.
*/

// Version string injected into the UI and document title.
const APP_VERSION = 'v0.0.5';

// ===== Storage / Globals =====
const LS_KEY = 'webcareergame.save.v005';

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
    auto: false,
  },
  money(n){ try { return '£' + Math.round(n).toLocaleString('en-GB'); } catch { return '£' + Math.round(n); } },
  save(){ localStorage.setItem(LS_KEY, JSON.stringify(this.state)); },
  load(){ const raw = localStorage.getItem(LS_KEY); if(!raw) return false; try{ this.state = JSON.parse(raw); return true; }catch{ return false; } },
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
      status: '—',
      timeBand: '—',
      salary: 0,
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
  // Season start marker (non-match) – 1 day before first kickoff OR same day? We keep marker the day before kickoff-ish.
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
  // Season end marker two days after final match
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

// ===== UI small helpers =====
function q(sel){ return document.querySelector(sel); }
function btn(label, onClick, cls='btn primary'){ const b=document.createElement('button'); b.className=cls; b.textContent=label; b.onclick=onClick; return b; }
function fmtValue(v){ if(v>=1_000_000) return '£'+(v/1_000_000).toFixed(1)+'m'; if(v>=1_000) return '£'+Math.round(v/100)/10+'k'; return Game.money(v); }

// ===== Rendering =====
function renderAll(){
  const st = Game.state; const onLanding = !st.player;
  q('#landing').style.display = onLanding ? 'grid' : 'none';
  q('#manager').style.display = onLanding ? 'none' : 'block';
  if(onLanding) return;

  // Left info
  q('#v-name').textContent = st.player.name;
  q('#v-age').textContent = st.player.age;
  q('#v-pos').textContent = st.player.pos;
  if(st.player.goldenClub){ q('#v-club').innerHTML = `<span class="gold">★ ${st.player.club}</span>`; }
  else { q('#v-club').textContent = st.player.club; }
  q('#v-league').textContent = st.player.league || '—';
  q('#v-status').textContent = st.player.status;
  q('#v-years').textContent = st.player.yearsLeft ? `${st.player.yearsLeft} season${st.player.yearsLeft>1?'s':''}` : '—';

  q('#v-season').textContent = st.season;
  q('#v-week').textContent = `${Math.min(st.week,38)} / 38`;
  q('#v-overall').textContent = st.player.overall;
  q('#v-playtime').textContent = `${st.minutesPlayed} min`;
  q('#v-salary').textContent = Game.money(st.player.salary) + ' /week';
  q('#v-value').textContent = fmtValue(st.player.value);
  q('#v-balance').textContent = Game.money(st.player.balance||0);

  const landing = q('#landing');
  const manager = q('#manager');
  if (onLanding) {
    landing.classList.remove('hidden');
    manager.classList.add('hidden');
    manager.style.display = '';
  } else {
    landing.classList.add('hidden');
    manager.classList.remove('hidden');
    manager.style.display = '';
  }

  // This week panel
  const today = new Date(st.currentDate);
  const todayEntry = st.schedule.find(d=>sameDay(d.date, st.currentDate));
  const cta = q('#week-cta'); if(cta) cta.innerHTML='';
  if(st.player.club==='Free Agent'){
    q('#week-summary').textContent = 'You are a free agent. Explore offers and sign your first deal.';
    if(cta) cta.append(btn('Open market', ()=>openMarket()));
  }
  else if(todayEntry && todayEntry.isMatch){
    q('#week-summary').innerHTML = `Match day: ${st.player.club} vs ${todayEntry.opponent}<div class="muted" style="font-size:11px">${todayEntry.competition||'League'} game</div>`;
    if(!todayEntry.played && cta) cta.append(btn('Play match', ()=>openMatch(todayEntry)));
  }
  else if(todayEntry && todayEntry.type==='seasonEnd'){
    q('#week-summary').textContent = 'Season ended. View summary and continue.';
    if(cta) cta.append(btn('Season summary', ()=>openSeasonEnd()));
  }
  else{
    q('#week-summary').textContent = 'Training and recovery. Prepare for the next game.';
  }

  const trainBtn=q('#btn-train');
  if(trainBtn){
    const hasMatch=todayEntry && todayEntry.isMatch;
    const injured=st.player.status && st.player.status.toLowerCase().includes('injur');
    trainBtn.disabled = hasMatch || injured;
  }

  const nextBtn=q('#btn-next');
  if(nextBtn){
    if(todayEntry && todayEntry.isMatch && !todayEntry.played) nextBtn.textContent='Simulate match';
    else if(todayEntry && todayEntry.type==='seasonEnd') nextBtn.textContent='Season summary';
    else nextBtn.textContent='Next day';
  }

  q('#date-label').textContent = today.toDateString();
  renderCalendar();
  renderLiveLog();
  updateAutoBtn();
}

function renderCalendar(){
  const grid=q('#calendar'); grid.innerHTML='';
  const st=Game.state; const winStart=new Date(st.currentDate); winStart.setDate(winStart.getDate()-14);
  for(let i=0;i<28;i++){
    const d=new Date(winStart.getTime()); d.setDate(d.getDate()+i);
    const entry=st.schedule.find(x=>sameDay(x.date, d.getTime()));
    const item=document.createElement('div');
    item.className='day'+(entry&&entry.isMatch?' match':'')+(sameDay(d.getTime(), st.currentDate)?' today':'')+(entry&&entry.played&&entry.isMatch?' played':'');
    const dateStr=d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
    let extra=''; if(entry&&entry.result){ extra=`<div style="font-size:11px">${entry.result} ${entry.scoreline}</div>`; }
    let label='';
    if(entry){
      if(entry.type==='seasonStart') label='<div style="font-size:11px">Season start</div>';
      else if(entry.type==='seasonEnd') label='<div style="font-size:11px">Season end</div>';
      else if(entry.isMatch) label=`<div style="font-size:11px;">vs ${entry.opponent}</div><div style="font-size:10px">${entry.competition||'League'} game</div>`;
    }
    item.innerHTML=`<div class="muted">${dateStr}</div><div class="dot"></div>${label}${extra||''}`;

    if(entry && entry.isMatch){
      if(sameDay(entry.date, st.currentDate)){
        item.style.cursor='pointer';
        item.title = entry.played ? 'View match summary' : 'Play match';
        item.onclick = ()=> entry.played ? viewMatchSummary(entry) : openMatch(entry);
      }
      else if(entry.played){
        item.style.cursor='pointer';
        item.title='View match summary';
        item.onclick=()=> viewMatchSummary(entry);
      }
    }
    grid.append(item);
  }
}

function renderLiveLog(){
  const el=q('#live-log');
  if(!el) return;
  const st=Game.state;
  const last=st.eventLog.slice().reverse();
  el.textContent = last.join('\n');
  el.scrollTop = 0;
}

function injectVersion(){
  const before = document.title;
  const next = before.replace(/v[\d.]+/, APP_VERSION);
  document.title = (before === next) ? `${before} ${APP_VERSION}` : next;
  document.querySelectorAll('.app-version').forEach(el => el.textContent = APP_VERSION);
}

// ===== Market UI =====
function openMarket(){
  const st=Game.state; const info=q('#market-info'); const list=q('#market-list'); const empty=q('#market-empty');
  list.innerHTML=''; empty.classList.add('hidden');
  if(st.player.club!=='Free Agent'){
    info.textContent = st.player.transferListed? 'You are listed for transfer. Teams may approach soon.' : 'You are under contract. Request a transfer listing if you want to move.';
    const action = btn(st.player.transferListed?'Refresh offers':'Request transfer listing', ()=>{
      if(st.player.transferListed){ st.lastOffers = Math.random()<0.6 ? rollMarketOffers(st.player) : []; }
      else {
        const approve = Math.random()<0.6; // 60% approve
        if(approve){ st.player.transferListed=true; Game.log('Club approved transfer listing'); alert('Your club listed you for transfer.'); }
        else { Game.log('Club denied transfer request'); alert('Club denied your request right now. Perform well and ask again.'); }
      }
      Game.save(); renderAll(); openMarket();
    }, 'btn primary');
    list.append(action);
  } else {
    info.textContent = 'You are a free agent. Choose a club to sign for.';
    if(!st.lastOffers.length) st.lastOffers = rollMarketOffers(st.player);
  }
  if(st.lastOffers.length){
    st.lastOffers.forEach((o,i)=>{
      const row=document.createElement('div'); row.className='glass';
      row.innerHTML=`<div class="flex-between" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <div style="font-weight:800;font-size:16px">${o.club} <span class="pill" style="margin-left:6px">${o.league}</span></div>
          <div class="muted" style="margin-top:4px;display:flex;gap:8px;flex-wrap:wrap">
            <span class="pill">${o.years} season${o.years>1?'s':''}</span>
            <span class="pill">${o.status}</span>
            <span class="pill">${o.timeBand}</span>
            <span class="pill">${Game.money(o.salary)}/week</span>
            <span class="pill">value ${fmtValue(o.value)}</span>
          </div>
        </div>
        <div class="row"><button class="btn" data-i="${i}">Accept</button></div>`;
      row.querySelector('button').onclick=()=>acceptOffer(i);
      list.append(row);
    });
  } else if(st.player.club==='Free Agent'){
    empty.classList.remove('hidden');
  }
  q('#market-modal').setAttribute('open','');
}
function acceptOffer(i){
  const o=Game.state.lastOffers[i]; const st=Game.state;
  st.player.club=o.club; st.player.league=o.league; st.player.status=o.status; st.player.timeBand=o.timeBand;
  st.player.salary=Math.round(o.salary); st.player.value=Math.round(o.value);
  st.player.yearsLeft=o.years; st.player.transferListed=false; st.lastOffers=[];
  ensureNoSelfMatches(o.club);
  Game.log(`Signed for ${o.club}, ${o.years}y, ${o.status}, ${o.timeBand}, ${Game.money(o.salary)}/w`);
  Game.save(); renderAll(); q('#market-modal').removeAttribute('open');
}

// ===== Matchday =====
function decideStarting(tb){ const map={'second bench':0.02,'bench':0.10,'rotater':0.35,'match player':0.72,'match starter':0.92}; return Math.random()<(map[tb]||0.2); }
function subChance(tb){ const map={'second bench':0.20,'bench':0.35,'rotater':0.50,'match player':0.35,'match starter':0.10}; return map[tb]||0.3; }

function openMatch(entry){
  const st=Game.state; if(entry.played){ viewMatchSummary(entry); return; }
  if(!sameDay(entry.date, st.currentDate)) return; // only today

  const youStart = st.player.alwaysPlay ? true : decideStarting(st.player.timeBand);
  const willSubIn = youStart?false:Math.random()<subChance(st.player.timeBand);

  const baseTeamRating=+(randNorm(6.8,.4).toFixed(1));
  const ballPoss=Math.max(35,Math.min(65,Math.round(randNorm(50,8))));
  const teamPasses=Math.round(randNorm(480,90));
  const opponentPasses=Math.max(180, Math.round(teamPasses*(100-ballPoss)/ballPoss));
  const c=q('#match-content'); c.innerHTML='';
  const wrap=document.createElement('div');
  wrap.innerHTML=`<div class="title">${st.player.club} vs ${entry.opponent}</div>
    <div class="muted" style="margin-bottom:12px">Kickoff: ${new Date(entry.date).toDateString()}</div>
    <div class="glass" style="margin-bottom:12px">
      <div class="row" style="flex-wrap:wrap;gap:10px">
        <span class="pill">Team rating ~ ${baseTeamRating}</span>
        <span class="pill">Possession ${ballPoss}%</span>
        <span class="pill">Passes ${teamPasses}</span>
        <span class="pill">Opp passes ${opponentPasses}</span>
      </div>
    </div>
    <div id="match-phase"></div>`;
  c.append(wrap);
  const phase=q('#match-phase');

  const startMini=(minutesPlanned)=>requestAnimationFrame(()=>phase.append(minigameView('Make an impact in this moment!', res=>finishMatch(entry, minutesPlanned, res))));
  if(youStart){ startMini(90); }
  else if(willSubIn){
    const info=document.createElement('div'); info.className='glass';
    info.innerHTML='<div class="h">Update</div><div>You start on the bench. Stay ready.</div>';
    phase.append(info);
    setTimeout(()=>{ info.innerHTML='<div class="h">Substitution</div><div>You are coming on. Make it count.</div>'; startMini(randInt(12,28)); }, 500);
  } else {
    const info=document.createElement('div'); info.className='glass';
    info.innerHTML='<div class="h">Update</div><div>You stayed on the bench. Keep working.</div>';
    phase.append(info);
    setTimeout(()=>finishMatch(entry, 0, {clicks:0,success:false,score:0}), 500);
  }
  q('#match-modal').setAttribute('open','');
}

function openTraining(){
  const st=Game.state;
  const todayEntry = st.schedule.find(d=>sameDay(d.date, st.currentDate));
  const injured = st.player.status && st.player.status.toLowerCase().includes('injur');
  if(todayEntry && todayEntry.isMatch){ alert('Match scheduled today. Focus on the game.'); return; }
  if(injured){ alert('You are injured and cannot train.'); return; }
  const c=q('#training-content'); if(c) c.innerHTML='';
  const box=document.createElement('div');
  box.innerHTML='<div class="title">Training session</div>';
  const mini=minigameView('Finish the drill to improve!', res=>finishTraining(res));
  box.append(mini);
  c.append(box);
  q('#training-modal').setAttribute('open','');
}

function finishTraining(mini){
  const st=Game.state;
  const gain=+(mini.score*0.5).toFixed(2);
  st.player.overall=Math.min(100, +(st.player.overall+gain).toFixed(2));
  Game.log(`Training session: overall +${gain.toFixed(2)}`);
  const notes=q('#notes'); if(notes) notes.textContent=`Trained today. Overall +${gain.toFixed(2)}.`;
  Game.save();
  renderAll();
  setTimeout(()=>{ q('#training-modal').removeAttribute('open'); }, 600);
}

function minigameView(title, onDone){
  const box=document.createElement('div'); box.className='glass';
  box.innerHTML=`<div class="h">Moment</div><div style="margin-bottom:8px">${title}</div>`;
  const field=document.createElement('div'); field.className='minigame'; box.append(field);
  const target=10; let clicked=0; let over=false; const start=performance.now(); const duration=5000;
  function spawn(){ for(let i=0;i<target;i++){ const b=document.createElement('div'); b.className='bubble'; b.textContent=i+1; field.append(b); placeBubble(b, field); b.onclick=()=>{ if(over) return; b.remove(); clicked++; if(clicked>=target) finish(true); }; } }
  setTimeout(spawn, 0); // ensure layout ready
  const reshuff=setInterval(()=>{ field.querySelectorAll('.bubble').forEach(b=>placeBubble(b, field)); }, 900);
  const timer=setTimeout(()=>finish(false), duration);
  function finish(win){ if(over) return; over=true; clearTimeout(timer); clearInterval(reshuff);
    const t=performance.now()-start; const success=win;
    const score=Math.max(0, Math.min(1, clicked/target))*(success?1:0.5)*(1-((t/duration)-0.5)*0.3);
    const data={clicks:clicked,success,score};
    const note=document.createElement('div'); note.className='glass'; note.style.marginTop='10px';
    note.innerHTML=`<div class="h">Result</div><div>Clicks ${clicked}/${target}. ${success?'Nice impact.':'Could be better.'}</div>`;
    box.append(note);
    setTimeout(()=>onDone(data), 500);
  }
  return box;
}
function placeBubble(el, field){ const w=field.clientWidth||300; const h=field.clientHeight||220; const x=Math.random()*(w-34); const y=Math.random()*(h-34); el.style.left=x+'px'; el.style.top=y+'px'; }

function finishMatch(entry, minutes, mini){
  const st=Game.state; const hasMinutes=minutes>0; let rating=null;
  if(hasMinutes){ rating=randNorm(6.4,.6); if(minutes>=60) rating+=.3; rating+=(mini.score||0)*2.0; rating=Math.max(5.0, Math.min(9.8, +rating.toFixed(1))); }
  else { rating=6.0; }
  let goals=0,assists=0; if(hasMinutes){
    const baseG=st.player.pos==='Attacker'?0.22: st.player.pos==='Midfield'?0.10: 0.06;
    const baseA=st.player.pos==='Attacker'?0.10: st.player.pos==='Midfield'?0.18: 0.08;
    const perfBoost=Math.max(0,(rating-6.5)*0.15);
    goals = Math.random()<baseG+perfBoost ? (Math.random()<0.12?2:1) : 0;
    assists = Math.random()<baseA+perfBoost ? 1 : 0;
  }
  // Team scoreline
  const teamBase=Math.max(0, Math.round(randNorm(1.4,1.0)));
  const oppBase =Math.max(0, Math.round(randNorm(1.2,1.0)));
  const teamGoals=teamBase+(goals>0?1:0);
  const oppGoals =oppBase;
  const result=teamGoals>oppGoals?'W': teamGoals<oppGoals?'L':'D';
  const scoreline=`${teamGoals}-${oppGoals}`;

  // Commit outcome
  entry.played=true; entry.result=result; entry.scoreline=scoreline; Game.state.playedMatchDates.push(entry.date);
  st.minutesPlayed+=minutes; st.goals+=goals; st.assists+=assists;
  st.seasonMinutes+=minutes; st.seasonGoals+=goals; st.seasonAssists+=assists;
  applyPostMatchGrowth(st, minutes, rating, goals, assists);
  st.player.value = Math.round(computeValue(st.player.overall, st.player.league||'Premier League', st.player.salary||1000));
  if(st.player.salary>0) st.player.balance = Math.round((st.player.balance||0)+st.player.salary);
  st.week = Math.min(38, st.week+1);
  Game.log(`Match vs ${entry.opponent}: ${result} ${scoreline}, min ${minutes}, rat ${rating}${goals?`, G${goals}`:''}${assists?`, A${assists}`:''}`);

  // Move day and show summary
  setTimeout(()=>{ nextDay(); }, 300);
  const c=q('#match-content'); const box=document.createElement('div'); box.className='glass';
  box.innerHTML = `<div class="h">Full time</div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      <div class="kv"><div class="k">Minutes</div><div class="v">${minutes}</div></div>
      <div class="kv"><div class="k">Rating</div><div class="v">${rating?.toFixed?rating.toFixed(1):rating}</div></div>
      <div class="kv"><div class="k">Goals</div><div class="v">${goals}</div></div>
      <div class="kv"><div class="k">Assists</div><div class="v">${assists}</div></div>
      <div class="kv"><div class="k">New overall</div><div class="v">${st.player.overall}</div></div>
    </div>`;
  c.append(box);
  Game.save(); renderAll();
}

function simulateMatch(entry){
  const st=Game.state;
  if(entry.played || !sameDay(entry.date, st.currentDate)) return;
  const youStart = st.player.alwaysPlay ? true : decideStarting(st.player.timeBand);
  const willSubIn = youStart?false:Math.random()<subChance(st.player.timeBand);
  let minutes=0;
  if(youStart) minutes=90;
  else if(willSubIn) minutes=randInt(12,28);
  const mini={score:Math.random()};
  const hasMinutes=minutes>0; let rating=null;
  if(hasMinutes){ rating=randNorm(6.4,.6); if(minutes>=60) rating+=.3; rating+=(mini.score||0)*2.0; rating=Math.max(5.0, Math.min(9.8, +rating.toFixed(1))); }
  else { rating=6.0; }
  let goals=0,assists=0; if(hasMinutes){
    const baseG=st.player.pos==='Attacker'?0.22: st.player.pos==='Midfield'?0.10: 0.06;
    const baseA=st.player.pos==='Attacker'?0.10: st.player.pos==='Midfield'?0.18: 0.08;
    const perfBoost=Math.max(0,(rating-6.5)*0.15);
    goals = Math.random()<baseG+perfBoost ? (Math.random()<0.12?2:1) : 0;
    assists = Math.random()<baseA+perfBoost ? 1 : 0;
  }
  const teamBase=Math.max(0, Math.round(randNorm(1.4,1.0)));
  const oppBase=Math.max(0, Math.round(randNorm(1.2,1.0)));
  const teamGoals=teamBase+(goals>0?1:0);
  const oppGoals=oppBase;
  const result=teamGoals>oppGoals?'W': teamGoals<oppGoals?'L':'D';
  const scoreline=`${teamGoals}-${oppGoals}`;
    entry.played=true; entry.result=result; entry.scoreline=scoreline; Game.state.playedMatchDates.push(entry.date);
    st.minutesPlayed+=minutes; st.goals+=goals; st.assists+=assists;
    st.seasonMinutes+=minutes; st.seasonGoals+=goals; st.seasonAssists+=assists;
    applyPostMatchGrowth(st, minutes, rating, goals, assists);
  st.player.value=Math.round(computeValue(st.player.overall, st.player.league||'Premier League', st.player.salary||1000));
  if(st.player.salary>0) st.player.balance=Math.round((st.player.balance||0)+st.player.salary);
  st.week=Math.min(38, st.week+1);
  Game.log(`Match vs ${entry.opponent}: ${result} ${scoreline}, min ${minutes}, rat ${rating}${goals?`, G${goals}`:''}${assists?`, A${assists}`:''}`);
  Game.save(); renderAll();
  setTimeout(()=>{ nextDay(); },300);
}

function viewMatchSummary(entry){
  const st=Game.state; const c=q('#match-content'); c.innerHTML='';
  const box=document.createElement('div'); box.className='glass';
  box.innerHTML=`<div class="h">Match summary</div>
    <div>${st.player.club} ${entry.scoreline?entry.scoreline:''} ${entry.opponent}</div>
    <div class="muted">${new Date(entry.date).toDateString()}</div>
    ${entry.played?`<div style="margin-top:8px">Result: ${entry.result}</div>`:''}`;
  c.append(box); q('#match-modal').setAttribute('open','');
}

// ===== Season end summary & rollover =====
function openSeasonEnd(){
  const st=Game.state;
  // crude league position with bias: higher overall -> better finish
  const bias = Math.max(0, 100 - st.player.overall);
  const pos = Math.max(1, Math.min(20, Math.round(randNorm(10 + bias*0.05, 4))));
  const won = pos===1;
  if(won){ st.player.goldenClub=true; Game.log('🏆 League won! Club marked gold.'); }
  else { st.player.goldenClub=false; }

  // contract years decrement at season end
  if(st.player.yearsLeft>0){
    st.player.yearsLeft -= 1;
    if(st.player.yearsLeft<=0){
      st.player.yearsLeft=0; st.player.club='Free Agent'; st.player.league=''; st.player.status='—'; st.player.timeBand='—'; st.player.salary=0;
      Game.log('Contract ended. You are a Free Agent.');
    }
  }

  const c=q('#match-content'); c.innerHTML='';
  const box=document.createElement('div'); box.className='glass';
  box.innerHTML = `<div class="h">Season ${st.season} summary</div>
    <div>League position: ${pos}/20 ${won?' – <span class="badge">CHAMPIONS</span>':''}</div>
    <div class="muted" style="margin-top:8px">Season: ${st.seasonMinutes} min, G ${st.seasonGoals}, A ${st.seasonAssists}</div>
    <div class="muted" style="margin-top:4px">Career: ${st.minutesPlayed} min, G ${st.goals}, A ${st.assists}</div>
    <div style="margin-top:10px"><button class="btn primary" id="btn-next-season">Start next season</button></div>`;
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
    alert(msg);
    Game.log(`Manager: ${msg}`);
    st.season += 1; st.week = 1;
    st.player.age += 1;
    const baseYear = new Date(new Date(st.schedule[0].date).getFullYear()+1,7,31).getFullYear();
    const first = randomWedToSatOfWeek(lastSaturdayOfAugust(baseYear));
    st.schedule = buildSchedule(first, 38, st.player.club);
    st.currentDate = st.schedule[0].date; // on season start marker
    st.seasonMinutes=0; st.seasonGoals=0; st.seasonAssists=0;
    Game.log(`Season ${st.season} begins. Age ${st.player.age}. Contract ${st.player.yearsLeft} season${st.player.yearsLeft!==1?'s':''} left.`);
    Game.state.auto=false; updateAutoBtn();
    Game.save(); renderAll();
  };
}

// ===== Time controls =====
function updateAutoBtn(){ const b=q('#btn-auto'); if(!b) return; b.textContent = `Auto advance: ${Game.state.auto? 'On':'Off'}`; }
function toggleAuto(){ Game.state.auto=!Game.state.auto; Game.save(); updateAutoBtn(); if(Game.state.auto) autoTick(); }
function autoTick(){
  if(!Game.state.auto) return;
  const entry = Game.state.schedule.find(d=>sameDay(d.date, Game.state.currentDate));
  if(entry && entry.type==='seasonEnd'){ Game.state.auto=false; updateAutoBtn(); return; }
  setTimeout(()=>{ if(Game.state.auto){ nextDay(); } }, 800+Math.floor(Math.random()*600));
}
function nextDay(){
  const st=Game.state;
  const entry=st.schedule.find(d=>sameDay(d.date, st.currentDate));
  if(entry && entry.isMatch && !entry.played){ simulateMatch(entry); return; }
  if(entry && entry.type==='seasonEnd'){ Game.state.auto=false; updateAutoBtn(); openSeasonEnd(); return; }
  st.currentDate+=24*3600*1000; Game.save(); renderAll(); autoTick();
}

// ===== Download / Retire =====
function downloadLog(){ const st=Game.state; const text=(st.eventLog||[]).join('\n'); const blob=new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='webcareergame-log.txt'; a.click(); URL.revokeObjectURL(url); }
function retirePrompt(){ const st=Game.state; const c=q('#retire-content'); c.innerHTML=''; const box=document.createElement('div'); box.className='glass';
  box.innerHTML=`<div class="h">Career summary</div>
    <div class="kv">
      <div class="k">Name</div><div class="v">${st.player.name}</div>
      <div class="k">Overall</div><div class="v">${st.player.overall}</div>
      <div class="k">Club</div><div class="v">${st.player.club}</div>
      <div class="k">Minutes</div><div class="v">${st.minutesPlayed}</div>
      <div class="k">Goals</div><div class="v">${st.goals}</div>
      <div class="k">Assists</div><div class="v">${st.assists}</div>
      <div class="k">Balance</div><div class="v">${Game.money(st.player.balance||0)}</div>
    </div>`;
  c.append(box); q('#retire-modal').setAttribute('open','');
}

// ===== Events / Boot =====
function wireEvents(){
  const form = document.getElementById('setup-form');
  if(form){
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name=q('#name').value||'Player';
      const age=q('#age').value||16;
      const origin=q('#origin').value;
      const pos=[...document.querySelectorAll('input[name=pos]')].find(x=>x.checked)?.value||'Attacker';
      const alwaysPlay=q('#always-play').checked;
      Game.newGame({name,age,origin,pos,alwaysPlay});
      renderAll();
      openMarket();
    });
  }
  const click = (id, fn)=>{ const el=q(id); if(el) el.onclick=fn; };
  click('#btn-market', ()=>openMarket());
  click('#close-market', ()=>q('#market-modal').removeAttribute('open'));
  click('#btn-next', ()=>nextDay());
  click('#btn-auto', ()=>toggleAuto());
  click('#btn-train', ()=>openTraining());
  click('#close-training', ()=>q('#training-modal').removeAttribute('open'));
  click('#btn-save', ()=>{ Game.save(); alert('Saved'); });
  click('#btn-reset', ()=>{ if(confirm('Delete your local save and restart')) Game.reset(); });
  click('#btn-retire', ()=>retirePrompt());
  click('#retire-cancel', ()=>q('#retire-modal').removeAttribute('open'));
  click('#retire-confirm', ()=>{ q('#retire-modal').removeAttribute('open'); Game.reset(); });
  click('#btn-log', ()=>downloadLog());
  click('#close-match', ()=>q('#match-modal').removeAttribute('open'));
}

(function boot(){
  wireEvents();
  injectVersion();
  if(!Game.load()){
    console.warn('Failed to load save state; starting fresh');
  }
  renderAll();
})();
