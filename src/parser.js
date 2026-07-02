const cheerio = require('cheerio');

const FUEL_RE = /(Аи-?\s?\d{2,3}|АИ-?\s?\d{2,3}|ДТ|Газ\s*СПБТ|Метан)\s*:\s*([\d.,]+)\s*₽\s*(\d{4}-\d{2}-\d{2})?/gi;
const BEST_RE = /Лучшие предложения:\s*(.+?)(?:выборка|$)/i;

function normaliseFuel(value) {
  return value.replace(/АИ/i, 'Аи').replace(/\s+/g, ' ').replace('Аи ', 'Аи-');
}

function parseBestPrices(text) {
  const match = text.match(BEST_RE);
  if (!match) return [];
  return [...match[1].matchAll(/(Аи-?\d{2,3}|ДТ|Газ\s*СПБТ|Метан)\s*([\d.,]+)\s*₽/gi)].map((item) => ({
    fuel: normaliseFuel(item[1]),
    price: Number(item[2].replace(',', '.'))
  }));
}

function parseFuelPrices(html, sourceUrl) {
  const $ = cheerio.load(html);
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  const title = $('h1').first().text().trim() || 'Цены на топливо в Озерске';
  const bestPrices = parseBestPrices(text);
  const stations = [];

  $('body *').each((_, element) => {
    const chunk = $(element).text().replace(/\s+/g, ' ').trim();
    const matches = [...chunk.matchAll(FUEL_RE)];
    if (matches.length === 0 || chunk.length > 800) return;

    const beforeFirstPrice = chunk.slice(0, matches[0].index).trim();
    const stationName = beforeFirstPrice.split(' ').slice(0, 8).join(' ') || 'АЗС';
    const fuels = matches.map((match) => ({
      type: normaliseFuel(match[1]),
      price: Number(match[2].replace(',', '.')),
      updated: match[3] || null
    }));

    if (fuels.some((fuel) => Number.isFinite(fuel.price))) {
      stations.push({ name: stationName, fuels });
    }
  });

  const unique = [];
  const seen = new Set();
  for (const station of stations) {
    const key = `${station.name}-${station.fuels.map((fuel) => `${fuel.type}:${fuel.price}`).join('|')}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(station);
    }
  }

  return {
    title,
    city: 'Озерск, Челябинская область',
    sourceUrl,
    parsedAt: new Date().toISOString(),
    bestPrices,
    stations: unique.slice(0, 30)
  };
}

module.exports = { parseFuelPrices, parseBestPrices };
