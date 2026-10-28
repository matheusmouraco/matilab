(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const map = (value, from, to) => from + (to - from) * value;
  const set = (element, property, value) => element?.style.setProperty(property, value);
  root.classList.add('has-motion');

  const reveals = document.querySelectorAll('[data-8b-motion]');
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  reveals.forEach(element => revealObserver.observe(element));

  const sceneIds = ['hero', 'listen', 'calls', 'tune', 'voices', 'setup', 'start', 'footer'];
  const scenes = new Map(sceneIds.map(id => [id, document.getElementById(id)]).filter(([, element]) => element));
  const active = new Set();
  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-motion-active', entry.isIntersecting);
      if (entry.isIntersecting) active.add(entry.target);
      else active.delete(entry.target);
    });
    schedule();
  }, { rootMargin: '75% 0px 75% 0px' });
  scenes.forEach(scene => sceneObserver.observe(scene));

  const calls = scenes.get('calls');
  const callItems = calls ? [...calls.querySelectorAll('.calls__item')] : [];
  const phoneSteps = calls ? [...calls.querySelectorAll('.phone [data-step]')] : [];
  const tune = scenes.get('tune');
  const tuneLines = tune ? [...tune.querySelectorAll('.tune__line')] : [];
  const tuneStage = tune?.querySelector('.tune__stage');
  const tuneSize = tune?.querySelector('[data-ctl="size"]');
  const tuneWeight = tune?.querySelector('[data-ctl="weight"]');
  const tunePill = tune?.querySelector('.tune__pill');
  const voices = scenes.get('voices');
  const voiceCols = voices ? [...voices.querySelectorAll('.voices__col')] : [];
  const voicePhoto = voices?.querySelector('.voices__photo img');
  const setup = scenes.get('setup');
  const setupCards = setup ? [...setup.querySelectorAll('.setup__card')] : [];
  setup?.classList.add('is-stacked');

  function sectionProgress(element, start = 0.92, end = 0.12) {
    const rect = element.getBoundingClientRect();
    const range = innerHeight * start + rect.height - innerHeight * end;
    return clamp((innerHeight * start - rect.top) / Math.max(range, 1));
  }

  function animateHero(hero) {
    const rect = hero.getBoundingClientRect();
    const progress = clamp((innerHeight - rect.bottom) / (innerHeight * 0.8));
    const wide = innerWidth >= 768;
    set(hero.querySelector('.hero__media'), '--motion-scale', (1 + progress * 0.09).toFixed(4));
    set(hero.querySelector('.hero__copy'), '--motion-y', `${Math.round(-innerHeight * progress * (wide ? 0.22 : 0.13))}px`);
    set(hero.querySelector('.hero__talk'), '--motion-y', `${Math.round(-innerHeight * progress * (wide ? 0.12 : 0.08))}px`);
  }

  function animateListen(listen) {
    const progress = clamp((innerHeight - listen.getBoundingClientRect().top) / (innerHeight * 0.82));
    const offset = (1 - progress) * Math.min(innerWidth * 0.08, 72);
    const voice = listen.querySelector('.listen__panel--voice');
    const read = listen.querySelector('.listen__panel--read');
    if (innerWidth >= 768) {
      set(voice, '--motion-x', `${-offset}px`);
      set(read, '--motion-x', `${offset}px`);
      set(voice, '--motion-y', '0px');
      set(read, '--motion-y', '0px');
    } else {
      set(voice, '--motion-y', `${offset}px`);
      set(read, '--motion-y', `${-offset}px`);
      set(voice, '--motion-x', '0px');
      set(read, '--motion-x', '0px');
    }
  }

  function animateCalls() {
    if (!callItems.length) return;
    const focus = innerHeight * (innerWidth >= 768 ? 0.58 : 0.42);
    let current = 0;
    let nearest = Infinity;
    callItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - focus);
      if (distance < nearest) { nearest = distance; current = index; }
    });
    callItems.forEach((item, index) => item.classList.toggle('is-current', index === current));
    phoneSteps.forEach(step => step.classList.toggle('is-visible', Number(step.dataset.step) <= current + 1));
  }

  function animateTune() {
    if (!tune || !tuneStage) return;
    const progress = sectionProgress(tune, 0.82, 0.18);
    const pulse = progress < 0.68 ? progress / 0.68 : 1 - (progress - 0.68) / 0.32 * 0.22;
    tuneLines.forEach(line => {
      set(line, '--motion-scale', map(clamp(pulse), 0.82, 1).toFixed(3));
      set(line, '--motion-weight', Math.round(map(clamp(pulse), 300, 760)));
    });
    set(tuneStage, '--motion-y', `${Math.round((1 - clamp(progress * 2)) * 72)}px`);
    set(tuneStage, '--motion-scale', map(clamp(progress * 2), 0.94, 1).toFixed(3));
    const sizeProgress = map(clamp(progress * 1.35), 0.3, 0.75);
    const weightProgress = map(clamp(progress * 1.45), 0.08, 0.78);
    set(tuneSize?.querySelector('.tune__fill'), '--motion-fill', sizeProgress.toFixed(3));
    set(tuneWeight?.querySelector('.tune__fill'), '--motion-fill', weightProgress.toFixed(3));
    set(tuneSize?.querySelector('.tune__thumb'), '--motion-x', `${Math.round((sizeProgress - 0.75) * 136)}px`);
    set(tuneWeight?.querySelector('.tune__thumb'), '--motion-x', `${Math.round((weightProgress - 0.6) * 136)}px`);
    set(tunePill, '--motion-x', progress > 0.58 ? '0%' : '-100%');
    tuneStage.classList.toggle('is-contrast', progress > 0.58);
  }

  function animateVoices() {
    if (!voices) return;
    const progress = clamp((innerHeight - voices.getBoundingClientRect().top) / (innerHeight * 0.95));
    voiceCols.forEach((column, index) => {
      const offset = (1 - progress) * innerHeight * (index ? 0.22 : 0.1);
      set(column, '--motion-y', `${Math.round(offset)}px`);
    });
    set(voicePhoto, '--motion-scale', map(progress, 1.16, 1).toFixed(3));
  }

  function animateSetup() {
    if (!setupCards.length) return;
    const nav = parseFloat(getComputedStyle(root).getPropertyValue('--page-nav-h')) || 88;
    setupCards.forEach((card, index) => {
      if (index === setupCards.length - 1) return;
      const next = setupCards[index + 1].getBoundingClientRect();
      const progress = clamp((innerHeight - next.top) / Math.max(innerHeight - nav, 1));
      set(card, '--motion-scale', map(progress, 1, 0.94).toFixed(3));
      set(card, '--motion-opacity', map(progress, 1, 0.76).toFixed(3));
    });
  }

  function animateStart(start) {
    const progress = clamp((innerHeight * 0.94 - start.getBoundingClientRect().top) / (innerHeight * 0.82));
    const frame = start.querySelector('.start__window');
    const wide = innerWidth >= 768;
    set(frame, '--motion-x', `${map(progress, wide ? 30 : 12, 0).toFixed(2)}%`);
    set(frame, '--motion-y', `${map(progress, wide ? 14 : 20, 0).toFixed(2)}%`);
    set(frame, '--motion-radius', `${map(progress, 72, 24).toFixed(1)}px`);
    set(frame?.querySelector('img'), '--motion-scale', map(progress, 1.28, 1).toFixed(3));
  }

  function animateFooter(footer) {
    const brand = footer.querySelector('.footer__brand');
    const r = brand.getBoundingClientRect();
    const progress = clamp((innerHeight - r.top) / Math.max(r.height, 1));
    set(footer.querySelector('.footer__word'), '--motion-y', `${Math.round(map(progress, 120, 0))}%`);
  }

  const animators = {
    hero: animateHero,
    listen: animateListen,
    calls: animateCalls,
    tune: animateTune,
    voices: animateVoices,
    setup: animateSetup,
    start: animateStart,
    footer: animateFooter
  };

  let frame = 0;
  function render() {
    frame = 0;
    active.forEach(scene => animators[scene.id]?.(scene));
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('load', schedule, { once: true });
  schedule();
})();
