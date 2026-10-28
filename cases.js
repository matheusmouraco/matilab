// /cases: filtro por setor (#hash compartilhável, ex.: /cases#saude-e-clinicas), busca,
// entrada dos cards e print de página inteira que rola no hover (no celular, ao centralizar o card).
(function(){
  document.documentElement.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover = matchMedia('(hover: hover)').matches;
  var chips = [].slice.call(document.querySelectorAll('.cs-chip'));
  var secs = [].slice.call(document.querySelectorAll('.cs-sec'));
  var cards = [].slice.call(document.querySelectorAll('.cs-card'));
  var input = document.querySelector('.cs-search input');
  var empty = document.querySelector('.cs-empty');
  var bar = document.querySelector('.cs-bar');
  var setor = '';

  /* filtro e busca */
  function apply(){
    var q = input.value.trim().toLowerCase();
    var any = false;
    secs.forEach(function(s){
      var vis = 0;
      s.querySelectorAll('.cs-card').forEach(function(c){
        var ok = !q || c.getAttribute('data-q').indexOf(q) > -1;
        c.hidden = !ok;
        if(ok){ vis++; c.classList.add('in'); }
      });
      s.hidden = (setor && s.getAttribute('data-s') !== setor) || !vis;
      if(!s.hidden) any = true;
    });
    empty.hidden = any;
    chips.forEach(function(c){
      var on = c.getAttribute('data-f') === setor;
      c.classList.toggle('on', on);
      if(on) c.parentElement.scrollLeft = c.offsetLeft - c.parentElement.offsetLeft - 16;
    });
  }
  function select(f, push){
    setor = f;
    apply();
    if(push) history.replaceState(null, '', f ? '#' + f : location.pathname);
    var jump = function(){
      var top = bar.getBoundingClientRect().top + scrollY - 64;
      if(scrollY > top || f) scrollTo({top: top, behavior: (reduce || !push) ? 'auto' : 'smooth'});
    };
    push ? jump() : setTimeout(jump, 60);
  }
  chips.forEach(function(c){ c.addEventListener('click', function(){ select(c.getAttribute('data-f'), true); }); });
  input.addEventListener('input', apply);
  document.querySelector('.cs-clear').addEventListener('click', function(){ input.value = ''; apply(); input.focus(); });
  function fromHash(){
    var h = decodeURIComponent(location.hash.slice(1));
    if(secs.some(function(s){ return s.getAttribute('data-s') === h; })) select(h, false);
  }
  addEventListener('hashchange', fromHash);
  fromHash();

  /* entrada */
  if('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {rootMargin: '0px 0px -8% 0px'});
    cards.forEach(function(c){ io.observe(c); });
  } else cards.forEach(function(c){ c.classList.add('in'); });

  /* print de página inteira */
  function play(card){
    var fr = card.querySelector('.cs-frame');
    if(!fr.dataset.full || reduce) return;
    var box = fr.querySelector('.cs-long');
    if(!box){
      box = document.createElement('div');
      box.className = 'cs-long';
      box.innerHTML = '<img alt="" decoding="async">';
      box.firstChild.src = fr.dataset.full;
      fr.appendChild(box);
    }
    var img = box.firstChild;
    card._on = true;
    function go(){
      if(!card._on) return;
      var dist = img.offsetHeight - box.offsetHeight;
      if(dist <= 8) return;
      card.classList.add('play');
      if(card._anim) card._anim.cancel();
      card._anim = img.animate(
        [{transform: 'translateY(0)'}, {transform: 'translateY(-' + dist + 'px)'}],
        {duration: Math.max(2500, dist / 0.16), easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards', delay: 250}
      );
    }
    if(img.complete && img.naturalWidth) go(); else img.onload = go;
  }
  function stop(card){
    card._on = false;
    card.classList.remove('play');
    if(card._anim){ var a = card._anim; card._anim = null; setTimeout(function(){ a.cancel(); }, 350); }
  }
  if(hover){
    cards.forEach(function(c){
      c.addEventListener('pointerenter', function(){ play(c); });
      c.addEventListener('pointerleave', function(){ stop(c); });
      c.addEventListener('focus', function(){ play(c); });
      c.addEventListener('blur', function(){ stop(c); });
    });
  } else if('IntersectionObserver' in window){
    var mid = new IntersectionObserver(function(es){
      es.forEach(function(en){ en.isIntersecting ? play(en.target) : stop(en.target); });
    }, {rootMargin: '-38% 0px -38% 0px'});
    cards.forEach(function(c){ mid.observe(c); });
  }
})();
