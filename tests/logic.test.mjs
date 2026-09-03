// Unit tests for the pure logic functions in logic.mjs (extracted from public/app.js).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isEmail, isPhone, calcEstimate, makeBookingRef, botReply } from './logic.mjs';

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
