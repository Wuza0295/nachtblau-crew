document.addEventListener('DOMContentLoaded', () => {
  const adultToggle = document.querySelector('[data-adult-toggle]');
  const adultHint = document.querySelector('[data-adult-hint]');
  const policyRequired = document.querySelector('[data-policy-required]');
  if (adultToggle && adultHint) {
    const sync = () => {
      const on = adultToggle.checked;
      adultHint.hidden = !on;
      if (policyRequired) {
        policyRequired.required = on;
        if (!on) policyRequired.checked = false;
      }
    };
    adultToggle.addEventListener('change', sync);
    sync();
  }

  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  if (toggle && nav) {
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    };
    toggle.addEventListener('click', () => {
      setOpen(!nav.classList.contains('is-open'));
    });
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 721px)').matches) setOpen(false);
    });
  }

  const dock = document.querySelector('[data-dock]');
  if (dock && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      const y = window.scrollY;
      const goingDown = y > lastY && y > 48;
      dock.classList.toggle('is-compact', goingDown);
      lastY = y;
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(onScroll);
      },
      { passive: true }
    );
  }
});
