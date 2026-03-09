/* ============================================================
   LIZA.PRINT — Portfolio Script
   ============================================================ */

/* ---- CUSTOM CURSOR ---- */
(function initCursor() {
  const dot  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let activated = false;
  let mx = -100, my = -100;
  let rx = -100, ry = -100;

  /* Wait for a real mouse move (not a synthetic touch event).
     Synthetic touch→mouse events fire at the tap point but have movementX/Y === 0
     and no buttons, so we filter them out. */
  function onFirstMouseMove(e) {
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
    if (!activated) {
      activated = true;
      document.body.classList.add('has-mouse-cursor');
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    }
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  }

  /* Hide elements initially; they become visible only after mouse confirmed */
  dot.style.opacity  = '0';
  ring.style.opacity = '0';

  document.addEventListener('mousemove', onFirstMouseMove);

  (function animateRing() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  })();

  const hoverTargets = 'a, button, .pcard, .scard, .fan-strip, .btn-cta, .contact__link';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => {
      dot.classList.add('hover');
      ring.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      dot.classList.remove('hover');
      ring.classList.remove('hover');
    });
  });
})();

/* ---- PANTONE FAN ---- */
(function initFan() {
  const fanEl = document.getElementById('fan');
  if (!fanEl) return;

  const STRIP_COUNT  = 52;
  const TOTAL_DEG    = 136;
  const START_DEG    = -TOTAL_DEG / 2;

  /* Pantone-like color spectrum */
  const COLOR_STOPS = [
    [0,   86, 46],   // Red
    [14,  90, 50],   // Red-Orange
    [28,  92, 52],   // Orange
    [44,  96, 52],   // Amber
    [55,  96, 52],   // Yellow
    [74,  74, 44],   // Yellow-Green
    [118, 68, 38],   // Green
    [152, 70, 36],   // Emerald
    [182, 72, 38],   // Teal
    [204, 86, 44],   // Cyan
    [222, 82, 50],   // Sky Blue
    [240, 78, 52],   // Blue
    [255, 72, 52],   // Indigo
    [272, 68, 52],   // Violet
    [292, 65, 48],   // Purple
    [312, 72, 50],   // Magenta
    [336, 78, 50],   // Pink
    [354, 86, 48],   // Rose → Red
  ];

  const PANTONE_CODES = [
    '485','488','159','151','123','396','376','339',
    '3268','306','284','2915','072','2748','521','2375',
    '219','185','205','210','001','663','Cool Gray 1',
    'Warm Gray 3','877','Gold','872','Black 6'
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function spectrumColor(i) {
    const t  = (i / (STRIP_COUNT - 1)) * (COLOR_STOPS.length - 1);
    const lo = Math.min(Math.floor(t), COLOR_STOPS.length - 2);
    const f  = t - lo;
    const h  = lerp(COLOR_STOPS[lo][0], COLOR_STOPS[lo + 1][0], f);
    const s  = lerp(COLOR_STOPS[lo][1], COLOR_STOPS[lo + 1][1], f);
    const l  = lerp(COLOR_STOPS[lo][2], COLOR_STOPS[lo + 1][2], f);
    return `hsl(${h.toFixed(1)},${s.toFixed(1)}%,${l.toFixed(1)}%)`;
  }

  const center = (STRIP_COUNT - 1) / 2;

  for (let i = 0; i < STRIP_COUNT; i++) {
    const angle = START_DEG + (TOTAL_DEG / (STRIP_COUNT - 1)) * i;
    const color = spectrumColor(i);
    const codeIdx = Math.round(i / (STRIP_COUNT - 1) * (PANTONE_CODES.length - 1));

    /* Center-out delay: center strips open first, edges open last.
       This ensures both the leftmost and rightmost strips fan out simultaneously
       instead of one appearing to "lag" behind the others. */
    const distFromCenter = Math.abs(i - center);
    const delay = Math.round((distFromCenter / center) * 460);

    const strip = document.createElement('div');
    strip.className = 'fan-strip';
    strip.style.setProperty('--angle', angle.toFixed(2) + 'deg');
    strip.style.setProperty('--delay', delay + 'ms');
    strip.style.background = color;
    /* Strips closer to center sit on top so edges slide out from underneath cleanly */
    strip.style.zIndex = Math.round(STRIP_COUNT - distFromCenter);

    /* White tip */
    const tip = document.createElement('div');
    tip.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 22px;
      background: white;
      border-radius: 5px 5px 0 0;
    `;

    const lbl = document.createElement('div');
    lbl.className = 'fan-strip__lbl';
    lbl.textContent = PANTONE_CODES[codeIdx] || '';

    strip.appendChild(tip);
    strip.appendChild(lbl);
    fanEl.appendChild(strip);
  }

  /* Open fan on load */
  requestAnimationFrame(() => {
    setTimeout(() => fanEl.classList.add('fan--open'), 250);
  });

  /* Hover peek effect — bring hovered strip & neighbours to front */
  fanEl.addEventListener('mouseover', e => {
    const strip = e.target.closest('.fan-strip');
    if (!strip) return;
    const siblings = Array.from(fanEl.children);
    const idx = siblings.indexOf(strip);
    siblings.forEach((s, i) => {
      const dist = Math.abs(i - idx);
      s.style.zIndex = STRIP_COUNT - dist;
    });
  });
})();

/* ---- SCROLL REVEAL (Intersection Observer) ---- */
(function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), +delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });

  /* Stagger hero text */
  document.querySelectorAll('.hero__text .reveal').forEach((el, i) => {
    el.dataset.delay = i * 110;
  });

  /* Stagger siblings in the same grid */
  document.querySelectorAll('.works__grid, .services__grid').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.classList.add('reveal');
      child.dataset.delay = i * 75;
    });
  });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
})();

/* ---- NAV SCROLL STATE ---- */
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ---- MOBILE BURGER ---- */
(function initBurger() {
  const burger = document.getElementById('burger');
  const menu   = document.getElementById('mobile-menu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  menu.querySelectorAll('.mm-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

/* ---- PRODUCT CARD 3D TILT ---- */
(function initCardTilt() {
  document.querySelectorAll('.pcard').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 14;
      card.style.transform = `translateY(-6px) rotateX(${(-y).toFixed(2)}deg) rotateY(${x.toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ---- ANIMATED COUNTER (About stats) ---- */
(function initCounters() {
  const nums = document.querySelectorAll('.stat__num[data-target]');
  if (!nums.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = +el.dataset.target;
      const dur    = 1400;
      const start  = performance.now();

      function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

      (function tick(now) {
        const t   = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(ease(t) * target);
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target;
      })(start);

      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(el => io.observe(el));
})();

/* ---- SEAMLESS TICKER ---- */
(function initTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const items = ['ФАКТУРА', 'ТИПОГРАФИЯ', 'ПОЛИГРАФИЯ', 'ДИЗАЙН', 'ПЕЧАТЬ', 'PANTONE', 'ЦВЕТ'];
  const SEP = '✦';

  /* Build one "cycle" of content */
  function buildCycle() {
    const frag = document.createDocumentFragment();
    items.forEach(text => {
      const span = document.createElement('span');
      span.textContent = text;
      frag.appendChild(span);

      const sep = document.createElement('span');
      sep.className = 'ticker__sep';
      sep.textContent = SEP;
      frag.appendChild(sep);
    });
    return frag;
  }

  /* Append enough copies that the loop is invisible.
     We use 4 copies: animation moves exactly -25% (= 1 copy width) per cycle. */
  for (let i = 0; i < 4; i++) track.appendChild(buildCycle());

  /* Measure one cycle width after paint and set animation distance.
     Double rAF ensures the browser has done layout before we measure. */
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const cycleW = track.scrollWidth / 4;
    if (cycleW > 0) {
      track.style.setProperty('--ticker-shift', `-${cycleW}px`);
      track.style.animationDuration = (cycleW / 55) + 's'; /* ~55px/s */
    }
  }));
})();

/* ---- SMOOTH ANCHOR SCROLL (override for older browsers) ---- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---- PHOTO GALLERY ---- */
(function initGallery() {
  const GALLERIES = {
    mugs: {
      title: 'кружка с принтом',
      photos: [
        { src: 'my_works/Кружки/1_Кружка.jpg',             alt: 'Дизайн кружки' },
        { src: 'my_works/Кружки/1_Кружка-мокап.png',       alt: 'Кружка — мокап' },
        { src: 'my_works/Кружки/1_ Кружка_другой_вид.png', alt: 'Кружка — другой вид' },
      ]
    },
    postcard: {
      title: 'открытки',
      photos: [
        { src: 'my_works/Фольгирование/Открытка_котики.jpg', alt: 'Открытка — дизайн' },
        { src: 'my_works/Фольгирование/Открытка_котики.png', alt: 'Открытка с фольгой' },
      ]
    },
    badges: {
      title: 'значки',
      photos: [
        { src: 'my_works/Значки/стандарт глянец.png',      alt: 'Значок — стандарт глянец' },
        { src: 'my_works/Значки/сахарная ламинация.png',  alt: 'Значок — сахарная ламинация' },
      ]
    },
    magnets: {
      title: 'магнитики',
      photos: [
        { src: 'my_works/магнитики/photo_1.png',     alt: 'Магнитик' },
        { src: 'my_works/магнитики/photo_2.png',     alt: 'Магнитик' },
        { src: 'my_works/магнитики/with_bronze.png', alt: 'Магнитик с бронзой' },
        { src: 'my_works/магнитики/with_bronze_2.png', alt: 'Магнитик с бронзой' },
      ]
    },
    shoppers: {
      title: 'шопперы',
      photos: [
        { src: 'my_works/шопперы/mili_shopper.png',    alt: 'Шоппер' },
        { src: 'my_works/шопперы/milli shopper_2.png', alt: 'Шоппер' },
      ]
    },
    notebooks: {
      title: 'блокнот с принтом / тетради',
      photos: [
        { src: 'my_works/блокноты-тетради/photo_1.png', alt: 'Блокнот с принтом' },
        { src: 'my_works/блокноты-тетради/photo_2.png', alt: 'Блокнот с принтом' },
      ]
    }
  };

  const modal    = document.getElementById('gallery-modal');
  const dialog   = document.getElementById('gallery-dialog');
  const bodyEl   = document.getElementById('gallery-body');
  const titleEl  = document.getElementById('gallery-title');
  const countEl  = document.getElementById('gallery-count');
  const closeBtn = document.getElementById('gallery-close');
  const zoomEl   = document.getElementById('gallery-zoom');
  const zoomImg  = document.getElementById('gallery-zoom-img');
  const zoomCtr  = document.getElementById('gallery-zoom-counter');
  const zoomBack = document.getElementById('gallery-zoom-back');
  const zoomPrev = document.getElementById('gallery-zoom-prev');
  const zoomNext = document.getElementById('gallery-zoom-next');
  if (!modal) return;

  let photos  = [];
  let zoomIdx = 0;

  /* ---- Open collage ---- */
  function openGallery(key) {
    const data = GALLERIES[key];
    if (!data) return;
    photos = data.photos;
    titleEl.textContent = data.title;
    countEl.textContent = photos.length + '\u00a0фото';
    buildGrid();
    zoomEl.classList.remove('open');
    bodyEl.scrollTop = 0;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    /* Preload all images instantly for seamless zoom switching */
    photos.forEach(p => { const i = new Image(); i.src = p.src; });
  }

  /* ---- Close ---- */
  function closeGallery() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---- Build photo collage grid ---- */
  function buildGrid() {
    bodyEl.innerHTML = '';
    const grid  = document.createElement('div');
    grid.className = 'gallery-grid';
    const count = photos.length;

    /* Single photo: 1 column; 2 even photos: side by side; odd (3,5…): first full-width */
    if (count === 1) grid.style.gridTemplateColumns = '1fr';

    photos.forEach((p, i) => {
      const item = document.createElement('div');
      item.className = 'gallery-photo';
      if (count % 2 !== 0 && count > 1 && i === 0) item.classList.add('gallery-photo--full');

      const img       = document.createElement('img');
      img.src         = p.src;
      img.alt         = p.alt;
      img.loading     = i < 2 ? 'eager' : 'lazy';
      img.decoding    = 'async';

      item.appendChild(img);
      item.addEventListener('click', () => openZoom(i));
      grid.appendChild(item);
    });

    bodyEl.appendChild(grid);
  }

  /* ---- Zoom: single photo view ---- */
  function openZoom(idx) {
    zoomIdx = Math.max(0, Math.min(idx, photos.length - 1));
    setZoomImg(true);
    zoomEl.classList.add('open');
  }

  function setZoomImg(instant) {
    const p = photos[zoomIdx];
    if (instant) {
      zoomImg.src = p.src;
      zoomImg.alt = p.alt;
    } else {
      zoomImg.classList.add('fading');
      setTimeout(() => {
        zoomImg.src = p.src;
        zoomImg.alt = p.alt;
        if (zoomImg.complete) zoomImg.classList.remove('fading');
        else zoomImg.onload = () => zoomImg.classList.remove('fading');
      }, 150);
    }
    zoomCtr.textContent = (zoomIdx + 1) + '\u202f/\u202f' + photos.length;
    zoomPrev.disabled   = zoomIdx === 0;
    zoomNext.disabled   = zoomIdx === photos.length - 1;
  }

  /* ---- Controls ---- */
  closeBtn.addEventListener('click', closeGallery);
  zoomBack.addEventListener('click', () => zoomEl.classList.remove('open'));
  zoomPrev.addEventListener('click', () => { zoomIdx--; setZoomImg(); });
  zoomNext.addEventListener('click', () => { zoomIdx++; setZoomImg(); });

  /* Backdrop click closes gallery */
  modal.addEventListener('click', e => { if (e.target === modal) closeGallery(); });

  /* Keyboard */
  document.addEventListener('keydown', e => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') {
      if (zoomEl.classList.contains('open')) zoomEl.classList.remove('open');
      else closeGallery();
      return;
    }
    if (!zoomEl.classList.contains('open')) return;
    if (e.key === 'ArrowLeft'  && zoomIdx > 0)                  { zoomIdx--; setZoomImg(); }
    if (e.key === 'ArrowRight' && zoomIdx < photos.length - 1)  { zoomIdx++; setZoomImg(); }
  });

  /* Touch swipe in zoom view (left/right = prev/next) */
  let tx0 = 0, ty0 = 0;
  zoomEl.addEventListener('touchstart', e => {
    tx0 = e.touches[0].clientX;
    ty0 = e.touches[0].clientY;
  }, { passive: true });
  zoomEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx0;
    const dy = e.changedTouches[0].clientY - ty0;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0 && zoomIdx < photos.length - 1) { zoomIdx++; setZoomImg(); }
      else if (dx > 0 && zoomIdx > 0)            { zoomIdx--; setZoomImg(); }
    }
  }, { passive: true });

  /* Swipe down to close the modal (mobile bottom sheet) */
  let sheetY0 = 0;
  dialog.addEventListener('touchstart', e => {
    sheetY0 = e.touches[0].clientY;
  }, { passive: true });
  dialog.addEventListener('touchend', e => {
    if (zoomEl.classList.contains('open')) return; /* zoom handles its own swipe */
    const dy = e.changedTouches[0].clientY - sheetY0;
    if (dy > 72) closeGallery();
  }, { passive: true });

  /* Click on gallery-enabled product cards */
  document.querySelectorAll('.pcard--has-gallery').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.gallery;
      if (key && GALLERIES[key]) openGallery(key);
    });
  });
})();
