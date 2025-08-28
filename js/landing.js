// Handles the landing page interactions and player setup.
// This keeps the index.html page free from inline scripts and
// makes the behaviour easier to maintain.
(function(){
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
    const cont=document.getElementById('continent');
    const country=document.getElementById('country');
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

  const form = document.getElementById('setup-form');
  if(form){
    setupCountrySelect();
    form.addEventListener('submit', e => {
      e.preventDefault();
      const params = new URLSearchParams({
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        continent: document.getElementById('continent').value,
        country: document.getElementById('country').value,
        pos: document.querySelector('input[name=pos]:checked').value,
        alwaysPlay: document.getElementById('always-play').checked ? '1' : '0'
      });
      location.href = 'game.html?' + params.toString();
    });
  }

})();
