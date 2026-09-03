(function () {
  'use strict';

  var menu = document.querySelector('#mobile-menu');
  var menuLinks = document.querySelector('.navbar__menu');
  var navbar = document.querySelector('.navbar');
  var backToTop = document.querySelector('#back-to-top');

  function closeMobileMenu() {
    if (!menu || !menuLinks) return;
    menu.classList.remove('is-active');
    menuLinks.classList.remove('active');
    menu.setAttribute('aria-expanded', 'false');
  }

  if (menu && menuLinks) {
    menu.addEventListener('click', function () {
      var isOpen = menuLinks.classList.toggle('active');
      menu.classList.toggle('is-active', isOpen);
      menu.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    menuLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMobileMenu();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileMenu();
    });
  }

  // Smooth scroll for in-page anchors (native CSS handles it; JS offset fallback)
  // Note: prefersReducedMotion is declared below; guard with typeof-safe lookup.
  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    var id = anchor.getAttribute('href');
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', id);
  });

  // Sticky header shadow + back-to-top visibility
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (navbar) navbar.classList.toggle('scrolled', y > 10);
    if (backToTop) backToTop.classList.toggle('visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // Active-link highlighting via IntersectionObserver
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.navbar__links[href^="#"]'));
  var sections = navLinks
    .map(function (link) {
      var sel = link.getAttribute('href');
      try { return document.querySelector(sel); } catch (err) { return null; }
    })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0.01 }
    );
    sections.forEach(function (section) { observer.observe(section); });
  }

  // Service detail modals
  var modal = document.querySelector('#service-modal');
  var modalTitle = document.querySelector('#service-modal-title');
  var modalBody = document.querySelector('#service-modal-body');
  var lastFocused = null;

  function openModal(title, body) {
    if (!modal) return;
    lastFocused = document.activeElement;
    modalTitle.textContent = title;
    modalBody.textContent = body;
    modal.hidden = false;
    var closeBtn = modal.querySelector('.modal__close');
    if (closeBtn) closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  document.addEventListener('click', function (e) {
    var openBtn = e.target.closest('.service__btn');
    if (openBtn) {
      openModal(openBtn.getAttribute('data-modal-title') || 'Service', openBtn.getAttribute('data-modal-body') || '');
      return;
    }
    if (e.target.closest('[data-modal-close]')) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  // Pricing monthly/yearly toggle (persisted)
  var billingSwitch = document.querySelector('#billing-switch');
  var priceAmounts = Array.prototype.slice.call(document.querySelectorAll('.price__amount'));
  var BILLING_KEY = 'astech-billing';

  function applyBilling(yearly) {
    priceAmounts.forEach(function (el) {
      el.textContent = yearly ? el.getAttribute('data-yearly') : el.getAttribute('data-monthly');
    });
    if (billingSwitch) billingSwitch.setAttribute('aria-checked', yearly ? 'true' : 'false');
    try { localStorage.setItem(BILLING_KEY, yearly ? 'yearly' : 'monthly'); } catch (err) {}
  }

  if (billingSwitch) {
    var saved = null;
    try { saved = localStorage.getItem(BILLING_KEY); } catch (err) {}
    applyBilling(saved === 'yearly');
    billingSwitch.addEventListener('click', function () {
      applyBilling(billingSwitch.getAttribute('aria-checked') !== 'true');
    });
  }

  // Testimonials carousel: auto + manual controls
  var slides = Array.prototype.slice.call(document.querySelectorAll('.carousel__slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.carousel__dots button'));
  var prevBtn = document.querySelector('#carousel-prev');
  var nextBtn = document.querySelector('#carousel-next');
  var current = 0;
  var timer = null;
  var AUTOPLAY_MS = 6000;

  function showSlide(index) {
    if (!slides.length) return;
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === current);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
  }

  function restartAutoplay() {
    stopAutoplay();
    timer = setInterval(function () { showSlide(current + 1); }, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  if (slides.length) {
    if (prevBtn) prevBtn.addEventListener('click', function () { showSlide(current - 1); restartAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { showSlide(current + 1); restartAutoplay(); });
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(parseInt(dot.getAttribute('data-slide'), 10) || 0);
        restartAutoplay();
      });
    });
    var carousel = document.querySelector('.carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', stopAutoplay);
      carousel.addEventListener('mouseleave', restartAutoplay);
      carousel.addEventListener('focusin', stopAutoplay);
      carousel.addEventListener('focusout', restartAutoplay);
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' && slides.length) showSlide(current - 1);
      if (e.key === 'ArrowRight' && slides.length) showSlide(current + 1);
    });
    restartAutoplay();
    showSlide(0);
  }

  // FAQ accordion with aria-expanded
  var faqQuestions = Array.prototype.slice.call(document.querySelectorAll('.faq__question'));
  faqQuestions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var answer = btn.parentElement.querySelector('.faq__answer');
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      if (answer) answer.hidden = expanded;
    });
  });

  // Contact form: validation + success state (localStorage + mailto fallback)
  var contactForm = document.querySelector('#contact-form');
  var contactStatus = document.querySelector('#contact-status');

  function setError(input, errorEl, invalid) {
    if (!input) return;
    input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    if (errorEl) errorEl.hidden = !invalid;
  }

  function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function showStatus(el, message) {
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.querySelector('#cf-name');
      var email = document.querySelector('#cf-email');
      var service = document.querySelector('#cf-service');
      var message = document.querySelector('#cf-message');

      var nameBad = !name.value.trim() || name.value.trim().length < 2;
      var emailBad = !isEmail(email.value.trim());
      var serviceBad = !service.value;
      var messageBad = !message.value.trim() || message.value.trim().length < 10;

      setError(name, document.querySelector('#cf-name-error'), nameBad);
      setError(email, document.querySelector('#cf-email-error'), emailBad);
      setError(service, document.querySelector('#cf-service-error'), serviceBad);
      setError(message, document.querySelector('#cf-message-error'), messageBad);

      if (nameBad || emailBad || serviceBad || messageBad) {
        var firstBad = nameBad ? name : emailBad ? email : serviceBad ? service : message;
        if (firstBad.focus) firstBad.focus();
        return;
      }

      var lead = {
        name: name.value.trim(),
        email: email.value.trim(),
        service: service.value,
        message: message.value.trim(),
        createdAt: new Date().toISOString()
      };

      try {
        var key = 'astech-leads';
        var existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(lead);
        localStorage.setItem(key, JSON.stringify(existing));
      } catch (err) {}

      showStatus(contactStatus, 'Thanks ' + lead.name + "! Your enquiry was saved. We reply within one business day. Prefer email? Use the mailto link below.");
      contactForm.reset();

      // Mailto fallback: prefill provider email with lead details
      var mailto = document.querySelector('#contact-mailto');
      if (mailto) {
        var subject = encodeURIComponent('Website enquiry: ' + lead.service);
        var body = encodeURIComponent('Name: ' + lead.name + '\nEmail: ' + lead.email + '\nService: ' + lead.service + '\n\n' + lead.message);
        mailto.setAttribute('href', 'mailto:hello@astech.example?subject=' + subject + '&body=' + body);
      }
    });
  }

  // Newsletter signup (localStorage)
  var newsletterForm = document.querySelector('#newsletter-form');
  var newsletterStatus = document.querySelector('#newsletter-status');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.querySelector('#nl-email');
      var value = input.value.trim();
      if (!isEmail(value)) {
        showStatus(newsletterStatus, 'Please enter a valid email to subscribe.');
        input.focus();
        return;
      }
      try {
        var key = 'astech-newsletter';
        var list = JSON.parse(localStorage.getItem(key) || '[]');
        if (list.indexOf(value) === -1) list.push(value);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (err) {}
      showStatus(newsletterStatus, 'Subscribed! Watch your inbox for next month\'s tips.');
      newsletterForm.reset();
    });
  }

  // Theme toggle persisted in localStorage (default: dark)
  var themeToggle = document.querySelector('#theme-toggle');
  var THEME_KEY = 'astech-theme';
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) {
      var isLight = theme === 'light';
      themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (err) {}
  }

  var savedTheme = null;
  try { savedTheme = localStorage.getItem(THEME_KEY); } catch (err) {}
  applyTheme(savedTheme === 'light' ? 'light' : 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
    });
  }

  // Scroll-reveal animations via IntersectionObserver (skip when reduced motion)
  var revealTargets = Array.prototype.slice.call(
    document.querySelectorAll('.service__card, .price__card, .carousel, .faq__item, .contact__form, .contact__aside, .section__title, .section__subtitle')
  );

  if (prefersReducedMotion) {
    revealTargets.forEach(function (el) { el.classList.add('revealed'); });
  } else if ('IntersectionObserver' in window && revealTargets.length) {
    revealTargets.forEach(function (el) { el.classList.add('reveal'); });
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  // Reduced motion: stop carousel autoplay
  if (prefersReducedMotion) stopAutoplay();
  // 08 Case studies data + modal
  var CASES = [
    { title: 'Boutique Makeover (BM)', meta: '+112% enquiries in 60 days | 8 pages | 2 weeks', challenge: 'Old site was slow on phones, no clear contact path, invisible on Google.', solution: 'Rebuilt 8 pages mobile-first, added click-to-chat, map, contact form, SEO titles and speed pass.', results: '+112% enquiries, bounce down 40%, 95+ PageSpeed on mobile.' },
    { title: 'Fresh Shop Online (FS)', meta: '2.1s load | 38% mobile checkout lift | 3 weeks', challenge: 'Instagram-only sales, manual orders, no payments or stock view.', solution: 'Catalogue with cart, Stripe/PayPal checkout, order emails, shipping rules and discount codes.', results: '38% checkout lift on phones, 2.1s load, orders straight to email.' },
    { title: 'Salon Auto-Booking (GR)', meta: '24/7 leads | 300+ FAQs answered | 10 days', challenge: 'Missed calls after hours, same questions daily, no night-time capture.', solution: 'AI chat widget trained on services/prices/hours, lead handoff to email/WhatsApp with human fallback.', results: '300+ auto-answered chats/month, night leads captured, staff time saved.' }
  ];
  var caseModal = document.querySelector('#case-modal');
  function openCase(i) {
    if (!caseModal) return;
    var c = CASES[i];
    if (!c) return;
    document.querySelector('#case-modal-title').textContent = c.title;
    document.querySelector('#case-modal-meta').textContent = c.meta;
    document.querySelector('#case-challenge').textContent = c.challenge;
    document.querySelector('#case-solution').textContent = c.solution;
    document.querySelector('#case-results').textContent = c.results;
    caseModal.hidden = false;
    document.body.style.overflow = 'hidden';
    var b = caseModal.querySelector('.modal__close');
    if (b) b.focus();
  }
  function closeCase() {
    if (!caseModal || caseModal.hidden) return;
    caseModal.hidden = true;
    document.body.style.overflow = '';
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.case__btn');
    if (btn) { openCase(parseInt(btn.getAttribute('data-case'), 10) || 0); return; }
    if (e.target.closest('[data-case-close]')) closeCase();
    var l = e.target.closest('[data-case-close-link]');
    if (l) closeCase();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCase(); });
  // 09 Process timeline scroll animation
  var timelineSteps = Array.prototype.slice.call(document.querySelectorAll('.timeline__step'));
  if ('IntersectionObserver' in window && timelineSteps.length) {
    var tlObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in-view'); tlObs.unobserve(en.target); }
      });
    }, { threshold: 0.2 });
    timelineSteps.forEach(function (s) { tlObs.observe(s); });
    var reduceMo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMo) timelineSteps.forEach(function (s) { s.classList.add('in-view'); });
  } else {
    timelineSteps.forEach(function (s) { s.classList.add('in-view'); });
  }
})();
