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
})();
