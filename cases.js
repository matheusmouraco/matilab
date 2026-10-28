// Filtro por setor (com #hash compartilhável, ex.: /cases#arquitetura-e-interiores) e busca por nome.
(function(){
  var chips = [].slice.call(document.querySelectorAll('.cs-chip'));
  var secs = [].slice.call(document.querySelectorAll('.cs-sec'));
  var input = document.querySelector('.cs-search input');
  var empty = document.querySelector('.cs-empty');
  var setor = '';

  function apply(){
    var q = (input.value || '').trim().toLowerCase();
    var any = false;
    secs.forEach(function(s){
      var vis = 0;
      s.querySelectorAll('.cs-card').forEach(function(c){
        var ok = !q || c.getAttribute('data-q').indexOf(q) > -1;
        c.hidden = !ok; if(ok) vis++;
      });
      s.hidden = (setor && s.getAttribute('data-s') !== setor) || !vis;
      if(!s.hidden) any = true;
    });
    empty.hidden = any;
    chips.forEach(function(c){
      var on = c.getAttribute('data-f') === setor;
      c.classList.toggle('on', on);
      if(on) c.parentElement.scrollLeft = c.offsetLeft - 16;
    });
  }

  function select(f, push){
    setor = f;
    apply();
    if(push) history.replaceState(null, '', f ? '#' + f : location.pathname);
    var bar = document.querySelector('.cs-bar-wrap');
    window.scrollTo({top: bar.getBoundingClientRect().top + window.scrollY - 60});
  }

  chips.forEach(function(c){
    c.addEventListener('click', function(){
      select(c.getAttribute('data-f'), true);
    });
  });
  input.addEventListener('input', apply);

  function fromHash(){
    var h = decodeURIComponent(location.hash.slice(1));
    if(h && secs.some(function(s){ return s.getAttribute('data-s') === h; })) select(h, false);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
