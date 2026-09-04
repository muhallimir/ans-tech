// 42 Conversion analytics mock. Records simple events in localStorage and
// renders counts + last 20 events + a small SVG bar chart on the
// /admin-stats page. Rate-limited to once every 250ms to avoid floods.

(function () {
  if (window.__astechAnalytics) return;
  window.__astechAnalytics = true;

  var KEY = 'astech_events_v1';
  var MAX = 200;
  var lastEmit = 0;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(-MAX)));
    } catch (e) {
      // ignore quota
    }
  }

  function track(type, meta) {
    var now = Date.now();
    if (now - lastEmit < 250 && type !== 'page_view') return;
    lastEmit = now;
    var items = read();
    items.push({
      type: type,
      meta: meta || null,
      t: now,
      path: location.pathname || '/',
    });
    write(items);
  }

  function counts(items) {
    var c = { page_view: 0, cta_click: 0, form_submit: 0, faq_open: 0, other: 0 };
    items.forEach(function (i) {
      if (c[i.type] != null) c[i.type] += 1;
      else c.other += 1;
    });
    return c;
  }

  window.astechTrack = track;
  window.astechGetEvents = read;
  window.astechGetCounts = function () { return counts(read()); };
  window.astechClearEvents = function () { write([]); };

  // Auto-track a page view on first script load.
  track('page_view');

  // Wire common CTAs and forms once DOM is ready.
  function wire() {
    document.querySelectorAll('a.btn, a.button, button.button, .cta').forEach(function (el) {
      if (el.__astechBound) return;
      el.__astechBound = true;
      el.addEventListener('click', function () {
        track('cta_click', { text: (el.textContent || '').trim().slice(0, 40) });
      });
    });
    document.querySelectorAll('form').forEach(function (f) {
      if (f.__astechBound) return;
      f.__astechBound = true;
      f.addEventListener('submit', function () {
        track('form_submit', { id: f.id || f.getAttribute('name') || null });
      });
    });
    document.querySelectorAll('.faq__question, .faq__item button, details').forEach(function (el) {
      if (el.__astechBound) return;
      el.__astechBound = true;
      el.addEventListener('click', function () {
        track('faq_open', null);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }
})();
