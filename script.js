document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // LENIS — Smooth scroll
  // ==========================================
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.25,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function rafLoop(time) {
      lenis.raf(time);
      requestAnimationFrame(rafLoop);
    }
    requestAnimationFrame(rafLoop);

    if (window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // ==========================================
  // GSAP — Register plugin
  // ==========================================
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ==========================================
  // CUSTOM CURSOR
  // ==========================================
  const cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx, ty = cy;

    document.addEventListener('mousemove', e => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.remove('--hidden');
    });

    document.addEventListener('mouseleave', () => cursor.classList.add('--hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('--hidden'));

    (function moveCursor() {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(moveCursor);
    })();

    document.querySelectorAll('a, button, .service__item, .project__card, input, textarea, .header__toggle').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('--hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('--hover'));
    });
  } else if (cursor) {
    cursor.style.display = 'none';
  }

  // ==========================================
  // HEADER — Scroll + dark-hero behaviour
  // ==========================================
  const header = document.getElementById('header');

  function updateHeader() {
    const scrollY = window.scrollY;
    const heroH = document.getElementById('hero')?.offsetHeight || document.querySelector('.page-hero')?.offsetHeight || 0;

    if (scrollY > 60) {
      header.classList.add('--scrolled');
    } else {
      header.classList.remove('--scrolled');
    }

    if (scrollY < heroH * 0.75) {
      header.classList.add('--on-dark');
    } else {
      header.classList.remove('--on-dark');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // ==========================================
  // MOBILE NAV
  // ==========================================
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('headerNav');

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('--open');
    toggle.classList.toggle('--active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('--open');
      toggle.classList.remove('--active');
      document.body.style.overflow = '';
    });
  });

  // ==========================================
  // SMOOTH ANCHOR SCROLL
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      e.preventDefault();
      const target = document.querySelector(id);
      if (!target) return;
      if (lenis) {
        lenis.scrollTo(target, { offset: -80 });
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ==========================================
  // SPLIT TEXT — word-by-word animation
  // ==========================================
  function splitIntoWords(el) {
    const rawHTML = el.innerHTML;
    // Split on space, but preserve <br> and <strong> tags
    const parts = rawHTML.split(/(<br\s*\/?>|<strong>.*?<\/strong>)/gi);
    const result = parts.map(part => {
      if (/^<br/i.test(part)) return part;
      if (/^<strong>/i.test(part)) {
        const inner = part.replace(/<strong>(.*?)<\/strong>/i, '$1');
        const words = inner.trim().split(/\s+/);
        return words.map((w, i) =>
          `<span class="word"><span class="word-inner"><strong>${w}</strong></span></span>${i < words.length - 1 ? ' ' : ''}`
        ).join('');
      }
      return part.trim().split(/\s+/).filter(Boolean).map((w, i, arr) =>
        `<span class="word"><span class="word-inner">${w}</span></span>${i < arr.length - 1 ? ' ' : ''}`
      ).join('');
    }).join(' ');
    el.innerHTML = result;
  }

  document.querySelectorAll('.split-title').forEach(el => {
    splitIntoWords(el);
  });

  // Hero title fires immediately after a brief delay
  const heroTitle = document.querySelector('.hero .split-title');
  if (heroTitle) {
    setTimeout(() => heroTitle.classList.add('--visible'), 250);
  }

  // ==========================================
  // SCROLL TRIGGERS — split titles
  // ==========================================
  document.querySelectorAll('.split-title:not(.hero .split-title)').forEach(el => {
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => el.classList.add('--visible'),
      });
    } else {
      observeReveal(el, () => el.classList.add('--visible'));
    }
  });

  // ==========================================
  // SCROLL TRIGGERS — generic .reveal
  // ==========================================
  const reveals = document.querySelectorAll('.reveal');

  reveals.forEach((el, idx) => {
    // Stagger siblings of the same parent
    const siblings = [...el.parentElement.querySelectorAll(':scope > .reveal')];
    const sibIdx = siblings.indexOf(el);
    if (sibIdx > 0) el.style.transitionDelay = `${sibIdx * 0.1}s`;

    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter: () => el.classList.add('--visible'),
      });
    } else {
      observeReveal(el, () => el.classList.add('--visible'));
    }
  });

  // Fallback: IntersectionObserver when GSAP not loaded
  function observeReveal(el, cb) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { cb(); obs.unobserve(el); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    obs.observe(el);
  }

  // ==========================================
  // STAT COUNTERS
  // ==========================================
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      el.textContent = Math.floor(easeOutQuart(progress) * target) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll('.stat__number[data-target]').forEach(el => {
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 82%',
        once: true,
        onEnter: () => animateCounter(el),
      });
    } else {
      observeReveal(el, () => animateCounter(el));
    }
  });

  // Stats items stagger with GSAP
  if (window.gsap && window.ScrollTrigger) {
    gsap.utils.toArray('.stat__item').forEach((item, i) => {
      gsap.from(item, {
        opacity: 0,
        y: 40,
        duration: 0.9,
        delay: i * 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 85%', once: true },
      });
    });
  }

  // ==========================================
  // HERO PARALLAX (GSAP)
  // ==========================================
  const heroImg = document.querySelector('.hero__bg img');
  if (heroImg && window.gsap && window.ScrollTrigger) {
    gsap.to(heroImg, {
      yPercent: 25,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  // ==========================================
  // PROJECT CARDS — hover image scale (GSAP)
  // ==========================================
  if (window.gsap) {
    document.querySelectorAll('.project__card').forEach(card => {
      const img = card.querySelector('.image img');
      if (!img) return;
      card.addEventListener('mouseenter', () =>
        gsap.to(img, { scale: 1.06, duration: 0.7, ease: 'power2.out' }));
      card.addEventListener('mouseleave', () =>
        gsap.to(img, { scale: 1, duration: 0.7, ease: 'power2.out' }));
    });
  }

  // ==========================================
  // SERVICE ITEMS — stagger reveal
  // ==========================================
  if (window.gsap && window.ScrollTrigger) {
    gsap.utils.toArray('.service__item').forEach((item, i) => {
      gsap.from(item, {
        opacity: 0,
        x: -30,
        duration: 0.7,
        delay: i * 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 88%', once: true },
      });
    });
  }

  // ==========================================
  // CONTACT FORM
  // ==========================================
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = contactForm.querySelector('.btn-submit');
      const original = btn.textContent;
      btn.textContent = 'Message envoyé ✓';
      btn.style.backgroundColor = '#42ec8b';
      btn.style.borderColor = '#42ec8b';
      btn.style.color = '#1c1c1c';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.color = '';
        contactForm.reset();
      }, 3000);
    });
  }

  // ==========================================
  // FOOTER LINKS — stagger reveal
  // ==========================================
  if (window.gsap && window.ScrollTrigger) {
    gsap.utils.toArray('.footer__col').forEach((col, i) => {
      gsap.from(col, {
        opacity: 0,
        y: 24,
        duration: 0.7,
        delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true },
      });
    });
  }

});
