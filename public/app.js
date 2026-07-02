const bestPrices = document.querySelector('#bestPrices');
const stations = document.querySelector('#stations');
const meta = document.querySelector('#meta');
const refresh = document.querySelector('#refresh');

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined }).format(new Date(value));
}

function render(data) {
  meta.innerHTML = `Источник: <a href="${data.sourceUrl}" target="_blank" rel="noreferrer">FuelPrice</a>. Парсинг: ${formatDate(data.parsedAt)}. Кэш: ${data.cachedForSeconds} сек.`;
  bestPrices.innerHTML = data.bestPrices.map((item) => `<article class="card"><span>${item.fuel}</span><b>${item.price.toFixed(2)} ₽</b></article>`).join('') || '<p>Лучшие цены не найдены.</p>';
  stations.innerHTML = data.stations.flatMap((station) => station.fuels.map((fuel) => `
    <tr><td>${station.name}</td><td>${fuel.type}</td><td><b>${fuel.price.toFixed(2)} ₽</b></td><td>${fuel.updated || '—'}</td></tr>
  `)).join('') || '<tr><td colspan="4">Данных пока нет.</td></tr>';
}

async function load() {
  meta.textContent = 'Загрузка актуальных данных...';
  bestPrices.innerHTML = '';
  stations.innerHTML = '';
  try {
    const response = await fetch('/api/prices');
    const data = await response.json();
    if (!response.ok) throw new Error(data.details || data.error);
    render(data);
  } catch (error) {
    meta.innerHTML = `<span class="error">${error.message}</span>`;
  }
}

refresh.addEventListener('click', load);
load();
