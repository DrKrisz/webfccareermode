// ===== Alert Log =====
const alertLog=[];
function renderAlertLog(){
  const el=q('#alert-log');
  if(!el) return;
  el.innerHTML='';
  alertLog.forEach(line=>{
    const div=document.createElement('div');
    div.textContent=line;
    el.append(div);
  });
}
window.onerror=(msg,src,line,col,err)=>{
  alertLog.push(`${msg} (${src}:${line})`);
  renderAlertLog();
};
window.onunhandledrejection=e=>{
  alertLog.push(`Unhandled: ${e.reason}`);
  renderAlertLog();
};

// Small helper to bind event listeners only when the element exists.
// Keeps the wiring code terse throughout the file.
const bind = (selector, fn) => {
  const el = q(selector);
  if (el) el.onclick = fn;
};

// Country list used for continent/country selection.
const COUNTRIES = {
  'Europe': [
    {value:'United Kingdom',code:'GB'},
    {value:'Spain',code:'ES'},
    {value:'Germany',code:'DE'},
    {value:'France',code:'FR'},
    {value:'Italy',code:'IT'},
    {value:'Portugal',code:'PT'},
    {value:'Netherlands',code:'NL'},
    {value:'Belgium',code:'BE'},
    {value:'Switzerland',code:'CH'},
    {value:'Austria',code:'AT'},
    {value:'Poland',code:'PL'},
    {value:'Czech Republic',code:'CZ'},
    {value:'Slovakia',code:'SK'},
    {value:'Hungary',code:'HU'},
    {value:'Croatia',code:'HR'},
    {value:'Slovenia',code:'SI'},
    {value:'Serbia',code:'RS'},
    {value:'Bosnia and Herzegovina',code:'BA'},
    {value:'Montenegro',code:'ME'},
    {value:'Albania',code:'AL'},
    {value:'North Macedonia',code:'MK'},
    {value:'Greece',code:'GR'},
    {value:'Bulgaria',code:'BG'},
    {value:'Romania',code:'RO'},
    {value:'Moldova',code:'MD'},
    {value:'Ukraine',code:'UA'},
    {value:'Belarus',code:'BY'},
    {value:'Russia',code:'RU'},
    {value:'Sweden',code:'SE'},
    {value:'Norway',code:'NO'},
    {value:'Finland',code:'FI'},
    {value:'Denmark',code:'DK'},
    {value:'Iceland',code:'IS'},
    {value:'Ireland',code:'IE'},
    {value:'Estonia',code:'EE'},
    {value:'Latvia',code:'LV'},
    {value:'Lithuania',code:'LT'},
    {value:'Luxembourg',code:'LU'},
    {value:'Liechtenstein',code:'LI'},
    {value:'San Marino',code:'SM'},
    {value:'Monaco',code:'MC'},
    {value:'Andorra',code:'AD'},
    {value:'Malta',code:'MT'},
    {value:'Cyprus',code:'CY'},
    {value:'Vatican City',code:'VA'}
  ],
  'South America': [
    {value:'Brazil',code:'BR'},
    {value:'Argentina',code:'AR'},
    {value:'Uruguay',code:'UY'},
    {value:'Chile',code:'CL'},
    {value:'Peru',code:'PE'},
    {value:'Ecuador',code:'EC'},
    {value:'Colombia',code:'CO'},
    {value:'Venezuela',code:'VE'},
    {value:'Bolivia',code:'BO'},
    {value:'Paraguay',code:'PY'},
    {value:'Guyana',code:'GY'},
    {value:'Suriname',code:'SR'}
  ],
  'North America': [
    {value:'United States',code:'US'},
    {value:'Canada',code:'CA'},
    {value:'Mexico',code:'MX'},
    {value:'Guatemala',code:'GT'},
    {value:'Honduras',code:'HN'},
    {value:'El Salvador',code:'SV'},
    {value:'Nicaragua',code:'NI'},
    {value:'Costa Rica',code:'CR'},
    {value:'Panama',code:'PA'},
    {value:'Belize',code:'BZ'},
    {value:'Bahamas',code:'BS'},
    {value:'Cuba',code:'CU'},
    {value:'Jamaica',code:'JM'},
    {value:'Haiti',code:'HT'},
    {value:'Dominican Republic',code:'DO'},
    {value:'Barbados',code:'BB'},
    {value:'Trinidad and Tobago',code:'TT'},
    {value:'Grenada',code:'GD'},
    {value:'Saint Lucia',code:'LC'},
    {value:'Saint Vincent and the Grenadines',code:'VC'},
    {value:'Antigua and Barbuda',code:'AG'},
    {value:'Dominica',code:'DM'},
    {value:'Saint Kitts and Nevis',code:'KN'}
  ],
  'Africa': [
    {value:'Nigeria',code:'NG'},
    {value:'South Africa',code:'ZA'},
    {value:'Egypt',code:'EG'},
    {value:'Algeria',code:'DZ'},
    {value:'Angola',code:'AO'},
    {value:'Benin',code:'BJ'},
    {value:'Botswana',code:'BW'},
    {value:'Burkina Faso',code:'BF'},
    {value:'Burundi',code:'BI'},
    {value:'Cameroon',code:'CM'},
    {value:'Cape Verde',code:'CV'},
    {value:'Central African Republic',code:'CF'},
    {value:'Chad',code:'TD'},
    {value:'Comoros',code:'KM'},
    {value:'Republic of the Congo',code:'CG'},
    {value:'Democratic Republic of the Congo',code:'CD'},
    {value:'Djibouti',code:'DJ'},
    {value:'Equatorial Guinea',code:'GQ'},
    {value:'Eritrea',code:'ER'},
    {value:'Eswatini',code:'SZ'},
    {value:'Ethiopia',code:'ET'},
    {value:'Gabon',code:'GA'},
    {value:'Gambia',code:'GM'},
    {value:'Ghana',code:'GH'},
    {value:'Guinea',code:'GN'},
    {value:'Guinea-Bissau',code:'GW'},
    {value:'Ivory Coast',code:'CI'},
    {value:'Kenya',code:'KE'},
    {value:'Lesotho',code:'LS'},
    {value:'Liberia',code:'LR'},
    {value:'Libya',code:'LY'},
    {value:'Madagascar',code:'MG'},
    {value:'Malawi',code:'MW'},
    {value:'Mali',code:'ML'},
    {value:'Mauritania',code:'MR'},
    {value:'Mauritius',code:'MU'},
    {value:'Morocco',code:'MA'},
    {value:'Mozambique',code:'MZ'},
    {value:'Namibia',code:'NA'},
    {value:'Niger',code:'NE'},
    {value:'Rwanda',code:'RW'},
    {value:'Sao Tome and Principe',code:'ST'},
    {value:'Senegal',code:'SN'},
    {value:'Seychelles',code:'SC'},
    {value:'Sierra Leone',code:'SL'},
    {value:'Somalia',code:'SO'},
    {value:'South Sudan',code:'SS'},
    {value:'Sudan',code:'SD'},
    {value:'Tanzania',code:'TZ'},
    {value:'Togo',code:'TG'},
    {value:'Tunisia',code:'TN'},
    {value:'Uganda',code:'UG'},
    {value:'Zambia',code:'ZM'},
    {value:'Zimbabwe',code:'ZW'}
  ],
  'Asia': [
    {value:'Japan',code:'JP'},
    {value:'South Korea',code:'KR'},
    {value:'China',code:'CN'},
    {value:'India',code:'IN'},
    {value:'Pakistan',code:'PK'},
    {value:'Bangladesh',code:'BD'},
    {value:'Indonesia',code:'ID'},
    {value:'Philippines',code:'PH'},
    {value:'Vietnam',code:'VN'},
    {value:'Thailand',code:'TH'},
    {value:'Malaysia',code:'MY'},
    {value:'Singapore',code:'SG'},
    {value:'Myanmar',code:'MM'},
    {value:'Cambodia',code:'KH'},
    {value:'Laos',code:'LA'},
    {value:'Brunei',code:'BN'},
    {value:'Nepal',code:'NP'},
    {value:'Bhutan',code:'BT'},
    {value:'Sri Lanka',code:'LK'},
    {value:'Maldives',code:'MV'},
    {value:'Mongolia',code:'MN'},
    {value:'North Korea',code:'KP'},
    {value:'Afghanistan',code:'AF'},
    {value:'Kazakhstan',code:'KZ'},
    {value:'Uzbekistan',code:'UZ'},
    {value:'Turkmenistan',code:'TM'},
    {value:'Tajikistan',code:'TJ'},
    {value:'Kyrgyzstan',code:'KG'},
    {value:'Georgia',code:'GE'},
    {value:'Armenia',code:'AM'},
    {value:'Azerbaijan',code:'AZ'},
    {value:'Saudi Arabia',code:'SA'},
    {value:'United Arab Emirates',code:'AE'},
    {value:'Qatar',code:'QA'},
    {value:'Bahrain',code:'BH'},
    {value:'Kuwait',code:'KW'},
    {value:'Oman',code:'OM'},
    {value:'Yemen',code:'YE'},
    {value:'Iraq',code:'IQ'},
    {value:'Iran',code:'IR'},
    {value:'Israel',code:'IL'},
    {value:'Jordan',code:'JO'},
    {value:'Lebanon',code:'LB'},
    {value:'Syria',code:'SY'},
    {value:'Turkey',code:'TR'},
    {value:'Taiwan',code:'TW'},
    {value:'Timor-Leste',code:'TL'},
    {value:'Palestine',code:'PS'}
  ],
  'Oceania': [
    {value:'Australia',code:'AU'},
    {value:'New Zealand',code:'NZ'},
    {value:'Fiji',code:'FJ'},
    {value:'Papua New Guinea',code:'PG'},
    {value:'Solomon Islands',code:'SB'},
    {value:'Vanuatu',code:'VU'},
    {value:'Samoa',code:'WS'},
    {value:'Tonga',code:'TO'},
    {value:'Kiribati',code:'KI'},
    {value:'Tuvalu',code:'TV'},
    {value:'Nauru',code:'NR'},
    {value:'Palau',code:'PW'},
    {value:'Micronesia',code:'FM'},
    {value:'Marshall Islands',code:'MH'}
  ]
};

const flagEmoji = code =>
  String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt()));

function setupCountrySelect(){
  const cont=q('#continent');
  const country=q('#country');
  if(!cont||!country) return;
  function update(){
    const list=COUNTRIES[cont.value]||[];
    country.innerHTML='';
    list.forEach(c=>{
      const opt=document.createElement('option');
      opt.value=c.value;
      opt.textContent=`${flagEmoji(c.code)} ${c.value}`;
      country.appendChild(opt);
    });
  }
  cont.addEventListener('change', update);
  update();
}

// ===== Download / Retire =====
function downloadLog(){ const st=Game.state; const text=(st.eventLog||[]).join('\n'); const blob=new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='webcareergame-log.txt'; a.click(); URL.revokeObjectURL(url); }
function retirePrompt(){ const st=Game.state; const c=q('#retire-content'); c.innerHTML=''; const box=document.createElement('div'); box.className='glass';
  const stats = st.player.pos==='Goalkeeper'
    ? `<div class="k">Clean sheets</div><div class="v">${st.cleanSheets}</div>`
    : `<div class="k">Goals</div><div class="v">${st.goals}</div><div class="k">Assists</div><div class="v">${st.assists}</div>`;
  box.innerHTML=`<div class="h">Career summary</div>
    <div class="kv">
      <div class="k">Name</div><div class="v">${st.player.name}</div>
      <div class="k">Overall</div><div class="v">${st.player.overall}</div>
      <div class="k">Club</div><div class="v">${st.player.club}</div>
      <div class="k">Minutes</div><div class="v">${st.minutesPlayed}</div>
      ${stats}
      <div class="k">Balance</div><div class="v">${Game.money(st.player.balance||0)}</div>
    </div>`;
  c.append(box); q('#retire-modal').setAttribute('open','');
}

// ===== Events / Boot =====
function wireEvents(){
  wireCoreEvents();
  wireDevTools();
}

// Attach core gameplay and UI events.
function wireCoreEvents(){
  const form = document.getElementById('setup-form');
  if(form){
    setupCountrySelect();
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name=q('#name').value||'Player';
      const age=q('#age').value||16;
      const continent=q('#continent').value;
      const country=q('#country').value;
      const posEl=[...document.querySelectorAll('input[name=pos]')].find(x=>x.checked);
      const pos=posEl ? posEl.value : 'Attacker';
      const alwaysPlay=q('#always-play').checked;
      Game.newGame({name,age,continent,country,pos,alwaysPlay});
      renderAll();
      openMarket();
      showPopup('Season start', `Season ${Game.state.season} has started.`);
    });
  }

  bind('#btn-market', ()=>openMarket());
  bind('#btn-shop', ()=>openShop());
  bind('#btn-contract', ()=>openContractRework());
  bind('#btn-league', ()=>openLeagueTable());
  bind('#close-market', ()=>q('#market-modal').removeAttribute('open'));
  bind('#close-shop', ()=>q('#shop-modal').removeAttribute('open'));
  bind('#close-contract', ()=>q('#contract-modal').removeAttribute('open'));
  bind('#close-league', ()=>{ const dlg=q('#league-modal'); if(dlg){ if(dlg.close) dlg.close(); else dlg.removeAttribute('open'); } });
  bind('#btn-next', ()=>nextDay());
  bind('#btn-auto', ()=>toggleAuto());
  bind('#btn-train', ()=>openTraining());
  bind('#btn-skills', ()=>toggleSkills());
  bind('#close-training', ()=>cancelTraining());
  bind('#close-cooldown', ()=>q('#cooldown-modal').removeAttribute('open'));
  bind('#cooldown-ok', ()=>q('#cooldown-modal').removeAttribute('open'));
  bind('#btn-play', ()=>{
    const entry=Game.state.schedule.find(d=>sameDay(d.date, Game.state.currentDate));
    if(!entry) return;
    if(entry.isMatch && !entry.played){
      openMatch(entry);
    } else if(entry.type==='seasonEnd'){
      startNextSeason();
    }
  });
  bind('#btn-retire', ()=>retirePrompt());
  bind('#retire-cancel', ()=>q('#retire-modal').removeAttribute('open'));
  bind('#retire-confirm', ()=>{ q('#retire-modal').removeAttribute('open'); Game.reset(); });
  bind('#btn-log', ()=>downloadLog());
  bind('#close-match', ()=>q('#match-modal').removeAttribute('open'));
  bind('#close-message', ()=>q('#message-modal').removeAttribute('open'));
  bind('#btn-alert-log', ()=>{ renderAlertLog(); q('#alert-log-modal').setAttribute('open',''); });
  bind('#close-alert-log', ()=>q('#alert-log-modal').removeAttribute('open'));
  bind('#btn-dev', ()=>q('#dev-modal').setAttribute('open',''));
  bind('#close-dev', ()=>q('#dev-modal').removeAttribute('open'));
}

// Attach developer / debug actions.
function wireDevTools(){
  const actions = {
    '#dev-injure': ()=>{
      const st=Game.state;
      if(st.player && !st.player.injury){
        st.player.preInjuryStatus = st.player.status;
        st.player.injury={type:'dev injury', days:7};
        st.player.status=`Injured (dev injury, 7d)`;
        Game.log('Dev: forced injury');
        Game.save();
        renderAll();
        showPopup('Dev tools','Player injured for 7 days.');
      }
    },
    '#dev-heal': ()=>{
      const st=Game.state;
      if(st.player){
        st.player.injury=null;
        if(st.player.preInjuryStatus){
          st.player.status=st.player.preInjuryStatus;
          delete st.player.preInjuryStatus;
        } else {
          st.player.status='-';
        }
        Game.log('Dev: healed injury');
        Game.save();
        renderAll();
        showPopup('Dev tools','Player healed.');
      }
    },
    '#dev-loan': ()=>{
      if(Game.state.player){
        requestLoan();
      }
    },
    '#dev-offers': ()=>{
      const st=Game.state;
      if(st.player){
        st.player.transferListed=true;
        st.lastOffers=rollMarketOffers(st.player);
        Game.save();
        renderAll();
        q('#dev-modal').removeAttribute('open');
        openMarket();
      }
    },
    '#dev-skip-month': ()=>{
      skipMonth();
      Game.log('Dev: skipped month');
      showPopup('Dev tools','Skipped one month.');
    },
    '#dev-skip-season': ()=>{
      skipSeason();
      q('#dev-modal').removeAttribute('open');
      Game.log('Dev: skipped season');
      showPopup('Dev tools','Skipped to season end.');
    },
    '#dev-force-season': ()=>{
      startNextSeason();
      q('#dev-modal').removeAttribute('open');
      Game.log('Dev: forced new season');
      showPopup('Dev tools','Started next season.');
    },
    '#dev-set-balance': ()=>{
      const st=Game.state;
      const val=+q('#dev-balance').value;
      if(st.player && !isNaN(val)){
        st.player.balance=val;
        Game.log('Dev: balance set');
        Game.save();
        renderAll();
        showPopup('Dev tools', `Balance set to ${Game.money(val)}.`);
      }
    },
    '#dev-set-overall': ()=>{
      const st=Game.state;
      const val=+q('#dev-overall').value;
      if(st.player && !isNaN(val)){
        st.player.overall=val;
        Game.log('Dev: overall set');
        Game.save();
        renderAll();
        showPopup('Dev tools', `Overall set to ${val}.`);
      }
    }
  };
  Object.entries(actions).forEach(([id, fn]) => bind(id, fn));
}

  (function boot(){
    wireEvents();
    injectVersion();
    const loaded = Game.load();
    if(!loaded){
      if(!setupFromUrl()){
        console.warn('Failed to load save state; starting fresh');
      }
    }
    renderAll();
  })();

  function setupFromUrl(){
    const params = new URLSearchParams(location.search);
    if(!params.has('name')) return false;
    const setup = {
      name: params.get('name') || 'Player',
      age: params.get('age') || 16,
      continent: params.get('continent') || 'Europe',
      country: params.get('country') || COUNTRIES['Europe'][0].value,
      pos: params.get('pos') || 'Attacker',
      alwaysPlay: params.get('alwaysPlay') === '1'
    };
    Game.newGame(setup);
    renderAll();
    openMarket();
    showPopup('Season start', `Season ${Game.state.season} has started.`);
    history.replaceState(null, '', location.pathname);
    return true;
  }
