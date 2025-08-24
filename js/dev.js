(function(){
  const Game = window.opener.Game;
  const renderAll = window.opener.renderAll;
  const showPopup = window.opener.showPopup;
  const requestLoan = window.opener.requestLoan;
  const openMarket = window.opener.openMarket;
  const rollMarketOffers = window.opener.rollMarketOffers;

  const q = sel => document.querySelector(sel);
  const click = (id, fn) => { const el = q(id); if(el) el.onclick = fn; };

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
