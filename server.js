const dns = require('node:dns');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const express = require('express');
const path = require('path');
const { parseFuelPrices } = require('./src/parser');

const PORT = process.env.PORT || 3000;
const SOURCE_URL = process.env.SOURCE_URL || 'https://fuelprice.ru/ozersk';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);

dns.setDefaultResultOrder('ipv4first');

const execFileAsync = promisify(execFile);
const app = express();
let cache = null;

async function fetchHtml(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; OzerskFuelParser/1.0; +https://example.local)'
      }
    });

    if (!response.ok) {
      throw new Error(`Источник вернул HTTP ${response.status}`);
    }

    return response.text();
  } catch (error) {
    const { stdout } = await execFileAsync('curl', ['--fail', '--location', '--silent', '--max-time', '20', url], {
      maxBuffer: 10 * 1024 * 1024
    });
    return stdout;
  }
}

async function loadPrices() {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.payload;

  const html = await fetchHtml(SOURCE_URL);
  const payload = parseFuelPrices(html, SOURCE_URL);
  cache = { fetchedAt: now, payload };
  return payload;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/prices', async (_req, res) => {
  try {
    const data = await loadPrices();
    res.json({ ...data, cachedForSeconds: Math.round(CACHE_TTL_MS / 1000) });
  } catch (error) {
    res.status(502).json({
      error: 'Не удалось получить цены с источника',
      details: error.message,
      sourceUrl: SOURCE_URL
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Открывайте http://localhost:${PORT}`);
  });
}

module.exports = { app, loadPrices, fetchHtml };
