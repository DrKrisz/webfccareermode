// ===== Matchday =====
function decideStarting(tb){ const map={'second bench':0.02,'bench':0.10,'rotater':0.35,'match player':0.72,'match starter':0.92}; return Math.random()<(map[tb]||0.2); }
function subChance(tb){ const map={'second bench':0.20,'bench':0.35,'rotater':0.50,'match player':0.35,'match starter':0.10}; return map[tb]||0.3; }

function countdown(target, cb){
  let s=3;
  const label=document.createElement('div');
  label.className='countdown';
  target.append(label);
  let timer=null; let cancelled=false;
  const step=()=>{
    if(cancelled) return;
    if(s>0){ label.textContent=s--; timer=setTimeout(step,1000); }
    else { label.remove(); if(!cancelled) cb(); }
  };
  step();
  return ()=>{ cancelled=true; if(timer) clearTimeout(timer); label.remove(); };
}

let trainingSession=null;

function openMatch(entry){
  clearAutoTick();
  const st=Game.state; if(entry.played){ viewMatchSummary(entry); return; }
  if(st.player.club==='Free Agent'){ showPopup('Match', 'You need a club to play matches.'); return; }
  if(!sameDay(entry.date, st.currentDate)) return; // only today

  if(st.player.injury){
    showPopup('Match', `You are injured and miss the game.`);
    finishMatch(entry, 0, {clicks:0,success:false,score:0});
    return;
  }

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

  const startMini=(minutesPlanned)=>countdown(phase, ()=>requestAnimationFrame(()=>{
    const view = st.player.pos==='Goalkeeper'
      ? goalkeeperMatchMinigameView('Keep the sheet clean!', res=>finishMatch(entry, minutesPlanned, res))
      : minigameView('Make an impact in this moment!', res=>finishMatch(entry, minutesPlanned, res));
    phase.append(view.el);
  }));
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
   clearAutoTick();
   const st=Game.state;
   const todayEntry = st.schedule.find(d=>sameDay(d.date, st.currentDate));
   const injured = !!st.player.injury;
  const daysSince = st.lastTrainingDate ? (st.currentDate - st.lastTrainingDate)/(24*3600*1000) : Infinity;
  if(todayEntry && todayEntry.isMatch){ showPopup('Training', 'Match scheduled today. Focus on the game.'); return; }
  if(todayEntry && todayEntry.type==='training'){ showPopup('Training', 'Team session already scheduled today.'); return; }
  if(injured){ showPopup('Training', 'You are injured and cannot train.'); return; }
   if(daysSince < 1){
     console.log('Tried to train twice today. Come back tomorrow.');
     Game.log('Tried to train twice today. Come back tomorrow.');
     Game.save();
     renderAll();
     showPopup('Training', 'You have trained today, come back tomorrow.');
     return;
   }
   if(daysSince < 2 && st.player.pos!=='Goalkeeper'){
     const rest = Math.ceil(2-daysSince);
     const msg=`Tried to train but need to rest ${rest} day${rest>1?'s':''} before training again.`;
     Game.log(msg);
     Game.save();
     renderAll();
     showCooldownPopup(rest);
     return;
   }
   const c=q('#training-content'); if(c) c.innerHTML='';
   const box=document.createElement('div');
   box.innerHTML='<div class="title">Training session</div>';
   const phase=document.createElement('div'); box.append(phase);
   c.append(box);
   q('#training-modal').setAttribute('open','');
   trainingSession={cancelled:false, skills:[], trainAll:false};

   const beginDrill=()=>{
     if(trainingSession && trainingSession.cancelled) return;
     const mini = st.player.pos==='Goalkeeper'
       ? goalkeeperTrainingView(res=>{
           if(trainingSession && trainingSession.cancelled) return;
           finishTraining(res);
           trainingSession=null;
         })
       : minigameView('Finish the drill to improve!', res=>{
           if(trainingSession && trainingSession.cancelled) return;
           finishTraining(res);
           trainingSession=null;
         });
     phase.append(mini.el);
     trainingSession.miniCancel=mini.cancel;
   };

   const pickSkills=(skills,all=false)=>{
     if(trainingSession && trainingSession.cancelled) return;
     trainingSession.skills=skills;
     trainingSession.trainAll=all;
     phase.innerHTML='';
     if(st.player.pos==='Goalkeeper'){
       const info=document.createElement('div');
       info.className='glass';
       info.innerHTML='<div class="h">How to play</div><div>Guess the side of the shot then tap quickly to parry it away.</div>';
       phase.append(info);
       const readyBtn=btn('Ready', ()=>{
         phase.innerHTML='';
         const cancelCd=countdown(phase, beginDrill);
         trainingSession.countCancel=cancelCd;
       });
       phase.append(readyBtn);
     } else {
       const cancelCd=countdown(phase, beginDrill);
       trainingSession.countCancel=cancelCd;
     }
   };

   const skillKeys = Object.keys(st.player.skills||{});
   if(skillKeys.length===0){
     // No detailed skills, fall back to default behaviour
     pickSkills([], false);
     return;
   }

   const infoSel=document.createElement('div');
   infoSel.className='glass';
   infoSel.innerHTML='<div class="h">Select training focus</div>';
   const row=document.createElement('div');
   row.className='row';
   row.style.flexWrap='wrap';
   row.style.gap='8px';
   const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
   skillKeys.forEach(sk=>{
     row.append(btn(cap(sk), ()=>pickSkills([sk])));
   });
   row.append(btn('All skills', ()=>pickSkills(relevantSkills(st.player.pos), true)));
   infoSel.append(row);
   phase.append(infoSel);
 }

function finishTraining(mini){
  const st=Game.state;
  // Always award a full point per training session.
  const gain=1;
  const pre = st.player.overall;
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);

  if(st.player.skills){
    const chosen = (trainingSession && trainingSession.skills && trainingSession.skills.length)
      ? trainingSession.skills
      : relevantSkills(st.player.pos);
    // Split the single point across all selected skills when training multiple.
    const per = chosen.length>1 ? +(gain/Math.max(1,chosen.length)).toFixed(2) : gain;
    const display = chosen.map(cap);
    chosen.forEach(k=>{
      st.player.skills[k]=Math.min(100, +(st.player.skills[k]+per).toFixed(2));
    });
    st.player.overall=computeOverallFromSkills(st.player.skills);
    const overallDelta = st.player.overall - pre;
    const notes=q('#notes');
    if(notes){
      if(chosen.length>1) notes.textContent=`Trained all skills. +${per.toFixed(2)} each.`;
      else notes.textContent=`Trained ${display[0]}. +${per.toFixed(2)}.`;
    }
    let logMsg = chosen.length>1
      ? `Training: +${per.toFixed(2)} each to ${display.join(', ')}`
      : `Training: ${display[0]} +${per.toFixed(2)}`;
    if(overallDelta>0) logMsg += ` (overall +${overallDelta.toFixed(2)})`;
    Game.log(logMsg);
    st.lastTrainingDate = st.currentDate;
    const injury = maybeInjure('training');
    Game.save();
    renderAll();
    setTimeout(()=>{
      q('#training-modal').removeAttribute('open');
      const skillMsg = chosen.length>1
        ? `+${per.toFixed(2)} each to ${display.join(', ')}`
        : `${display[0]} +${per.toFixed(2)}`;
      const motivational = mini.score>=0.95 ? pick(['Perfect session!','Outstanding work!'])
        : mini.score>=0.75 ? pick(['Great effort!','Nice job!'])
        : mini.score>=0.5 ? pick(['Solid session.','Keep working!'])
        : pick(['Tough session, but keep pushing!','Every rep counts.']);
      const summary = overallDelta>0
        ? `Overall +${overallDelta.toFixed(2)} (now ${st.player.overall.toFixed(2)})`
        : `Overall ${st.player.overall.toFixed(2)}`;
      showPopup('Training complete', `${skillMsg}. ${summary}. ${motivational}`);
      if(injury) setTimeout(()=>showPopup('Injury', `You suffered a ${injury.type} and will be out for ${injury.days} days.`), 600);
    }, 600);
  } else {
    // Fallback for legacy saves without skills
    st.player.overall=Math.min(100, +(st.player.overall+gain).toFixed(2));
    const delta=st.player.overall - pre;
    Game.log(`Training session: overall +${delta.toFixed(2)}`);
    const notes=q('#notes'); if(notes) notes.textContent=`Trained today. Overall +${delta.toFixed(2)}.`;
    st.lastTrainingDate = st.currentDate;
    const injury = maybeInjure('training');
    Game.save();
    renderAll();
    setTimeout(()=>{
      q('#training-modal').removeAttribute('open');
      showPopup('Training complete', `Overall +${delta.toFixed(2)} (now ${st.player.overall.toFixed(2)})`);
      if(injury) setTimeout(()=>showPopup('Injury', `You suffered a ${injury.type} and will be out for ${injury.days} days.`), 600);
    }, 600);
  }
}

function simulateTraining(){
  const st=Game.state;
  if(st.player.injury){
    Game.log('Skipped training due to injury.');
    showPopup('Training', 'You are injured and cannot train.');
    return;
  }
  const gain=1; const pre=st.player.overall;
  const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  if(st.player.skills){
    const chosen=relevantSkills(st.player.pos);
    const per=+(gain/Math.max(1,chosen.length)).toFixed(2);
    chosen.forEach(k=>{ st.player.skills[k]=Math.min(100, +(st.player.skills[k]+per).toFixed(2)); });
    st.player.overall=computeOverallFromSkills(st.player.skills);
    const overallDelta=st.player.overall-pre;
    Game.log(`Team training: +${per.toFixed(2)} each to ${chosen.map(cap).join(', ')}${overallDelta>0?` (overall +${overallDelta.toFixed(2)})`:''}`);
  } else {
    st.player.overall=Math.min(100, +(st.player.overall+gain).toFixed(2));
    const delta=st.player.overall-pre;
    Game.log(`Team training: overall +${delta.toFixed(2)}`);
  }
  st.lastTrainingDate=st.currentDate;
  const injury=maybeInjure('training');
  Game.save(); renderAll();
  if(injury) showPopup('Injury', `You suffered a ${injury.type} and will be out for ${injury.days} days.`);
  else showPopup('Training day', `Team session complete. Overall ${st.player.overall.toFixed(2)}`);
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
  return {el:box, cancel:()=>{ over=true; clearTimeout(timer); clearInterval(reshuff); box.remove(); }};
}

function cancelTraining(){
  if(trainingSession){
    trainingSession.cancelled=true;
    if(trainingSession.countCancel) trainingSession.countCancel();
    if(trainingSession.miniCancel) trainingSession.miniCancel();
    trainingSession=null;
  }
  q('#training-modal').removeAttribute('open');
}
function placeBubble(el, field){ const w=field.clientWidth||300; const h=field.clientHeight||220; const x=Math.random()*(w-34); const y=Math.random()*(h-34); el.style.left=x+'px'; el.style.top=y+'px'; }

function maybeInjure(source, minutes=0){
  const st=Game.state;
  if(!st.player || st.player.injury) return null;
  let chance=0;
  if(source==='training') chance=0.05;
  else if(source==='match' && minutes>0) chance=0.08;
  if(Math.random()>=chance) return null;
  const roll=Math.random();
  let type,days;
  if(roll<0.6){ type='knock'; days=randInt(2,5); }
  else if(roll<0.9){ type='sprain'; days=randInt(7,21); }
  else { type='fracture'; days=randInt(30,90); }
  st.player.injury={type, days};
  st.player.preInjuryStatus=st.player.status;
  st.player.status=`Injured (${type}, ${days}d)`;
  Game.log(`Injury: ${type}, out ${days} days`);
  return {type,days};
}

function payWeekly(st){
  if(st.player.club==='Free Agent') return;
  const gain=weeklySalary(st.player)+(st.player.passiveIncome||0);
  if(gain>0){
    st.player.balance=Math.round((st.player.balance||0)+gain);
    Game.log(`Payday: +${Game.money(gain)}`);
  }
}

function finishMatch(entry, minutes, mini){
  const st=Game.state; const hasMinutes=minutes>0; let rating=null;
  if(hasMinutes){ rating=randNorm(6.4,.6); if(minutes>=60) rating+=.3; rating+=(mini.score||0)*2.0; rating=Math.max(5.0, Math.min(9.8, +rating.toFixed(1))); }
  let goals=0,assists=0; if(hasMinutes){
    const baseG=st.player.pos==='Attacker'?0.22: st.player.pos==='Midfield'?0.10: st.player.pos==='Defender'?0.06:0;
    const baseA=st.player.pos==='Attacker'?0.10: st.player.pos==='Midfield'?0.18: st.player.pos==='Defender'?0.08:0;
    const perfBoost=Math.max(0,(rating-6.5)*0.15);
    goals = Math.random()<baseG+perfBoost ? (Math.random()<0.12?2:1) : 0;
    assists = Math.random()<baseA+perfBoost ? 1 : 0;
  }
  // Team scoreline
  const myLvl=getTeamLevel(st.player.club);
  const oppLvl=getTeamLevel(entry.opponent);
  let diff=(myLvl-oppLvl)/20; // level difference biases score
  if(myLvl<75) diff+=(75-myLvl)/50; // boost low level teams
  let teamGoals=Math.max(0, Math.round(randNorm(1.4+diff,1.0)));
  let oppGoals =Math.max(0, Math.round(randNorm(1.2-diff,1.0)));
  goals = Math.min(goals, teamGoals);
  assists = Math.min(assists, Math.max(0, teamGoals-goals));
  if(teamGoals===0 && oppGoals===0){ goals=0; assists=0; }
  if(minutes===0){ rating='DNP'; goals=0; assists=0; }
  const result=teamGoals>oppGoals?'W': teamGoals<oppGoals?'L':'D';
  const scoreline=`${teamGoals}-${oppGoals}`;

  // Commit outcome
  entry.played=true; entry.result=result; entry.scoreline=scoreline; Game.state.playedMatchDates.push(entry.date);
  const cleanSheet = st.player.pos==='Goalkeeper' && oppGoals===0 ? 1 : 0;
    st.minutesPlayed+=minutes; st.goals+=goals; st.assists+=assists; if(st.player.pos==='Goalkeeper') st.cleanSheets+=cleanSheet;
    st.seasonMinutes+=minutes; st.seasonGoals+=goals; st.seasonAssists+=assists; if(st.player.pos==='Goalkeeper') st.seasonCleanSheets+=cleanSheet;
    if(minutes>0){ st.matchesPlayed++; st.seasonMatches++; }
    applyPostMatchGrowth(st, minutes, rating, goals, assists, true, oppGoals);
  st.player.value = Math.round(computeValue(st.player.overall, st.player.league||'Premier League', st.player.salary||1000));
  payWeekly(st);
  st.week = Math.min(leagueWeeks(st.player.league||'Premier League'), st.week+1);
  const gaPart = rating==='DNP' ? '' : (st.player.pos==='Goalkeeper' ? `, CS${cleanSheet}` : `, G${goals}, A${assists}`);
  Game.log(`Match vs ${entry.opponent}: ${result} ${scoreline}, min ${minutes}, rat ${rating}${gaPart}`);
  if(entry.competition==='Carabao Cup'){
    if(entry.round==='Final' && result==='W'){
      Game.log('🏆 Carabao Cup won!');
      showPopup('Trophy', 'You won the Carabao Cup!');
    }
    if(result!=='W') eliminateCup('Carabao Cup');
  }
  const injury = maybeInjure('match', minutes);

  // Move day and show summary
  setTimeout(()=>{ nextDay(); }, 300);
  const c=q('#match-content'); const box=document.createElement('div'); box.className='glass';
  const stats=[
    `<div class="kv"><div class="k">Minutes</div><div class="v">${minutes}</div></div>`,
    `<div class="kv"><div class="k">Rating</div><div class="v">${rating && rating.toFixed ? rating.toFixed(1) : rating}</div></div>`,
  ];
  if(rating!=='DNP'){
    if(st.player.pos==='Goalkeeper'){
      stats.push(`<div class="kv"><div class="k">Clean sheet</div><div class="v">${cleanSheet}</div></div>`);
    } else {
      stats.push(`<div class="kv"><div class="k">Goals</div><div class="v">${goals}</div></div>`);
      stats.push(`<div class="kv"><div class="k">Assists</div><div class="v">${assists}</div></div>`);
    }
  }
  stats.push(`<div class="kv"><div class="k">New overall</div><div class="v">${st.player.overall}</div></div>`);
  box.innerHTML = `<div class="h">Full time</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">${stats.join('')}</div>`;
  c.append(box);
  Game.save(); renderAll();
  if(injury) showPopup('Injury', `You suffered a ${injury.type} and will be out for ${injury.days} days.`);
}

function simulateMatch(entry, fast=false){
  const st=Game.state;
  if(st.player.club==='Free Agent'){ showPopup('Match day', 'You need a club to play matches.'); return; }
  if(entry.played || !sameDay(entry.date, st.currentDate)) return;
  const injured = !!st.player.injury;
  const youStart = injured ? false : (st.player.alwaysPlay ? true : decideStarting(st.player.timeBand));
  const willSubIn = youStart?false:(injured?false:Math.random()<subChance(st.player.timeBand));
  let minutes=0;
  if(youStart) minutes=90;
  else if(willSubIn) minutes=randInt(12,28);
  const mini={score:Math.random()};
  const hasMinutes=minutes>0; let rating=null;
  if(hasMinutes){ rating=randNorm(6.4,.6); if(minutes>=60) rating+=.3; rating+=(mini.score||0)*2.0; rating=Math.max(5.0, Math.min(9.8, +rating.toFixed(1))); }
  let goals=0,assists=0; if(hasMinutes){
    const baseG=st.player.pos==='Attacker'?0.22: st.player.pos==='Midfield'?0.10: st.player.pos==='Defender'?0.06:0;
    const baseA=st.player.pos==='Attacker'?0.10: st.player.pos==='Midfield'?0.18: st.player.pos==='Defender'?0.08:0;
    const perfBoost=Math.max(0,(rating-6.5)*0.15);
    goals = Math.random()<baseG+perfBoost ? (Math.random()<0.12?2:1) : 0;
    assists = Math.random()<baseA+perfBoost ? 1 : 0;
  }
  const myLvl=getTeamLevel(st.player.club);
  const oppLvl=getTeamLevel(entry.opponent);
  let diff=(myLvl-oppLvl)/20;
  if(myLvl<75) diff+=(75-myLvl)/50;
  let teamGoals=Math.max(0, Math.round(randNorm(1.4+diff,1.0)));
  let oppGoals=Math.max(0, Math.round(randNorm(1.2-diff,1.0)));
  goals=Math.min(goals, teamGoals);
  assists=Math.min(assists, Math.max(0, teamGoals-goals));
  if(teamGoals===0 && oppGoals===0){ goals=0; assists=0; }
  if(minutes===0){ rating='DNP'; goals=0; assists=0; }
  const result=teamGoals>oppGoals?'W': teamGoals<oppGoals?'L':'D';
  const scoreline=`${teamGoals}-${oppGoals}`;
  entry.played=true; entry.result=result; entry.scoreline=scoreline; Game.state.playedMatchDates.push(entry.date);
  const cleanSheet = st.player.pos==='Goalkeeper' && oppGoals===0 ? 1 : 0;
    st.minutesPlayed+=minutes; st.goals+=goals; st.assists+=assists; if(st.player.pos==='Goalkeeper') st.cleanSheets+=cleanSheet;
    st.seasonMinutes+=minutes; st.seasonGoals+=goals; st.seasonAssists+=assists; if(st.player.pos==='Goalkeeper') st.seasonCleanSheets+=cleanSheet;
    if(minutes>0){ st.matchesPlayed++; st.seasonMatches++; }
    applyPostMatchGrowth(st, minutes, rating, goals, assists, false, oppGoals);
  st.player.value=Math.round(computeValue(st.player.overall, st.player.league||'Premier League', st.player.salary||1000));
  payWeekly(st);
  st.week=Math.min(leagueWeeks(st.player.league||'Premier League'), st.week+1);
  const gaPart = rating==='DNP' ? '' : (st.player.pos==='Goalkeeper' ? `, CS${cleanSheet}` : `, G${goals}, A${assists}`);
  Game.log(`Match vs ${entry.opponent}: ${result} ${scoreline}, min ${minutes}, rat ${rating}${gaPart}`);
  if(entry.competition==='Carabao Cup'){
    if(entry.round==='Final' && result==='W'){
      Game.log('🏆 Carabao Cup won!');
      showPopup('Trophy', 'You won the Carabao Cup!');
    }
    if(result!=='W') eliminateCup('Carabao Cup');
  }
  const injury = maybeInjure('match', minutes);
  Game.save(); renderAll();
  if(injury) showPopup('Injury', `You suffered a ${injury.type} and will be out for ${injury.days} days.`);
  if(fast){
    nextDay(undefined, true);
  } else {
    setTimeout(()=>{ nextDay(); },300);
  }
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

