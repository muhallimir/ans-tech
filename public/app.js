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
  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    var id = anchor.getAttribute('href');
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
})();
