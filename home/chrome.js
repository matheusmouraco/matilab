/* Menu mobile e nav que some ao descer. Gerado por scripts/apply_chrome.py. */
(function () {
  var doc = document.documentElement, nav = document.querySelector('.mx-nav'), menu = document.getElementById('mx-menu');
  if (!nav || !menu) return;
  var burger = nav.querySelector('.mx-burger');
  function set(open) {
    doc.classList.toggle('mx-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) menu.querySelector('a').focus({ preventScroll: true });
  }
  burger.addEventListener('click', function () { set(!doc.classList.contains('mx-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a') || e.target.closest('.mx-menu-close')) set(false); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && doc.classList.contains('mx-open')) { set(false); burger.focus(); } });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var last = scrollY, ticking = false;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      var y = scrollY;
      if (!doc.classList.contains('mx-open')) nav.classList.toggle('mx-hide', y > last && y > 400);
      last = y; ticking = false;
    });
  }, { passive: true });
})();
