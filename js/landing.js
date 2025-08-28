// Handles the landing page interactions and player setup.
// This keeps the index.html page free from inline scripts and
// makes the behaviour easier to maintain.
(function(){
  const COUNTRIES = {
    'Europe': [
      {value:'United Kingdom',emoji:'\uD83C\uDDEC\uD83C\uDDE7'},
      {value:'Spain',emoji:'\uD83C\uDDEA\uD83C\uDDF8'},
      {value:'Germany',emoji:'\uD83C\uDDE9\uD83C\uDDEA'}
    ],
    'South America': [
      {value:'Brazil',emoji:'\uD83C\uDDE7\uD83C\uDDF7'},
      {value:'Argentina',emoji:'\uD83C\uDDE6\uD83C\uDDF7'},
      {value:'Uruguay',emoji:'\uD83C\uDDFA\uD83C\uDDFE'}
    ],
    'North America': [
      {value:'United States',emoji:'\uD83C\uDDFA\uD83C\uDDF8'},
      {value:'Canada',emoji:'\uD83C\uDDE8\uD83C\uDDE6'},
      {value:'Mexico',emoji:'\uD83C\uDDF2\uD83C\uDDFD'}
    ],
    'Africa': [
      {value:'Nigeria',emoji:'\uD83C\uDDF3\uD83C\uDDEC'},
      {value:'South Africa',emoji:'\uD83C\uDDFF\uD83C\uDDE6'},
      {value:'Egypt',emoji:'\uD83C\uDDEA\uD83C\uDDEC'}
    ],
    'Asia': [
      {value:'Japan',emoji:'\uD83C\uDDEF\uD83C\uDDF5'},
      {value:'South Korea',emoji:'\uD83C\uDDF0\uD83C\uDDF7'},
      {value:'China',emoji:'\uD83C\uDDE8\uD83C\uDDF3'}
    ],
    'Oceania': [
      {value:'Australia',emoji:'\uD83C\uDDE6\uD83C\uDDFA'},
      {value:'New Zealand',emoji:'\uD83C\uDDF3\uD83C\uDDFF'},
      {value:'Fiji',emoji:'\uD83C\uDDEB\uD83C\uDDEF'}
    ]
  };

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
        opt.textContent=`${c.emoji} ${c.value}`;
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
