document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const headerInner = document.querySelector('.header-inner');
  const nav = document.querySelector('.nav');
  const transitionStorageKey = 'piteza-page-transition';
  const transitionDuration = 1260;
  const transitionExitDelay = 900;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let navigationInProgress = false;
  const transitionCopyByPage = {
    'index.html': {
      title: 'Возвращаемся на главную',
      text: 'Сейчас мягко вернём вас к главной странице и знакомству с Piteza.'
    },
    'puppies.html': {
      title: 'Открываем каталог щенков',
      text: 'Подготавливаем спокойный переход к малышам, фото и актуальным статусам.'
    },
    'puppy-single.html': {
      title: 'Покажем щенка ближе',
      text: 'Сейчас откроем карточку малыша с деталями, характером и фотографиями.'
    },
    'breed-maltipoo.html': {
      title: 'Переходим к породе',
      text: 'Собираем всё важное о мальтипу в одном плавном и спокойном переходе.'
    },
    'about.html': {
      title: 'Заглянем в питомник',
      text: 'Открываем страницу о питомнике, родителях и нашем деликатном подходе.'
    },
    'how-to-buy.html': {
      title: 'Покажем путь домой',
      text: 'Сейчас проведём вас по этапам выбора, бронирования и переезда щенка.'
    },
    'stories.html': {
      title: 'Открываем истории семей',
      text: 'Переносим вас к тёплым отзывам и живым историям выпускников Piteza.'
    },
    'contact.html': {
      title: 'Связь уже рядом',
      text: 'Открываем контакты и консультацию, чтобы вы могли написать нам без лишних шагов.'
    }
  };

  const pawSvg = `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="19" cy="18" r="8"></circle>
      <circle cx="45" cy="18" r="8"></circle>
      <circle cx="13" cy="35" r="8"></circle>
      <circle cx="51" cy="35" r="8"></circle>
      <path d="M32 28c-9 0-16 8-16 16 0 6 4 10 10 10h12c6 0 10-4 10-10 0-8-7-16-16-16Z"></path>
    </svg>
  `;

  const buildTransitionLayer = () => {
    let layer = document.querySelector('.page-transition');
    if (layer) return layer;

    layer = document.createElement('div');
    layer.className = 'page-transition';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = `
      <div class="page-transition__veil"></div>
      <div class="page-transition__paws">
        <span class="page-transition__paw paw-a">${pawSvg}</span>
        <span class="page-transition__paw paw-b">${pawSvg}</span>
        <span class="page-transition__paw paw-c">${pawSvg}</span>
        <span class="page-transition__paw paw-d">${pawSvg}</span>
      </div>
      <div class="page-transition__card">
        <div class="page-transition__glow"></div>
        <div class="page-transition__medallion">
          <img src="assets/images/brand/pit-mascot.png" alt="" decoding="async"/>
        </div>
        <p class="page-transition__eyebrow">PITEZA PREMIUM KENNEL</p>
        <h3 class="page-transition__title">Переходим дальше</h3>
        <p class="page-transition__text">Лапки уже ведут вас к следующей странице.</p>
      </div>
    `;

    document.body.appendChild(layer);
    document.body.classList.add('has-page-transition');
    return layer;
  };

  const setTransitionCopy = ({ label, href } = {}) => {
    const layer = buildTransitionLayer();
    const title = layer.querySelector('.page-transition__title');
    const text = layer.querySelector('.page-transition__text');
    const targetPath = href ? new URL(href, window.location.href).pathname.split('/').pop() || 'index.html' : '';
    const cleanLabel = label ? label.replace(/\s+/g, ' ').trim() : '';
    const preset = transitionCopyByPage[targetPath];

    title.textContent = preset?.title || cleanLabel || 'Продолжаем знакомство';
    text.textContent = preset?.text || 'Сейчас мягко переведём вас к следующему разделу Piteza.';
  };

  const readTransitionPayload = () => {
    const raw = sessionStorage.getItem(transitionStorageKey);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      if (typeof parsed.at !== 'number' || Date.now() - parsed.at > 5000) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  };

  const clearTransitionState = () => {
    sessionStorage.removeItem(transitionStorageKey);
    document.body.classList.remove('is-page-transitioning', 'is-page-entering');
    navigationInProgress = false;
  };

  const playEnterTransition = () => {
    if (reducedMotionQuery.matches) {
      clearTransitionState();
      return;
    }

    const payload = readTransitionPayload();
    if (!payload) {
      clearTransitionState();
      return;
    }

    setTransitionCopy(payload);
    document.body.classList.add('is-page-entering');
    window.setTimeout(() => {
      document.body.classList.remove('is-page-entering');
      sessionStorage.removeItem(transitionStorageKey);
    }, transitionDuration);
  };

  const isNavigableHtmlPage = (url) => {
    const current = new URL(window.location.href);
    if (url.origin !== current.origin) return false;
    if (/^(mailto:|tel:|javascript:)/i.test(url.href)) return false;
    if (url.pathname === current.pathname && url.search === current.search) return false;

    return (
      url.pathname === '/' ||
      url.pathname.endsWith('.html') ||
      !url.pathname.split('/').pop().includes('.')
    );
  };

  const startPageTransition = (link) => {
    if (navigationInProgress) return;
    navigationInProgress = true;

    const payload = {
      at: Date.now(),
      href: link.href,
      label: link.textContent || link.getAttribute('aria-label') || 'Переходим дальше'
    };

    sessionStorage.setItem(transitionStorageKey, JSON.stringify(payload));
    setTransitionCopy(payload);
    document.body.classList.add('is-page-transitioning');

    window.setTimeout(() => {
      window.location.href = link.href;
    }, transitionExitDelay);
  };

  buildTransitionLayer();
  playEnterTransition();

  document.addEventListener('click', (event) => {
    if (
      reducedMotionQuery.matches ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest('a[href]');
    if (!link) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;

    const url = new URL(link.href, window.location.href);
    if (!isNavigableHtmlPage(url)) return;

    event.preventDefault();
    startPageTransition(link);
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) clearTransitionState();
  });

  // Mobile navigation, preserving the original header structure.
  if (headerInner && nav && !document.querySelector('.nav-toggle')) {
    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Открыть меню');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span></span>';
    headerInner.insertBefore(toggle, nav);

    const closeMenu = () => {
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Открыть меню');
    };

    toggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  // Sticky header state.
  const syncHeader = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
  };
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  // Smooth premium FAQ accordion.
  const setAnswerHeight = (item) => {
    const answer = item.querySelector('.faq-answer');
    if (!answer) return;
    if (item.classList.contains('open')) {
      answer.style.maxHeight = `${answer.scrollHeight + 24}px`;
    } else {
      answer.style.maxHeight = '0px';
    }
  };

  document.querySelectorAll('.faq-item').forEach((item, index) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
    answer.setAttribute('aria-hidden', item.classList.contains('open') ? 'false' : 'true');
    if (index === 0 && !item.classList.contains('open')) item.classList.add('open');
    setAnswerHeight(item);

    btn.addEventListener('click', () => {
      const isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      answer.setAttribute('aria-hidden', String(!isOpen));
      setAnswerHeight(item);
    });
  });

  window.addEventListener('resize', () => {
    document.querySelectorAll('.faq-item.open').forEach(setAnswerHeight);
  }, { passive: true });

  // Puppy detail gallery thumbnails.
  const mainImage = document.querySelector('[data-gallery-main]');
  const counter = document.querySelector('[data-gallery-count]');
  const thumbs = [...document.querySelectorAll('[data-gallery-thumb]')];
  if (mainImage && thumbs.length) {
    thumbs.forEach((thumb, idx) => {
      thumb.addEventListener('click', () => {
        thumbs.forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImage.src = thumb.dataset.galleryThumb;
        mainImage.alt = thumb.alt || mainImage.alt;
        if (counter) counter.textContent = `${idx + 1} / ${thumbs.length}`;
      });
    });
  }

  // Scroll reveal without changing page layout.
  const revealTargets = document.querySelectorAll([
    '.hero-panel', '.page-hero', '.consult-hero', '.story-feature', '.product-card',
    '.catalog-card', '.info-card', '.soft-card', '.mini-stat', '.benefit-item', '.story-preview',
    '.mosaic-card', '.video-card', '.step-card', '.faq-item', '.contact-card', '.detail-box',
    '.parent-card', '.person-card', '.kpi-card', '.footer-cta', '.split-banner', '.duo-banner',
    '.gallery-panel', '.form-panel', '.contact-stack', '.map-panel', '.reserve-band'
  ].join(','));

  revealTargets.forEach((el, index) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${Math.min(index % 5, 4) * 42}ms`;
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }

  // Catalog search.
  const searchInput = document.querySelector('.search-field input');
  const searchableCards = [...document.querySelectorAll('.catalog-card, .product-card')];
  if (searchInput && searchableCards.length) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      searchableCards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // Photo effects disabled: images stay static; no lightbox, zoom or parallax.

  // Static-site form feedback.
  document.querySelectorAll('form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const button = form.querySelector('button[type="submit"], .cta-dark, .cta-outline');
      if (button) {
        button.dataset.originalText = button.dataset.originalText || button.textContent;
        button.textContent = 'Заявка принята';
        button.setAttribute('disabled', 'disabled');
      }
      let success = form.querySelector('.fx-form-success');
      if (!success) {
        success = document.createElement('div');
        success.className = 'fx-form-success';
        success.textContent = 'Спасибо. Мы свяжемся с вами и уточним детали подбора щенка.';
        form.appendChild(success);
      }
      success.classList.add('is-visible');
    });
  });
});
