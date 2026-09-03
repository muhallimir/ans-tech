// Pure logic extracted from public/app.js so we can unit test it with node:test.
// The same functions are evaluated by the browser; these copies are for tests only.

// isEmail: matches the regex used in app.js (line 224-226) and the booking form.
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

// isPhone: matches the booking phone regex used in app.js contact form (line 250).
// Allows +, digits, spaces, dashes, parens; requires 7+ body chars.
export function isPhone(value) {
  const v = String(value || '').trim();
  return /^[+\d][\d\s\-()]{6,}$/.test(v);
}

// calcEstimate: pure copy of the estimator logic in app.js (line 549-565).
// Inputs are plain values matching the data-* attributes on the radio/checkbox inputs.
export function calcEstimate({ typeValue, typeDays, features, speedValue }) {
  const base = (parseInt(typeValue, 10) || 0);
  let acc = base;
  let totalDays = (parseInt(typeDays, 10) || 5);
  (features || []).forEach(f => {
    acc += (parseInt(f.value, 10) || 0);
    totalDays += (parseInt(f.days, 10) || 0);
  });
  let mult = parseFloat(speedValue);
  if (!Number.isFinite(mult)) mult = 1;
  const low = Math.round(acc * mult);
  const high = Math.round(acc * mult * 1.2);
  return { low, high, days: totalDays };
}

// makeBookingRef: matches the ref generator in app.js booking submit (line 601).
// Returns a string like "ANS-AB12CD". Format: ANS- + last 6 chars of base36 Date.now(),
// uppercased. We accept an optional timestamp to make it testable.
export function makeBookingRef(now = Date.now()) {
  return 'ANS-' + now.toString(36).toUpperCase().slice(-6);
}

// botReply: pure copy of the chat-bot reply map in app.js (line 628-635).
export function botReply(q) {
  q = (q || '').toLowerCase();
  if (q.indexOf('pric') > -1 || q === 'pricing') return 'Starter $49/mo, Business $129/mo, Custom on quote. Try the estimator above for your exact range.';
  if (q.indexOf('time') > -1 || q.indexOf('long') > -1 || q === 'timeline') return 'Landing 3-5 days, business site 1-2 weeks, shop 2-4 weeks. Booking gets you a date today.';
  if (q.indexOf('support') > -1 || q.indexOf('help') > -1) return 'Care plans cover updates + priority fixes. Email hello@astech.example, we reply in one business day.';
  if (q.indexOf('human') > -1 || q.indexOf('call') > -1) return 'Leave your email in the contact form and we call back within one business day.';
  return 'Got it! For pricing ask pricing, for timing ask timeline, for help ask support. Or use Contact below.';
}

// 33 ROI calculator: pure copy of the math used by the ROI section.
// traffic: monthly visitors; cvrPct: conversion rate in percent; aov: avg order value in $;
// upliftPct: scenario multiplier in percent (0.3 = +30%).
export function calcRoi(traffic, cvrPct, aov, upliftPct) {
  var t = Math.max(0, Number(traffic) || 0);
  var cvr = Math.max(0, Number(cvrPct) || 0) / 100;
  var a = Math.max(0, Number(aov) || 0);
  var u = Math.max(0, Number(upliftPct) || 0);
  var current = t * cvr * a;
  var uplift = current * u;
  var newRev = current + uplift;
  return { current: current, uplift: uplift, newRev: newRev, annual: uplift * 12 };
}

// 35 Loading bar step: returns the next bar percentage for a tick.
// Climbs with a randomised amount but stops at the cap. Pure function for tests.
export function nextLoadStep(current, cap) {
  var c = Math.max(0, Math.min(100, Number(current) || 0));
  var capN = Math.max(c, Math.min(100, Number(cap) || 0));
  if (c >= capN) return c;
  // Caller passes the increment; we clamp the result. Kept simple so tests can
  // assert the contract without coupling to Math.random.
  var inc = arguments[2];
  if (!Number.isFinite(inc)) inc = 0;
  return Math.min(capN, c + inc);
}

// 37 Newsletter mock helpers.
// genSixDigitShape: pure format-only check that the generator returns a 6-digit string.
export function genSixDigitShape(code) {
  return typeof code === 'string' && /^\d{6}$/.test(code);
}

// resendRemaining: seconds left before "send again" is allowed.
// `lastSentAt` is a timestamp in ms. `now` defaults to Date.now(). `windowSec` is the rate window.
export function resendRemaining(lastSentAt, now, windowSec) {
  var last = Number(lastSentAt) || 0;
  if (!last) return 0;
  var n = Number(now) || 0;
  var w = Number(windowSec) || 0;
  if (w <= 0) return 0;
  var left = w - Math.floor((n - last) / 1000);
  return left > 0 ? left : 0;
}

// 39 Engagement modal dismiss: is the modal still suppressed at this moment?
// `until` is a timestamp in ms. `now` defaults to Date.now().
export function engageDismissedAt(until, now) {
  var u = Number(until) || 0;
  if (!u) return false;
  var n = Number(now) || Date.now();
  return n < u;
}
