// Handles the landing page interactions and player setup.
// This keeps the index.html page free from inline scripts and
// makes the behaviour easier to maintain.
(function(){
  const form = document.getElementById('setup-form');
  if(form){
    form.addEventListener('submit', e => {
      e.preventDefault();
      const mode = document.querySelector('input[name=mode]:checked').value;
      if(mode === 'manager'){
        location.href = 'managergame.html';
        return;
      }
      const params = new URLSearchParams({
        name: document.getElementById('name').value,
        age: document.getElementById('age').value,
        origin: document.getElementById('origin').value,
        pos: document.querySelector('input[name=pos]:checked').value,
        alwaysPlay: document.getElementById('always-play').checked ? '1' : '0'
      });
      location.href = 'game.html?' + params.toString();
    });
  }

})();
