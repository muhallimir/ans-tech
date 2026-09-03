// Unit tests for the pure logic functions in logic.mjs (extracted from public/app.js).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEmail, isPhone, calcEstimate, makeBookingRef, botReply, calcRoi, nextLoadStep, genSixDigitShape, resendRemaining, engageDismissedAt } from './logic.mjs';

test('isEmail accepts well-formed addresses', () => {
  for (const good of ['a@b.co', 'user.name+tag@example.com', 'x@y.io', '  spaced@example.com  ']) {
    assert.equal(isEmail(good), true, `expected ${good} to be valid`);
  }
});

test('isEmail rejects malformed addresses', () => {
  for (const bad of ['', 'plain', '@no-local.com', 'no-at.com', 'two@@at.com', 'no domain@', 'a@b', 'a @b.com']) {
    assert.equal(isEmail(bad), false, `expected ${JSON.stringify(bad)} to be invalid`);
  }
});

test('isPhone accepts e.164-ish numbers', () => {
  for (const good of ['+255700000000', '+1 555 123 4567', '0712345678', '0700-000-000']) {
    assert.equal(isPhone(good), true, `expected ${good} to be valid`);
  }
});

test('isPhone rejects empty, too-short, or letter inputs', () => {
  for (const bad of ['', '12345', 'abcdefg', '+', '  ']) {
    assert.equal(isPhone(bad), false, `expected ${JSON.stringify(bad)} to be invalid`);
  }
});

test('calcEstimate with default landing page, no features, standard speed', () => {
  const r = calcEstimate({ typeValue: '800', typeDays: '5', features: [], speedValue: '1' });
  assert.deepEqual(r, { low: 800, high: 960, days: 5 });
});

test('calcEstimate with payments + SEO features and rush multiplier', () => {
  const r = calcEstimate({
    typeValue: '1800', typeDays: '10',
    features: [{ value: '600', days: '3' }, { value: '350', days: '2' }],
    speedValue: '1.25'
  });
  // base 1800 + 600 + 350 = 2750; days 10 + 3 + 2 = 15; mult 1.25
  // low = round(2750 * 1.25) = 3438
  // high = round(2750 * 1.25 * 1.2) = round(4125) = 4125
  assert.equal(r.low, 3438);
  assert.equal(r.high, 4125);
  assert.equal(r.days, 15);
});

test('calcEstimate with flexible 10% discount multiplier', () => {
  const r = calcEstimate({ typeValue: '800', typeDays: '5', features: [], speedValue: '0.9' });
  // 800 * 0.9 = 720; 720 * 1.2 = 864
  assert.equal(r.low, 720);
  assert.equal(r.high, 864);
});

test('calcEstimate defaults speed to 1 when missing', () => {
  const r = calcEstimate({ typeValue: '800', typeDays: '5', features: [] });
  assert.equal(r.low, 800);
  assert.equal(r.high, 960);
});

test('calcEstimate handles empty / NaN values safely', () => {
  const r = calcEstimate({ typeValue: 'abc', typeDays: '', features: [{ value: 'x', days: '' }], speedValue: 'x' });
  // base 0; features add 0; days 5 (default); NaN mult -> 0 output, not NaN.
  assert.equal(Number.isFinite(r.low), true, 'low should be finite');
  assert.equal(Number.isFinite(r.high), true, 'high should be finite');
  assert.equal(Number.isFinite(r.days), true, 'days should be finite');
  // With NaN multiplier the result collapses to 0; document that behavior here.
  assert.equal(r.low, 0);
  assert.equal(r.high, 0);
});

test('makeBookingRef matches the ANS-XXXXXX format used by app.js', () => {
  // Use a known timestamp so the slice is deterministic.
  // 1715000000000 -> base36 = "qp3x9q8" -> upper = "QP3X9Q8", slice(-6) = "X9Q8" wait need to recompute.
  // Easier: check format only.
  const ref = makeBookingRef(1715000000000);
  assert.match(ref, /^ANS-[A-Z0-9]{1,6}$/);
});

test('makeBookingRef uses the last 6 base36 chars uppercased', () => {
  // 1 -> base36 "1", uppercased "1", slice(-6) "1"
  assert.equal(makeBookingRef(1), 'ANS-1');
  // 36 -> base36 "10", uppercased "10", slice(-6) "10"
  assert.equal(makeBookingRef(36), 'ANS-10');
});

test('botReply routes "pricing" to pricing answer', () => {
  assert.match(botReply('pricing'), /Starter/);
  assert.match(botReply('what is the price'), /Starter/);
});

test('botReply routes "timeline" / "long" to timeline answer', () => {
  assert.match(botReply('timeline'), /Landing 3-5 days/);
  assert.match(botReply('how long?'), /Landing 3-5 days/);
});

test('botReply routes "support" / "help" to support answer', () => {
  assert.match(botReply('support'), /Care plans/);
  assert.match(botReply('help me'), /Care plans/);
});

test('botReply routes "human" / "call" to callback answer', () => {
  assert.match(botReply('human'), /call back/);
  assert.match(botReply('can you call me'), /call back/);
});

test('botReply returns fallback for unknown input', () => {
  assert.match(botReply('what is the meaning of life'), /Got it!/);
  assert.match(botReply(''), /Got it!/);
});

test('calcRoi: default scenario 3000 visitors, 1.5% CVR, $45 AOV, 30% uplift', () => {
  const r = calcRoi(3000, 1.5, 45, 0.30);
  // orders = 3000 * 0.015 = 45; current = 45 * 45 = 2025
  // uplift = 2025 * 0.3 = 607.5
  // newRev = 2025 + 607.5 = 2632.5
  // annual = 607.5 * 12 = 7290
  assert.equal(r.current, 2025);
  assert.equal(r.uplift, 607.5);
  assert.equal(r.newRev, 2632.5);
  assert.equal(r.annual, 7290);
});

test('calcRoi: conservative 15% scenario produces one fifth the 75% uplift math', () => {
  const aggressive = calcRoi(10000, 2, 30, 0.75);
  const conservative = calcRoi(10000, 2, 30, 0.15);
  // same base; uplift scales linearly with scenario
  assert.equal(aggressive.uplift, conservative.uplift * 5);
});

test('calcRoi: zero inputs produce zero output, not NaN', () => {
  const r = calcRoi(0, 0, 0, 0);
  assert.equal(r.current, 0);
  assert.equal(r.uplift, 0);
  assert.equal(r.newRev, 0);
  assert.equal(r.annual, 0);
});

test('calcRoi: garbage inputs are coerced to zero, never NaN', () => {
  const r = calcRoi('abc', 'x', null, undefined);
  assert.equal(Number.isFinite(r.current), true);
  assert.equal(Number.isFinite(r.uplift), true);
  assert.equal(Number.isFinite(r.annual), true);
  assert.equal(r.current, 0);
});

test('calcRoi: negative inputs are clamped to zero', () => {
  const r = calcRoi(-100, -5, -50, -0.5);
  assert.equal(r.current, 0);
  assert.equal(r.uplift, 0);
  assert.equal(r.annual, 0);
});

test('nextLoadStep: never overshoots the cap', () => {
  assert.equal(nextLoadStep(75, 80, 50), 80, 'clamped to cap');
  assert.equal(nextLoadStep(80, 80, 50), 80, 'already at cap');
  assert.equal(nextLoadStep(0, 80, 20), 20);
});

test('nextLoadStep: clamps current and cap into 0..100', () => {
  assert.equal(nextLoadStep(-5, 80, 10), 10);
  assert.equal(nextLoadStep(0, 200, 10), 10);
  assert.equal(nextLoadStep(50, 50, -10), 50);
});

test('nextLoadStep: missing increment is treated as 0', () => {
  assert.equal(nextLoadStep(20, 80), 20);
});

test('nextLoadStep: garbage inputs stay finite', () => {
  const r = nextLoadStep('abc', 'x', 'y');
  assert.equal(Number.isFinite(r), true);
});

test('genSixDigitShape accepts well-formed codes', () => {
  assert.equal(genSixDigitShape('000000'), true);
  assert.equal(genSixDigitShape('123456'), true);
  assert.equal(genSixDigitShape('987654'), true);
});

test('genSixDigitShape rejects malformed codes', () => {
  for (const bad of ['', '12345', '1234567', 'abcdef', '12 456', 123456, null, undefined]) {
    assert.equal(genSixDigitShape(bad), false, `expected ${JSON.stringify(bad)} to be invalid`);
  }
});

test('resendRemaining: zero / missing last-sent means send is allowed', () => {
  assert.equal(resendRemaining(0, Date.now(), 30), 0);
  assert.equal(resendRemaining('abc', Date.now(), 30), 0);
});

test('resendRemaining: counts down from 30 then returns 0', () => {
  const now = 1_700_000_000_000;
  assert.equal(resendRemaining(now, now, 30), 30, 'right after send -> 30s');
  assert.equal(resendRemaining(now, now + 5000, 30), 25, '5s after send -> 25s');
  assert.equal(resendRemaining(now, now + 30_000, 30), 0, '30s after send -> 0');
  assert.equal(resendRemaining(now, now + 60_000, 30), 0, 'past window -> 0');
});

test('resendRemaining: respects custom window', () => {
  const now = 1_700_000_000_000;
  assert.equal(resendRemaining(now, now + 4_000, 5), 1, '4s into 5s window -> 1s');
});

test('resendRemaining: garbage window falls back to 0', () => {
  assert.equal(resendRemaining(Date.now(), Date.now(), 0), 0);
  assert.equal(resendRemaining(Date.now(), Date.now(), -10), 0);
  assert.equal(resendRemaining(Date.now(), Date.now(), 'x'), 0);
});

test('engageDismissedAt: missing or past timestamp means not dismissed', () => {
  assert.equal(engageDismissedAt(0, Date.now()), false);
  assert.equal(engageDismissedAt('abc', Date.now()), false);
  const past = Date.now() - 1000;
  assert.equal(engageDismissedAt(past, Date.now()), false);
});

test('engageDismissedAt: future timestamp means dismissed', () => {
  const future = Date.now() + 7 * 24 * 60 * 60 * 1000;
  assert.equal(engageDismissedAt(future, Date.now()), true);
});

test('engageDismissedAt: respects injected now', () => {
  const t = 1_700_000_000_000;
  assert.equal(engageDismissedAt(t + 1000, t), true);
  assert.equal(engageDismissedAt(t - 1, t), false);
});
