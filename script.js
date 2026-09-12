/* ═══════════════════════════════════════════════════════
   PROF. SAMUEL CHISA DIKE & CO. — OMUORDU CHAMBERS
   Interactive Script  |  v1.0
═══════════════════════════════════════════════════════ */

'use strict';

/* ─── UTILITY ───────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─── THEME TOGGLE ──────────────────────────────────── */
const initTheme = () => {
  const toggle  = $('#themeToggle');
  const html    = document.documentElement;
  const STORAGE = 'omuordu-theme';

  const saved = localStorage.getItem(STORAGE);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (prefersDark ? 'dark' : 'light');

  html.setAttribute('data-theme', initial);

  toggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE, next);

    // subtle animation feedback
    toggle.style.transform = 'rotate(360deg) scale(1.2)';
    setTimeout(() => { toggle.style.transform = ''; }, 400);
  });

  // Listen for OS-level changes
  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', e => {
      if (!localStorage.getItem(STORAGE)) {
        html.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
};

/* ─── NAVIGATION ────────────────────────────────────── */
const initNav = () => {
  const header  = $('#siteHeader');
  const hamburger = $('#hamburger');
  const navLinks  = $('#navLinks');
  const overlay   = $('#mobileOverlay');
  const links     = $$('.nav-link');
  const sections  = $$('section[id]');

  /* Scroll state */
  let lastY = 0;
  let ticking = false;

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        header.classList.toggle('scrolled', y > 20);
        lastY = y;
        ticking = false;

        // Active nav link tracking
        let current = '';
        sections.forEach(sec => {
          const top = sec.offsetTop - 120;
          if (y >= top) current = sec.id;
        });
        links.forEach(link => {
          const href = link.getAttribute('href')?.replace('#', '');
          link.classList.toggle('active', href === current);
        });
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  /* Hamburger */
  const closeMenu = () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    overlay.classList.remove('show');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    hamburger.classList.add('open');
    navLinks.classList.add('open');
    overlay.classList.add('show');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  overlay?.addEventListener('click', closeMenu);

  // Close on link click
  links.forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) closeMenu();
    });
  });

  // Keyboard escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) closeMenu();
  });
};

/* ─── SCROLL REVEAL ─────────────────────────────────── */
const initScrollReveal = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Don't unobserve — let it stay visible once revealed
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px',
  });

  $$('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
  });
};

/* ─── COUNTER ANIMATION ─────────────────────────────── */
const initCounters = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animate = (el, target, duration = 1800) => {
    if (prefersReducedMotion) { el.textContent = target; return; }

    const start = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOut(progress) * target);
      el.textContent = value.toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        animate(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  $$('[data-count]').forEach(el => observer.observe(el));
};

/* ─── BACK TO TOP ───────────────────────────────────── */
const initBackToTop = () => {
  const btn = $('#backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

/* ─── CONTACT FORM — Formspree API ─────────────────── */
const initForm = () => {
  const form    = $('#contactForm');
  const btn     = $('#submitBtn');
  const success = $('#formSuccess');
  const error   = $('#formError');
  const errorMsg= $('#formErrorMsg');
  if (!form) return;

  // ── Formspree endpoint from data attribute ──────────
  // To use YOUR own Formspree form:
  //   1. Go to https://formspree.io  →  sign up free
  //   2. Create a new form (use samuel.dike@nigerianbar.org as the email)
  //   3. Copy your form ID  (looks like: xpwzgdwj)
  //   4. Replace the endpoint below or update data-formspree in the HTML
  const ENDPOINT = form.dataset.formspree
                || 'https://formspree.io/f/xpwzgdwj';

  // ── Helpers ─────────────────────────────────────────
  const setBtnState = (state) => {
    const states = {
      idle:    { html: '<i class="fa-regular fa-paper-plane" aria-hidden="true"></i> Send Message', disabled: false },
      loading: { html: '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Sending…',  disabled: true  },
      sent:    { html: '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Message Sent!', disabled: true  },
      error:   { html: '<i class="fa-regular fa-paper-plane" aria-hidden="true"></i> Try Again',   disabled: false },
    };
    const s = states[state] || states.idle;
    btn.innerHTML  = s.html;
    btn.disabled   = s.disabled;
  };

  const hideMessages = () => {
    success.hidden = true;
    error.hidden   = true;
  };

  // ── Submit handler ───────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    // HTML5 validation check
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setBtnState('loading');

    try {
      const data = new FormData(form);

      const res = await fetch(ENDPOINT, {
        method:  'POST',
        body:    data,
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        // ✅ Success
        setBtnState('sent');
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        form.reset();
        clearValidationStyles();

        // Reset button after 6 seconds
        setTimeout(() => {
          setBtnState('idle');
          success.hidden = true;
        }, 6000);

      } else {
        // ❌ Server-side Formspree error (e.g. form not activated yet)
        const body = await res.json().catch(() => ({}));
        const msg  = body?.errors?.map(e => e.message).join(', ')
                  || `Server error (${res.status}). Please email us directly.`;
        showError(msg);
      }

    } catch (err) {
      // ❌ Network error (offline, CORS, etc.)
      showError('Network error — please check your connection or call us directly on 0814 331 0952.');
    }
  });

  const showError = (msg) => {
    setBtnState('error');
    errorMsg.textContent = msg;
    error.hidden = false;
    error.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // ── Live per-field validation styling ───────────────
  const clearValidationStyles = () => {
    $$('input, select, textarea', form).forEach(f => {
      f.style.borderColor = '';
    });
  };

  $$('input, select, textarea', form).forEach(field => {
    // Skip hidden fields
    if (field.type === 'hidden' || field.style.display === 'none') return;

    field.addEventListener('blur', () => {
      if (field.required && !field.value.trim()) {
        field.style.borderColor = '#c0392b';
      } else if (field.value.trim()) {
        field.style.borderColor = 'var(--gold-500)';
      }
    });

    field.addEventListener('input', () => {
      if (field.value.trim()) {
        field.style.borderColor = '';
      }
    });
  });
};

/* ─── FOOTER YEAR ───────────────────────────────────── */
const initFooter = () => {
  const yearEl = $('#footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

/* ─── SMOOTH ANCHOR OFFSET ──────────────────────────── */
const initSmoothAnchors = () => {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const headerH = 72;
      const y = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
};

/* ─── CARD TILT EFFECT ──────────────────────────────── */
const initCardTilt = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const cards = $$('.practice-card, .why-card, .visual-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rx =  dy * 5;
      const ry = -dx * 5;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
};

/* ─── JUSTICE FIGURE MOUSE PARALLAX ────────────────── */
const initJusticeParallax = () => {
  const figure = $('.justice-figure');
  if (!figure) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let raf;
  document.addEventListener('mousemove', e => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      figure.style.transform = `translateY(calc(-50% + ${dy * 12}px)) translateX(${dx * 8}px)`;
    });
  });
};

/* ─── HERO LOAD SEQUENCE ────────────────────────────── */
const initHeroEntrance = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    $$('.reveal-up[data-delay]').forEach(el => el.classList.add('visible'));
    return;
  }

  // Stagger hero elements on load
  $$('.hero .reveal-up').forEach((el, i) => {
    const delay = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => el.classList.add('visible'), 300 + delay);
  });
};

/* ─── ACTIVE SECTION INDICATOR ──────────────────────── */
const initProgressBar = () => {
  const bar = document.createElement('div');
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 2px;
    background: linear-gradient(90deg, #c9a84c, #e8c96a);
    z-index: 9999;
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 0.1s linear;
    pointer-events: none;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress  = docHeight > 0 ? window.scrollY / docHeight : 0;
    bar.style.transform = `scaleX(${progress})`;
    bar.style.width = '100%';
  }, { passive: true });
};

/* ─── SPARKLE PARTICLES (Lady Justice) ─────────────── */
const initSparkles = () => {
  const col = $('.hero-image-col');
  if (!col) return;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;
  // Only add sparkles on desktop where the image column is visible
  if (window.innerWidth <= 768) return;

  const configs = [
    { left:'18%', top:'12%', tx:'-12px', ty:'-38px', dur:'4.2s', delay:'0s'   },
    { left:'75%', top:'8%',  tx:'14px',  ty:'-44px', dur:'3.8s', delay:'.6s'  },
    { left:'88%', top:'35%', tx:'18px',  ty:'-30px', dur:'5.1s', delay:'1.2s' },
    { left:'82%', top:'62%', tx:'10px',  ty:'-42px', dur:'4.6s', delay:'.3s'  },
    { left:'10%', top:'55%', tx:'-16px', ty:'-36px', dur:'3.6s', delay:'1.8s' },
    { left:'22%', top:'78%', tx:'-8px',  ty:'-50px', dur:'4.9s', delay:'2.4s' },
    { left:'60%', top:'22%', tx:'12px',  ty:'-28px', dur:'4.4s', delay:'.9s'  },
    { left:'40%', top:'5%',  tx:'-6px',  ty:'-46px', dur:'3.9s', delay:'1.5s' },
    { left:'92%', top:'80%', tx:'16px',  ty:'-32px', dur:'5.3s', delay:'2.1s' },
    { left:'5%',  top:'28%', tx:'-18px', ty:'-40px', dur:'4.7s', delay:'3s'   },
    { left:'50%', top:'90%', tx:'4px',   ty:'-55px', dur:'4.1s', delay:'3.6s' },
    { left:'30%', top:'45%', tx:'-14px', ty:'-35px', dur:'5s',   delay:'4.2s' },
  ];

  configs.forEach(cfg => {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.style.cssText = `
      left:${cfg.left};top:${cfg.top};
      --tx:${cfg.tx};--ty:${cfg.ty};
      --dur:${cfg.dur};--delay:${cfg.delay};
      animation-duration:${cfg.dur};
      animation-delay:${cfg.delay};
    `;
    col.appendChild(el);
  });
};

/* ─── INIT ──────────────────────────────────────────── */
const init = () => {
  initTheme();
  initNav();
  initScrollReveal();
  initCounters();
  initBackToTop();
  initForm();
  initFooter();
  initSmoothAnchors();
  initCardTilt();
  initJusticeParallax();
  initHeroEntrance();
  initProgressBar();
  initSparkles();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
