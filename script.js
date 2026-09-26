'use strict';

/* ─── UTILITY ────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


/* ─── THEME TOGGLE ───────────────────────────────────── */
function initTheme() {
  const toggle  = $('#themeToggle');
  const html    = document.documentElement;
  const STORAGE = 'omuordu-theme';

  const saved       = localStorage.getItem(STORAGE);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  html.setAttribute('data-theme', saved || (prefersDark ? 'dark' : 'light'));

  toggle?.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE, next);
    toggle.style.transform = 'rotate(360deg) scale(1.2)';
    setTimeout(() => { toggle.style.transform = ''; }, 400);
  });

  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', e => {
      if (!localStorage.getItem(STORAGE)) {
        html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
}

/* ─── NAVIGATION ─────────────────────────────────────── */
function initNav() {
  const header    = $('#siteHeader');
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');
  const overlay   = $('#mobileOverlay');
  const links     = $$('.nav-link');
  const sections  = $$('section[id]');

  /* Scroll: header shadow + active link */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header?.classList.toggle('scrolled', y > 20);

      let current = '';
      sections.forEach(sec => {
        if (y >= sec.offsetTop - 130) current = sec.id;
      });
      links.forEach(link => {
        const href = link.getAttribute('href')?.replace('#', '');
        link.classList.toggle('active', href === current);
      });
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Hamburger open/close */
  const closeMenu = () => {
    hamburger?.classList.remove('open');
    navLinks?.classList.remove('open');
    overlay?.classList.remove('show');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    hamburger?.classList.add('open');
    navLinks?.classList.add('open');
    overlay?.classList.add('show');
    hamburger?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  hamburger?.addEventListener('click', () => {
    hamburger.classList.contains('open') ? closeMenu() : openMenu();
  });
  overlay?.addEventListener('click', closeMenu);
  links.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks?.classList.contains('open')) closeMenu();
  });
}

/* ─── SMOOTH SCROLL (nav anchors only — NOT modal triggers) ── */
function initSmoothAnchors() {
  /* Only apply to plain anchor links — skip anything with data-modal */
  $$('a[href^="#"]').forEach(link => {
    if (link.dataset.modal) return;           // skip modal triggers
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const headerH = 72;
      const y = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
}

/* ─── SCROLL REVEAL ──────────────────────────────────── */
function initScrollReveal() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    $$('.reveal-up,.reveal-left,.reveal-right').forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.10, rootMargin: '0px 0px -50px 0px' });

  $$('.reveal-up,.reveal-left,.reveal-right').forEach(el => io.observe(el));
}

/* ─── COUNTER ANIMATION ──────────────────────────────── */
function initCounters() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCount(el, target, dur = 1800) {
    if (reduced) { el.textContent = target; return; }
    const start   = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(easeOut(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target, parseInt(e.target.dataset.count, 10));
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  $$('[data-count]').forEach(el => io.observe(el));
}

/* ─── BACK TO TOP ────────────────────────────────────── */
function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ─── CONTACT FORM (Formspree) ───────────────────────── */
function initForm() {
  const form     = $('#contactForm');
  const btn      = $('#submitBtn');
  const success  = $('#formSuccess');
  const error    = $('#formError');
  const errorMsg = $('#formErrorMsg');
  if (!form || !btn) return;

  const ENDPOINT = form.dataset.formspree || 'https://formspree.io/f/xpwzgdwj';

  const setBtnState = state => {
    const map = {
      idle:    { html: '<i class="fa-regular fa-paper-plane" aria-hidden="true"></i> Send Message', disabled: false },
      loading: { html: '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending…',   disabled: true  },
      sent:    { html: '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Message Sent!',  disabled: true  },
      error:   { html: '<i class="fa-regular fa-paper-plane" aria-hidden="true"></i> Try Again',    disabled: false },
    };
    const s = map[state] || map.idle;
    btn.innerHTML = s.html;
    btn.disabled  = s.disabled;
  };

  const hide = () => { if (success) success.hidden = true; if (error) error.hidden = true; };
  const showErr = msg => {
    setBtnState('error');
    if (errorMsg) errorMsg.textContent = msg;
    if (error)  { error.hidden = false; error.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    hide();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    setBtnState('loading');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        body:   new FormData(form),
        headers:{ 'Accept': 'application/json' },
      });
      if (res.ok) {
        setBtnState('sent');
        if (success) { success.hidden = false; success.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
        form.reset();
        $$('input,select,textarea', form).forEach(f => { f.style.borderColor = ''; });
        setTimeout(() => { setBtnState('idle'); if (success) success.hidden = true; }, 6000);
      } else {
        const body = await res.json().catch(() => ({}));
        showErr(body?.errors?.map(e => e.message).join(', ') || `Server error (${res.status}). Please email us directly.`);
      }
    } catch {
      showErr('Network error — please check your connection or call us directly on 0814 331 0952.');
    }
  });

  $$('input,select,textarea', form).forEach(field => {
    if (field.type === 'hidden' || field.style.display === 'none') return;
    field.addEventListener('blur', () => {
      if (field.required && !field.value.trim()) field.style.borderColor = '#c0392b';
      else if (field.value.trim()) field.style.borderColor = '';
    });
    field.addEventListener('input', () => { if (field.value.trim()) field.style.borderColor = ''; });
  });
}

/* ─── FOOTER YEAR ────────────────────────────────────── */
function initFooter() {
  const el = $('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ─── CARD TILT ──────────────────────────────────────── */
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window) return; // skip on touch devices

  $$('.practice-card, .why-card, .visual-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      card.style.transform = `perspective(800px) rotateX(${dy * 5}deg) rotateY(${-dx * 5}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─── JUSTICE PARALLAX ───────────────────────────────── */
function initJusticeParallax() {
  const col = $('.hero-image-col');
  if (!col) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth <= 768) return;

  let raf;
  document.addEventListener('mousemove', e => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const dx = (e.clientX - window.innerWidth  / 2) / (window.innerWidth  / 2);
      const dy = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      col.style.transform = `translateY(${dy * 10}px) translateX(${dx * 6}px)`;
    });
  });
}

/* ─── HERO ENTRANCE ──────────────────────────────────── */
function initHeroEntrance() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.hero .reveal-up,.hero .reveal-left,.hero .reveal-right').forEach(el => el.classList.add('visible'));
    return;
  }
  $$('.hero .reveal-up,.hero .reveal-left,.hero .reveal-right').forEach(el => {
    const delay = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => el.classList.add('visible'), 300 + delay);
  });
}

/* ─── PROGRESS BAR ───────────────────────────────────── */
function initProgressBar() {
  const bar = document.createElement('div');
  bar.setAttribute('aria-hidden', 'true');
  Object.assign(bar.style, {
    position: 'fixed', top: '0', left: '0',
    height: '2px', width: '100%',
    background: 'linear-gradient(90deg,#c9a84c,#e8c96a)',
    zIndex: '9998',
    transformOrigin: 'left',
    transform: 'scaleX(0)',
    transition: 'transform .1s linear',
    pointerEvents: 'none',
  });
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
  }, { passive: true });
}

/* ─── SPARKLES ───────────────────────────────────────── */
function initSparkles() {
  const col = $('.hero-image-col');
  if (!col || window.innerWidth <= 768) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const configs = [
    { left:'18%',top:'12%',tx:'-12px',ty:'-38px',dur:'4.2s',delay:'0s'   },
    { left:'75%',top:'8%', tx:'14px', ty:'-44px',dur:'3.8s',delay:'.6s'  },
    { left:'88%',top:'35%',tx:'18px', ty:'-30px',dur:'5.1s',delay:'1.2s' },
    { left:'82%',top:'62%',tx:'10px', ty:'-42px',dur:'4.6s',delay:'.3s'  },
    { left:'10%',top:'55%',tx:'-16px',ty:'-36px',dur:'3.6s',delay:'1.8s' },
    { left:'22%',top:'78%',tx:'-8px', ty:'-50px',dur:'4.9s',delay:'2.4s' },
    { left:'60%',top:'22%',tx:'12px', ty:'-28px',dur:'4.4s',delay:'.9s'  },
    { left:'40%',top:'5%', tx:'-6px', ty:'-46px',dur:'3.9s',delay:'1.5s' },
    { left:'92%',top:'80%',tx:'16px', ty:'-32px',dur:'5.3s',delay:'2.1s' },
    { left:'5%', top:'28%',tx:'-18px',ty:'-40px',dur:'4.7s',delay:'3s'   },
    { left:'50%',top:'90%',tx:'4px',  ty:'-55px',dur:'4.1s',delay:'3.6s' },
    { left:'30%',top:'45%',tx:'-14px',ty:'-35px',dur:'5s',  delay:'4.2s' },
  ];
  configs.forEach(cfg => {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.cssText = `left:${cfg.left};top:${cfg.top};--tx:${cfg.tx};--ty:${cfg.ty};animation-duration:${cfg.dur};animation-delay:${cfg.delay};`;
    col.appendChild(el);
  });
}

/* ─── MODAL SYSTEM ───────────────────────────────────── */
function initModals() {
  const overlays = $$('.modal-overlay');
  const triggers = $$('[data-modal]');
  let lastFocus  = null;

  /* Which elements can receive focus inside a modal */
  const getFocusable = el => [
    ...el.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')
  ];

  /* ── OPEN ── */
  const openModal = id => {
    const overlay = document.getElementById(id);
    if (!overlay) return;

    lastFocus = document.activeElement;

    /* Step 1: remove hidden so the element is in the DOM */
    overlay.removeAttribute('hidden');
    overlay.style.display = 'flex';

    /* Step 2: force reflow, then add class to trigger CSS transition */
    // eslint-disable-next-line no-unused-expressions
    overlay.offsetHeight;
    overlay.classList.add('modal-open');

    /* Prevent background scroll without touching body.style.overflow
       (which conflicts with the nav hamburger) */
    document.documentElement.style.overflow = 'hidden';

    /* Focus management */
    const focusable = getFocusable(overlay);
    if (focusable.length) setTimeout(() => focusable[0].focus(), 80);
  };

  /* ── CLOSE ── */
  const closeModal = overlay => {
    if (!overlay || !overlay.classList.contains('modal-open')) return;

    overlay.classList.remove('modal-open');
    document.documentElement.style.overflow = '';

    const onEnd = () => {
      overlay.style.display = '';
      overlay.setAttribute('hidden', '');
      const body = overlay.querySelector('.modal-body');
      if (body) body.scrollTop = 0;
    };

    /* If transitions are active wait for them; otherwise hide immediately */
    const duration = parseFloat(getComputedStyle(overlay).transitionDuration) * 1000;
    if (duration > 0) {
      overlay.addEventListener('transitionend', onEnd, { once: true });
    } else {
      onEnd();
    }

    if (lastFocus && document.body.contains(lastFocus)) {
      setTimeout(() => lastFocus.focus(), 50);
    }
  };

  /* ── TRIGGERS ── */
  triggers.forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      openModal(trigger.dataset.modal);
    });
  });

  /* ── BACKDROP CLICK ── */
  overlays.forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  /* ── CLOSE BUTTONS ── */
  $$('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
  });

  /* ── KEYBOARD ── */
  document.addEventListener('keydown', e => {
    const open = overlays.find(o => o.classList.contains('modal-open'));
    if (!open) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal(open);
      return;
    }

    if (e.key === 'Tab') {
      const items = getFocusable(open);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last  = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
}

/* ══════════════════════════════════════════════════════
   INIT — runs after DOM is ready
══════════════════════════════════════════════════════ */
function init() {
  initTheme();
  initNav();
  initSmoothAnchors();
  initScrollReveal();
  initCounters();
  initBackToTop();
  initForm();
  initFooter();
  initCardTilt();
  initJusticeParallax();
  initHeroEntrance();
  initProgressBar();
  initSparkles();
  initModals();        /* ← now defined above, always safe to call */
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
