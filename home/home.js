/* Matilab home v2: motion.
   Regra: a página funciona e é legível sem este arquivo. GSAP/Lenis só entram se carregarem e se o usuário não pediu menos movimento. */
(function () {
  var doc = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = matchMedia('(min-width: 901px)');

  /* menu mobile */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    doc.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) menu.querySelector('a').focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { setMenu(!doc.classList.contains('menu-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a') || e.target.closest('.menu-close')) setMenu(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.classList.contains('menu-open')) { setMenu(false); burger.focus(); } });

  /* nav troca de tema conforme o capítulo embaixo dela */
  var nav = document.querySelector('.nav');
  var chapters = [].slice.call(document.querySelectorAll('[data-nav]'));
  var navIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var t = e.target.getAttribute('data-nav');
      nav.classList.toggle('on-light', t === 'light');
      nav.classList.toggle('on-lime', t === 'lime');
    });
  }, { rootMargin: '-46px 0px -92% 0px' });
  chapters.forEach(function (c) { navIO.observe(c); });

  /* serviços: o painel à esquerda acompanha o cartão no centro da tela */
  var cards = [].slice.call(document.querySelectorAll('.svc-card'));
  if (cards.length) {
    var panels = [].slice.call(document.querySelectorAll('.svc-panel'));
    var chips = [].slice.call(document.querySelectorAll('.svc-panel li'));
    var sIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var p = e.target.getAttribute('data-p'), s = e.target.getAttribute('data-s');
        cards.forEach(function (c) { c.classList.toggle('on', c === e.target); });
        panels.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-p') === p); });
        chips.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-s') === s); });
      });
    }, { rootMargin: '-48% 0px -48% 0px' });
    cards.forEach(function (c) { sIO.observe(c); });
  }

  /* contadores */
  var cIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, to = +el.getAttribute('data-count');
      cIO.unobserve(el);
      if (reduce) { el.textContent = to; return; }
      var t0 = performance.now();
      (function tick(now) {
        var p = Math.min((now - t0) / 1600, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: .4 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cIO.observe(el); });

  if (reduce) return;

  /* revelações por IntersectionObserver */
  doc.classList.add('js-motion');
  var rIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rIO.unobserve(e.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-rv]').forEach(function (el) { rIO.observe(el); });

  /* nav some ao descer e volta ao subir */
  var lastY = scrollY, ticking = false;
  function onScrollNav() {
    var y = scrollY;
    if (!doc.classList.contains('menu-open')) nav.classList.toggle('hide', y > lastY && y > 400);
    lastY = y; ticking = false;
  }

  /* GSAP + Lenis (carregados com defer depois deste arquivo) */
  function boot() {
    if (!window.gsap || !window.ScrollTrigger) return false;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    var lenis = null;
    if (window.Lenis) {
      lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
      lenis.on('scroll', function () { ST.update(); if (!ticking) { ticking = true; requestAnimationFrame(onScrollNav); } });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (id.length < 2) return;
          var t = document.querySelector(id);
          if (!t) return;
          e.preventDefault();
          lenis.scrollTo(t, { offset: -24 });
        });
      });
    } else {
      ST.addEventListener('refresh', function () {});
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScrollNav); } }, { passive: true });
    }

    var mm = gsap.matchMedia();

    /* 2. manifesto: palavras acendem com o scroll e o capítulo escuro vira claro */
    var words = gsap.utils.toArray('.manifesto .w');
    if (words.length) {
      var mt = gsap.timeline({ scrollTrigger: { trigger: '.manifesto', start: 'top top', end: 'bottom bottom', scrub: .6 } });
      /* 0 a 10: palavras acendem / 11 a 12.2: escuro vira claro (rápido, sem meio-termo cinza longo) / até 13: respiro */
      mt.to(words, { opacity: 1, y: 0, filter: 'blur(0px)', stagger: 8 / Math.max(1, words.length - 1), ease: 'power2.out', duration: 1.4 }, 0)
        .to('.manifesto-sign', { opacity: .85, y: 0, duration: 1, ease: 'power2.out' }, 9.2)
        .to('.manifesto', { backgroundColor: '#EEF0EA', color: '#0E0F0C', duration: 1.2, ease: 'power1.inOut' }, 11)
        .to({}, { duration: .8 }, 12.2);
      ST.create({
        trigger: '.manifesto', start: 'top top', end: 'bottom bottom',
        onUpdate: function (s) { var light = s.progress > .9; nav.classList.toggle('on-light', light); }
      });
    }

    /* 3. cases: scroll vertical vira pan horizontal (o print fica parado, mostrando o topo do site) */
    mm.add('(min-width: 901px)', function () {
      var track = document.querySelector('.pan-track');
      if (!track) return;
      function dist() { return Math.max(0, track.scrollWidth - innerWidth); }
      gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: '.cases-pin', start: 'bottom bottom', end: function () { return '+=' + dist(); }, pin: '.cases-pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    });

    /* 5. foto do fundador com leve parallax */
    gsap.fromTo('.founder-photo img', { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.founder-photo', start: 'top bottom', end: 'bottom top', scrub: true } });

    addEventListener('load', function () { ST.refresh(); });
    return true;
  }

  if (!boot()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (boot() || ++tries > 40) {
        clearInterval(iv);
        if (tries > 40) window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScrollNav); } }, { passive: true });
      }
    }, 100);
  }
})();
