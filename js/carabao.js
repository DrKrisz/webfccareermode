// ===== Carabao Cup helpers =====
function renderCarabaoCupTable(matches){
  const rows = matches.map(e=>{
    const opponent = e.played ? e.opponent : 'TBD';
    const res = e.played ? `${e.result}${e.scoreline?` ${e.scoreline}`:''}` : 'TBD';
    return `<tr><td>${e.round||''}</td><td>${opponent}</td><td>${res}</td></tr>`;
  }).join('');
  return `<table class="league-table"><thead><tr><th>Round</th><th>Opponent</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table>`;
}
