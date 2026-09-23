'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { evaluate } = require('../src/calculator');
const { server } = require('../src/server');

test('базовые операции и приоритет', () => {
  assert.strictEqual(evaluate('2+2*3'), 8);
  assert.strictEqual(evaluate('(2+2)*3'), 12);
  assert.strictEqual(evaluate('10/4'), 2.5);
  assert.strictEqual(evaluate('10 % 3'), 1);
  assert.strictEqual(evaluate('2^3^2'), 512);
  assert.strictEqual(evaluate('-2^2'), -4);
  assert.strictEqual(evaluate('-(3-5)'), 2);
  assert.strictEqual(evaluate('0.1+0.2'), 0.3);
  assert.strictEqual(evaluate('1,5*2'), 3);
});

test('ошибки', () => {
  assert.throws(() => evaluate(''), /Пустое/);
  assert.throws(() => evaluate('1/0'), /Деление на ноль/);
  assert.throws(() => evaluate('(1+2'), /скобки/);
  assert.throws(() => evaluate('2+'), /конец/);
  assert.throws(() => evaluate('abc'), /Недопустимый/);
  assert.throws(() => evaluate('1.2.3'), /Некорректное число/);
});

test('роуты сервера', async (t) => {
  await new Promise((r) => server.listen(0, r));
  t.after(() => server.close());
  const base = `http://localhost:${server.address().port}`;

  let res = await fetch(`${base}/calc?expr=${encodeURIComponent('2+2*3')}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).result, 8);

  res = await fetch(`${base}/calc`, { method: 'POST', body: JSON.stringify({ expr: '(1+2)*4' }) });
  assert.strictEqual((await res.json()).result, 12);

  res = await fetch(`${base}/calc?expr=1/0`);
  assert.strictEqual(res.status, 400);

  res = await fetch(`${base}/`);
  assert.match(await res.text(), /Калькулятор/);

  // Файлы мобильного приложения (PWA)
  res = await fetch(`${base}/manifest.webmanifest`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual((await res.json()).display, 'standalone');
  for (const file of ['/sw.js', '/calculator.js', '/icon-192.png', '/icon-512.png']) {
    res = await fetch(base + file);
    assert.strictEqual(res.status, 200, file);
  }

  res = await fetch(`${base}/nope`);
  assert.strictEqual(res.status, 404);
});
