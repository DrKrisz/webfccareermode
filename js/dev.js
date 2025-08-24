(function(){
  const prefix = '[Dev window]';
  console.log(prefix,'loaded');

  const opener = window.opener;
  if(!opener){
    console.error(prefix,'no opener window found; open from the game.');
    return;
  }
  const Game = opener.Game;
  const renderAll = opener.renderAll;
  const showPopup = opener.showPopup;
  const requestLoan = opener.requestLoan;
  const openMarket = opener.openMarket;
  const rollMarketOffers = opener.rollMarketOffers;

  if(!Game || !renderAll || !showPopup || !requestLoan || !openMarket || !rollMarketOffers){
    console.error(prefix,'required functions missing on opener');
    return;
  }

  const q = sel => document.querySelector(sel);
  const click = (id, fn) => {
    const el = q(id);
    if(el) el.addEventListener('click', () => {
      console.log(prefix,id,'clicked');
      try {
        fn();
      } catch(err){
        console.error(prefix,'error executing',id,err);
      }
    });
  };

  click('#dev-injure', () => {
    const st = Game.state;
    if(st.player){
      st.player.injury = {type:'dev injury', days:7};
      Game.log('Dev: forced injury');
      Game.save();
      renderAll();
      showPopup('Dev tools','Player injured for 7 days.');
    }
  });

  click('#dev-heal', () => {
    const st = Game.state;
    if(st.player){
      st.player.injury = null;
      Game.log('Dev: healed injury');
      Game.save();
      renderAll();
      showPopup('Dev tools','Player healed.');
    }
  });

  click('#dev-loan', () => {
    if(Game.state.player){
      requestLoan();
    }
  });

  click('#dev-offers', () => {
    const st = Game.state;
    if(st.player){
      st.player.transferListed = true;
      st.lastOffers = rollMarketOffers(st.player);
      Game.save();
      renderAll();
      openMarket();
    }
  });
})();
