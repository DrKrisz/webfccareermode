/* Goalkeeper specific logic and minigames */

// Contract tiers for reference in UI or future logic
const GK_CONTRACT_LEVELS = [
  {level:'Backup keeper', wage:'\u00a31k–5k/w', contract:'1–2 years', value:'\u00a30.1M–2M'},
  {level:'Reserve keeper', wage:'\u00a310k–25k/w', contract:'2–3 years', value:'\u00a32M–10M'},
  {level:'First-choice', wage:'\u00a340k–80k/w', contract:'3–4 years', value:'\u00a310M–40M'},
  {level:'World-class', wage:'\u00a3100k–250k+/w', contract:'5–6 years', value:'\u00a350M–80M+'},
];

// ===== Goalkeeper training minigame =====
function goalkeeperTrainingView(onDone){
  const box=document.createElement('div'); box.className='glass';
  box.innerHTML='<div class="h">Goalkeeper drill</div>';
  const field=document.createElement('div'); field.className='minigame'; box.append(field);

  let correct=0, round=0; const rounds=5; const timers=[];

  function guessPhase(){
    field.className='minigame gk-guess';
    field.innerHTML='';
    const target=Math.random()<0.5?'left':'right';
    const left=document.createElement('button'); left.textContent='\u2B05\uFE0F';
    const right=document.createElement('button'); right.textContent='\u27A1\uFE0F';
    field.append(left,right);
    let picked=false;
    function choose(side){
      if(picked) return; picked=true;
      if(side===target) correct++;
      round++;
      timers.push(setTimeout(()=>{ round<rounds?guessPhase():pushPhase(); },300));
    }
    left.onclick=()=>choose('left');
    right.onclick=()=>choose('right');
    timers.push(setTimeout(()=>choose('none'),5000));
  }

  function pushPhase(){
    field.className='minigame';
    field.innerHTML='';
    let clicks=0;
    const clicker=()=>{ clicks++; };
    field.onclick=clicker;
    timers.push(setTimeout(()=>{
      field.onclick=null;
      const score=(correct/rounds*0.5)+(Math.min(clicks,50)/50)*0.5;
      onDone({guesses:correct, clicks, success:clicks>0, score});
    },5000));
  }

  guessPhase();
  return {el:box, cancel:()=>{ timers.forEach(t=>clearTimeout(t)); field.onclick=null; }};
}

// ===== Goalkeeper match minigame =====
function goalkeeperMatchMinigameView(title,onDone){
  const box=document.createElement('div'); box.className='glass';
  box.innerHTML=`<div class="h">Moment</div><div style="margin-bottom:8px">${title}</div>`;
  const field=document.createElement('div'); field.className='minigame'; box.append(field);

  let total=10, success=0, current=0; const timers=[];

  function spawn(){
    if(current>=total){ finish(); return; }
    current++;
    const b=document.createElement('div'); b.className='bubble'; b.textContent=current;
    placeBubble(b, field); field.append(b);
    const time=Math.max(300,1000-current*60);
    const timer=setTimeout(()=>{ b.remove(); spawn(); }, time);
    timers.push(timer);
    b.onclick=()=>{ success++; clearTimeout(timer); spawnNext(); };
    function spawnNext(){ b.remove(); spawn(); }
  }

  function finish(){
    const score=success/total;
    const note=document.createElement('div'); note.className='glass'; note.style.marginTop='10px';
    note.innerHTML=`<div class="h">Result</div><div>Saved ${success}/${total}</div>`;
    box.append(note);
    timers.push(setTimeout(()=>onDone({clicks:success,success:success===total,score}),500));
  }

  spawn();
  return {el:box, cancel:()=>{ timers.forEach(t=>clearTimeout(t)); field.innerHTML=''; }};
}

