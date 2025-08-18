// ===== Contract rework =====
function statusRank(s){ return ['rookie','decent','key player','important','star player'].indexOf(s); }
function timeRank(t){ return ['second bench','bench','rotater','match player','match starter'].indexOf(t); }
function openContractRework(){
  const st=Game.state;
  if(st.player.club==='Free Agent'){ alert('You have no contract.'); return; }
  if(st.player.contractReworkYear>=st.season){ alert('You already requested this season.'); return; }
  if(st.player.marketBlocked>0){ alert(`Contract locked for ${st.player.marketBlocked} more season${st.player.marketBlocked>1?'s':''}.`); return; }
  const salary=+prompt('Desired weekly salary?', st.player.salary) || st.player.salary;
  const years=+prompt('Desired contract length (years)?', st.player.yearsLeft) || st.player.yearsLeft;
  const status=prompt('Desired status?', st.player.status) || st.player.status;
  const time=prompt('Desired time band?', st.player.timeBand) || st.player.timeBand;
  const maxSalary=computeSalary(st.player.age, st.player.overall, st.player.league||'Premier League', status, time);
  if(salary>maxSalary*1.2){ alert('Club rejects your unrealistic salary demand.'); st.player.contractReworkYear=st.season; Game.log('Contract rework rejected: salary too high.'); Game.save(); return; }
  let chance=0.6;
  if(salary>st.player.salary*1.1) chance-=0.2;
  if(years>st.player.yearsLeft) chance-=0.1*(years-st.player.yearsLeft);
  if(statusRank(status)>statusRank(st.player.status)) chance-=0.1;
  if(timeRank(time)>timeRank(st.player.timeBand)) chance-=0.1;
  if(Math.random()<chance){
    st.player.salary=Math.round(salary);
    st.player.yearsLeft=years;
    st.player.status=status;
    st.player.timeBand=time;
    st.player.releaseClause=Math.round(st.player.value*(1.2+years*0.1));
    Game.log('Club accepted contract rework');
    alert('Club accepted your proposal.');
  } else {
    if(Math.random()<0.2){ st.player.transferListed=true; Game.log('Club rejected and listed you for transfer'); }
    Game.log('Club rejected contract rework');
    alert('Club rejected your proposal.');
  }
  st.player.contractReworkYear=st.season;
  Game.save(); renderAll();
}
