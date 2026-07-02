const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFuelPrices } = require('../src/parser');

test('parses best prices and station fuel rows', () => {
  const html = `<body><h1>Бензин Озерск</h1><p>Лучшие предложения: Аи-92 58.63 ₽, Аи-95 63.99 ₽, ДТ 72.36 ₽</p><div>АЗС №158 <span>Аи-92 : 58.63 ₽ 2026-06-30</span><span>ДТ : 72.36 ₽ 2026-07-01</span></div></body>`;
  const data = parseFuelPrices(html, 'https://example.test');
  assert.equal(data.bestPrices.length, 3);
  assert.equal(data.bestPrices[0].fuel, 'Аи-92');
  assert.equal(data.bestPrices[0].price, 58.63);
  assert.ok(data.stations.some((station) => station.fuels.some((fuel) => fuel.type === 'ДТ' && fuel.updated === '2026-07-01')));
});
