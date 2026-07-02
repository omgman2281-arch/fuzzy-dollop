const KM_TO_MILES = 0.621371;
const STORAGE_KEY = "route-mileage-points";

const form = document.querySelector("#point-form");
const nameInput = document.querySelector("#point-name");
const latInput = document.querySelector("#point-lat");
const lngInput = document.querySelector("#point-lng");
const pointsList = document.querySelector("#points-list");
const emptyState = document.querySelector("#empty-state");
const segmentsTable = document.querySelector("#segments-table");
const pointsCount = document.querySelector("#points-count");
const totalKm = document.querySelector("#total-km");
const totalMi = document.querySelector("#total-mi");
const clearButton = document.querySelector("#clear-route");
const demoButton = document.querySelector("#load-demo");

let points = loadPoints();

function loadPoints() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function savePoints() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(points));
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function calculateDistanceKm(start, end) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLng = toRadians(end.lng - start.lng);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);

  const haversine = Math.sin(deltaLat / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function getSegments() {
  return points.slice(1).map((point, index) => ({
    from: points[index],
    to: point,
    distance: calculateDistanceKm(points[index], point),
  }));
}

function formatDistance(distance) {
  return `${distance.toFixed(2)} км / ${(distance * KM_TO_MILES).toFixed(2)} mi`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[char]);
}

function renderPoints() {
  pointsList.innerHTML = "";
  emptyState.hidden = points.length > 0;

  points.forEach((point, index) => {
    const item = document.createElement("li");
    item.className = "point";
    item.innerHTML = `
      <span class="point__number">${index + 1}</span>
      <div>
        <strong>${escapeHtml(point.name)}</strong>
        <div class="point__coords">${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}</div>
      </div>
      <div class="point__buttons">
        <button type="button" class="secondary" data-action="up" data-index="${index}" ${index === 0 ? "disabled" : ""}>↑</button>
        <button type="button" class="secondary" data-action="down" data-index="${index}" ${index === points.length - 1 ? "disabled" : ""}>↓</button>
        <button type="button" class="danger" data-action="remove" data-index="${index}">Удалить</button>
      </div>
    `;
    pointsList.append(item);
  });
}

function renderSegments() {
  const segments = getSegments();
  segmentsTable.innerHTML = segments.length
    ? segments.map((segment) => `
      <tr>
        <td>${escapeHtml(segment.from.name)}</td>
        <td>${escapeHtml(segment.to.name)}</td>
        <td>${formatDistance(segment.distance)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3">Добавьте минимум две точки маршрута.</td></tr>`;
}

function renderTotals() {
  const total = getSegments().reduce((sum, segment) => sum + segment.distance, 0);
  pointsCount.textContent = points.length;
  totalKm.textContent = total.toFixed(2);
  totalMi.textContent = (total * KM_TO_MILES).toFixed(2);
}

function render() {
  savePoints();
  renderPoints();
  renderSegments();
  renderTotals();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  points.push({
    name: nameInput.value.trim(),
    lat: Number(latInput.value),
    lng: Number(lngInput.value),
  });

  form.reset();
  nameInput.focus();
  render();
});

pointsList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;

  if (action === "remove") {
    points.splice(index, 1);
  }

  if (action === "up" && index > 0) {
    [points[index - 1], points[index]] = [points[index], points[index - 1]];
  }

  if (action === "down" && index < points.length - 1) {
    [points[index + 1], points[index]] = [points[index], points[index + 1]];
  }

  render();
});

clearButton.addEventListener("click", () => {
  points = [];
  render();
});

demoButton.addEventListener("click", () => {
  points = [
    { name: "Москва", lat: 55.7558, lng: 37.6173 },
    { name: "Тверь", lat: 56.8587, lng: 35.9176 },
    { name: "Великий Новгород", lat: 58.5215, lng: 31.2755 },
    { name: "Санкт-Петербург", lat: 59.9343, lng: 30.3351 },
  ];
  render();
});

render();
