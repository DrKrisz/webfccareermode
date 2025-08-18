// ===== Contract rework =====
function statusRank(s){ return ['rookie','decent','key player','important','star player'].indexOf(s); }
function timeRank(t){ return ['second bench','bench','rotater','match player','match starter'].indexOf(t); }
function contractChance(st,salary,years,status,time){
  const maxSalary=computeSalary(st.player.age, st.player.overall, st.player.league||'Premier League', status, time);
  if(salary>maxSalary*1.2) return 0;
  let chance=0.6;
  if(salary>st.player.salary*1.1) chance-=0.2;
  if(years>st.player.yearsLeft) chance-=0.1*(years-st.player.yearsLeft);
  if(statusRank(status)>statusRank(st.player.status)) chance-=0.1;
  if(timeRank(time)>timeRank(st.player.timeBand)) chance-=0.1;
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

  let selYear=st.player.yearsLeft;
  let selStatus=st.player.status;
  let selTime=st.player.timeBand;

  slider.min=st.player.salary;
  const maxSal=computeSalary(st.player.age, st.player.overall, st.player.league||'Premier League', selStatus, selTime);
  slider.max=Math.round(maxSal*1.2);
  slider.value=st.player.salary;

  yearsDiv.innerHTML='';
  [0,1,2,3].forEach(n=>{
    const val=st.player.yearsLeft+n;
    const b=document.createElement('button');
    b.textContent=n===0?'No extra year':`+${n}`;
    b.dataset.value=val;
    b.className='btn small option';
    b.onclick=()=>{ selYear=val; update(); };
    yearsDiv.appendChild(b);
  });

  statusDiv.innerHTML='';
  ['rookie','decent','key player','important','star player'].forEach(s=>{
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
    info.className=chanceClass(chance);

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
    if(salary>maxSalary*1.2){
      showPopup('Contract', 'Club rejects your unrealistic salary demand.');
      st.player.contractReworkYear=st.season; Game.log('Contract rework rejected: salary too high.'); Game.save(); modal.removeAttribute('open');
      return;
    }
    const chance=contractChance(st,salary,years,status,time);
    if(Math.random()<chance){
      st.player.salary=Math.round(salary);
      st.player.yearsLeft=years;
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
