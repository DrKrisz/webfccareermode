// ===== Contract rework =====
function statusRank(s){
  const map={'rookie':0,'decent':1,'key player':2,'important':3,'star player':4,
    'Backup keeper':0,'Reserve keeper':1,'First-choice':2,'World-class':3};
  return Object.prototype.hasOwnProperty.call(map, s) ? map[s] : 0;
}
function timeRank(t){ return ['second bench','bench','rotater','match player','match starter'].indexOf(t); }
function allowedStatuses(age,overall,current,pos){
  if(pos==='Goalkeeper'){
    const list=['Backup keeper','Reserve keeper','First-choice','World-class'];
    if(current && !list.includes(current)) list.push(current);
    return list;
  }
  const list=['rookie','decent','key player','important'];
  if(age>=21) list.push('star player');
  if(current && !list.includes(current)) list.push(current);
  return list;
}
function contractChance(st,salary,years,status,time){
  const maxSalary=computeSalary(st.player.age, st.player.overall, st.player.league||'Premier League', status, time);
  if(salary>maxSalary) return 0;
  let chance=0.6;
  if(salary>st.player.salary*1.1) chance-=0.2;
  const currentYears = visibleYearsLeft(st.player);
  if(years>currentYears) chance-=0.1*(years-currentYears);
  if(statusRank(status)>statusRank(st.player.status)) chance-=0.1;
  if(timeRank(time)>timeRank(st.player.timeBand)) chance-=0.1;
  const avgMinutes = st.week>1 ? st.seasonMinutes/(st.week-1) : st.seasonMinutes;
  const expect={'second bench':0,'bench':15,'rotater':40,'match player':65,'match starter':85}[time]||30;
  if(avgMinutes < expect*0.5) chance-=0.3;
  return Math.max(0,chance);
}
function chanceClass(c){
  if(c>=0.5) return 'prob-high';
  if(c>=0.3) return 'prob-med';
  if(c>=0.1) return 'prob-low';
  return 'prob-none';
}
function openContractRework(){
  const st=Game.state;
  if(st.player.club==='Free Agent'){ showPopup('Contract', 'You have no contract.'); return; }
  if(st.player.contractReworkYear>=st.season){ showPopup('Contract', 'You already requested this season.'); return; }
  if(st.player.marketBlocked>0){ showPopup('Contract', `Contract locked for ${st.player.marketBlocked} more season${st.player.marketBlocked>1?'s':''}.`); return; }

  const modal=q('#contract-modal');
  const slider=q('#contract-salary');
  const info=q('#contract-salary-info');
  const yearsDiv=q('#contract-years');
  const statusDiv=q('#contract-status');
  const timeDiv=q('#contract-time');
  const confirm=q('#contract-confirm');
  const cancel=q('#contract-cancel');
  const closeBtn=q('#close-contract');

  let selYear=visibleYearsLeft();
  let selStatus=st.player.status;
  let selTime=st.player.timeBand;

  slider.min=st.player.salary;
  const maxSal=computeSalary(st.player.age, st.player.overall, st.player.league||'Premier League', selStatus, selTime);
  const currentRoleMax=computeSalary(st.player.age, st.player.overall, st.player.league||'Premier League', st.player.status, st.player.timeBand);
  let capMultiplier=1.4;
  const starUndervalued = st.player.overall>=85 && st.player.salary < currentRoleMax*0.6;
  const rivalInterest = (st.lastOffers||[]).some(o=>o.league===st.player.league && o.club!==st.player.club);
  if(rivalInterest) capMultiplier=Math.max(capMultiplier,1.8);
  if(starUndervalued) capMultiplier=Math.max(capMultiplier,2.0);
  slider.max=Math.round(Math.max(st.player.salary, Math.min(maxSal, st.player.salary*capMultiplier)));
  slider.value=st.player.salary;
  slider.step=Math.max(1, Math.round(st.player.salary*0.01));

  yearsDiv.innerHTML='';
  const current=visibleYearsLeft();
  [0,1,2,3].forEach(n=>{
    const val=current+n;
    const b=document.createElement('button');
    b.textContent=n===0?'No extra year':`+${n}`;
    b.dataset.value=val;
    b.className='btn small option';
    b.onclick=()=>{ selYear=val; update(); };
    yearsDiv.appendChild(b);
  });

  statusDiv.innerHTML='';
  allowedStatuses(st.player.age, st.player.overall, st.player.status, st.player.pos).forEach(s=>{
    const b=document.createElement('button');
    b.textContent=s;
    b.dataset.value=s;
    b.className='btn small option';
    b.onclick=()=>{ selStatus=s; update(); };
    statusDiv.appendChild(b);
  });

  timeDiv.innerHTML='';
  ['second bench','bench','rotater','match player','match starter'].forEach(t=>{
    const b=document.createElement('button');
    b.textContent=t;
    b.dataset.value=t;
    b.className='btn small option';
    b.onclick=()=>{ selTime=t; update(); };
    timeDiv.appendChild(b);
  });

  slider.oninput=update;
  cancel.onclick=()=>modal.removeAttribute('open');
  closeBtn.onclick=()=>modal.removeAttribute('open');
  confirm.onclick=submit;

  function update(){
    const sal=+slider.value;
    const chance=contractChance(st,sal,selYear,selStatus,selTime);
    const diff=Math.round((sal-st.player.salary)/st.player.salary*100);
    info.textContent=`£${sal.toLocaleString()} (${diff>=0?'+':''}${diff}%)`;
    info.className=sal===st.player.salary?'' : chanceClass(chance);

    yearsDiv.querySelectorAll('button').forEach(btn=>{
      const val=+btn.dataset.value;
      const ch=contractChance(st,sal,val,selStatus,selTime);
      btn.className=`btn small option ${chanceClass(ch)}${val===selYear?' selected':''}`;
    });
    statusDiv.querySelectorAll('button').forEach(btn=>{
      const val=btn.dataset.value;
      const ch=contractChance(st,sal,selYear,val,selTime);
      btn.className=`btn small option ${chanceClass(ch)}${val===selStatus?' selected':''}`;
    });
    timeDiv.querySelectorAll('button').forEach(btn=>{
      const val=btn.dataset.value;
      const ch=contractChance(st,sal,selYear,selStatus,val);
      btn.className=`btn small option ${chanceClass(ch)}${val===selTime?' selected':''}`;
    });
  }

  function submit(){
    const salary=+slider.value;
    const years=selYear;
    const status=selStatus;
    const time=selTime;
    const maxSalary=computeSalary(st.player.age, st.player.overall, st.player.league||'Premier League', status, time);
    if(salary>maxSalary){
      showPopup('Contract', 'Club rejects your unrealistic salary demand.');
      st.player.contractReworkYear=st.season; Game.log('Contract rework rejected: salary too high.'); Game.save(); modal.removeAttribute('open');
      return;
    }
    const chance=contractChance(st,salary,years,status,time);
    if(Math.random()<chance){
      st.player.salary=Math.round(salary);
      st.player.yearsLeft=years+1;
      st.player.status=status;
      st.player.timeBand=time;
      st.player.releaseClause=Math.round(st.player.value*(1.2+years*0.1));
      Game.log('Club accepted contract rework');
      showPopup('Contract', 'Club accepted your proposal.');
    } else {
      if(Math.random()<0.2){ st.player.transferListed=true; Game.log('Club rejected and listed you for transfer'); }
      Game.log('Club rejected contract rework');
      showPopup('Contract', 'Club rejected your proposal.');
    }
    st.player.contractReworkYear=st.season;
    Game.save(); renderAll();
    modal.removeAttribute('open');
  }

  update();
  modal.setAttribute('open','');
}
