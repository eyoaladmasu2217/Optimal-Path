// --- Utilities ---
function formatDistance(meters) {
  if (meters >= 1000) return (meters / 1000).toFixed(2) + ' km';
  return Math.round(meters) + ' m';
}

const ALGO_LABELS = {
  astar: 'A* Search',
  dijkstra: 'Dijkstra',
  greedy: 'Greedy Best-First',
  bfs: 'BFS',
  dfs: 'DFS'
};

const HISTORY_KEY = 'addis-route-history';
const routeHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
let currentRoute = null;

function nodeName(nodeSpec) {
  if (typeof nodeSpec === 'string' && window._graphNodes && window._graphNodes[nodeSpec]) {
    return window._graphNodes[nodeSpec].name;
  }
  return typeof nodeSpec === 'string' ? nodeSpec : 'Map point';
}

function showMessage(message, type = 'info') {
  const notice = document.getElementById('app-notice');
  notice.textContent = message;
  notice.className = `app-notice ${type}`;
  window.clearTimeout(showMessage.timer);
  showMessage.timer = window.setTimeout(() => { notice.className = 'app-notice'; }, 2800);
}

// --- Theme Toggle ---
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('theme-sun-icon');
const moonIcon = document.getElementById('theme-moon-icon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
  moonIcon.style.display = theme === 'light' ? 'block' : 'none';
}

applyTheme(localStorage.getItem('theme') || 'dark');
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});

// --- Node Fetching ---
async function fetchNodes(){
  const res = await fetch('/api/nodes');
  const nodes = await res.json();
  const start = document.getElementById('start');
  const goal = document.getElementById('goal');
  window._graphNodes = {};
  nodes.forEach(n => {
    const opt1 = document.createElement('option');
    opt1.value = n.id; opt1.textContent = n.name;
    const opt2 = opt1.cloneNode(true);
    start.appendChild(opt1);
    goal.appendChild(opt2);
    window._graphNodes[n.id] = { lat: n.lat, lon: n.lon, name: n.name };
  });
}

// --- Route Finding ---
async function findRoute(){
  const start = document.getElementById('start').value;
  const goal = document.getElementById('goal').value;
  const algorithm = document.getElementById('algorithm').value;
  const payload = { start, goal, algorithm };
  if (!start || !goal) {
    if (window._selectedStart && window._selectedGoal) {
      payload.start = { lat: window._selectedStart.lat, lon: window._selectedStart.lng };
      payload.goal = { lat: window._selectedGoal.lat, lon: window._selectedGoal.lng };
    } else {
      document.getElementById('path').textContent = 'Please select start and goal.';
      return;
    }
  }
  await requestRoute(payload);
}

async function requestRoute(payload) {
  const runButton = document.getElementById('run');
  runButton.disabled = true;
  runButton.classList.add('is-loading');
  try {
    const res = await fetch('/api/route', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Unable to calculate route.');
    displayRoute(data, payload);
    loadComparison(payload.start, payload.goal, payload.algorithm);
    initDebugger(data.steps);
  } catch (error) {
    document.getElementById('path').textContent = error.message;
    document.getElementById('cost-detail').textContent = '-';
    showMessage(error.message, 'error');
  } finally {
    runButton.disabled = false;
    runButton.classList.remove('is-loading');
  }
}

function displayRoute(data, payload) {
  const pathDiv = document.getElementById('path');
  const resultsCard = document.getElementById('results');
  resultsCard.style.display = 'block';
  pathDiv.textContent = data.path.map(p => p.name).join(' → ');
  document.getElementById('cost-detail').textContent = formatDistance(data.cost);
  document.getElementById('nodes-detail').textContent = data.path.length;
  currentRoute = { data, payload };
  document.getElementById('copy-route').disabled = false;
  document.getElementById('download-route').disabled = false;
  saveRoute(data, payload);

  if(routeLayer) map.removeLayer(routeLayer);
  const latlngs = data.path.map(p => [p.lat, p.lon]);
  if(latlngs.length) {
    routeLayer = L.polyline(latlngs, {color:'blue', weight:4}).addTo(map);
    map.fitBounds(routeLayer.getBounds(), {padding:[50,50]});
  }
}

function saveRoute(data, payload) {
  const route = {
    start: nodeName(payload.start),
    goal: nodeName(payload.goal),
    algorithm: payload.algorithm,
    cost: data.cost,
    path: data.path.map(node => node.name)
  };
  routeHistory.unshift(route);
  routeHistory.splice(6);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(routeHistory));
  renderHistory();
}

function renderHistory() {
  const history = document.getElementById('route-history');
  if (!routeHistory.length) {
    history.innerHTML = '<p class="empty-state">Your completed routes will appear here.</p>';
    return;
  }
  history.innerHTML = routeHistory.map((route, index) => `
    <button class="history-item" type="button" data-history-index="${index}">
      <span class="history-route">${route.start} → ${route.goal}</span>
      <span class="history-meta">${ALGO_LABELS[route.algorithm] || route.algorithm} · ${formatDistance(route.cost)}</span>
    </button>
  `).join('');
  history.querySelectorAll('[data-history-index]').forEach(button => {
    button.addEventListener('click', () => {
      const route = routeHistory[Number(button.dataset.historyIndex)];
      document.getElementById('start').value = Object.keys(window._graphNodes).find(id => window._graphNodes[id].name === route.start) || '';
      document.getElementById('goal').value = Object.keys(window._graphNodes).find(id => window._graphNodes[id].name === route.goal) || '';
      document.getElementById('algorithm').value = route.algorithm;
      findRoute();
    });
  });
}

function routeText() {
  if (!currentRoute) return '';
  const { data, payload } = currentRoute;
  return `${nodeName(payload.start)} to ${nodeName(payload.goal)}\n` +
    `Algorithm: ${ALGO_LABELS[payload.algorithm] || payload.algorithm}\n` +
    `Distance: ${formatDistance(data.cost)}\n` +
    `Path: ${data.path.map(node => node.name).join(' -> ')}`;
}

document.getElementById('copy-route').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(routeText());
    showMessage('Route copied to clipboard.', 'success');
  } catch (error) {
    showMessage('Clipboard access is unavailable.', 'error');
  }
});

document.getElementById('download-route').addEventListener('click', () => {
  const blob = new Blob([routeText()], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'addis-route.txt';
  link.click();
  URL.revokeObjectURL(link.href);
  showMessage('Route downloaded.', 'success');
});

document.getElementById('clear-history').addEventListener('click', () => {
  routeHistory.length = 0;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

// --- Algorithm Comparison Table ---
async function loadComparison(start, goal, activeAlgorithm) {
  const res = await fetch('/api/compare', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ start, goal })
  });
  const data = await res.json();
  if (data.error) return;
  const tbody = document.getElementById('metrics-table-body');
  tbody.innerHTML = '';
  data.results.forEach(r => {
    const tr = document.createElement('tr');
    if (r.algorithm === activeAlgorithm) tr.classList.add('active-comparison');
    tr.innerHTML = `
      <td>${ALGO_LABELS[r.algorithm] || r.algorithm}</td>
      <td>${formatDistance(r.cost)}</td>
      <td>${r.visited_nodes}</td>
      <td>${r.steps_count}</td>
      <td>${r.elapsed_ms} ms</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Visual Debugger ---
let debugSteps = [];
let debugIndex = 0;
let debugTimer = null;
let debugLayers = [];

const debugStatus = document.getElementById('debug-status-text');
const stepIndicator = document.getElementById('step-indicator');
const btnReset = document.getElementById('btn-reset');
const btnPrev = document.getElementById('btn-prev');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnNext = document.getElementById('btn-next');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');

const SPEED_LABELS = { 1: 'Slow', 2: 'Medium', 3: 'Fast', 4: 'Turbo' };

function setDebugControlsEnabled(enabled) {
  [btnReset, btnPrev, btnPlayPause, btnNext].forEach(b => b.disabled = !enabled);
}

function clearDebugLayers() {
  debugLayers.forEach(l => map.removeLayer(l));
  debugLayers = [];
}

function renderDebugStep(index) {
  if (!debugSteps.length) return;
  debugIndex = Math.max(0, Math.min(index, debugSteps.length - 1));
  const step = debugSteps[debugIndex];
  clearDebugLayers();

  step.visited.forEach(nid => {
    const node = window._graphNodes && window._graphNodes[nid];
    if (!node || nid === step.current) return;
    const m = L.circleMarker([node.lat, node.lon], {
      radius: 5, color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.5
    }).addTo(map);
    debugLayers.push(m);
  });

  step.frontier.forEach(nid => {
    const node = window._graphNodes && window._graphNodes[nid];
    if (!node || step.visited.includes(nid)) return;
    const m = L.circleMarker([node.lat, node.lon], {
      radius: 6, color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.6
    }).addTo(map);
    debugLayers.push(m);
  });

  const current = window._graphNodes && window._graphNodes[step.current];
  if (current) {
    const m = L.circleMarker([current.lat, current.lon], {
      radius: 9, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.9
    }).addTo(map).bindPopup('Current: ' + (current.name || step.current)).openPopup();
    debugLayers.push(m);
  }

  stepIndicator.style.display = 'inline';
  stepIndicator.textContent = `Step ${debugIndex + 1}/${debugSteps.length}`;
  debugStatus.textContent = debugIndex === debugSteps.length - 1 ? 'Complete' : 'Running';
  btnPrev.disabled = debugIndex === 0;
  btnNext.disabled = debugIndex === debugSteps.length - 1;
}

function initDebugger(steps) {
  debugSteps = steps || [];
  debugIndex = 0;
  stopDebugAnimation();
  if (!debugSteps.length) {
    setDebugControlsEnabled(false);
    debugStatus.textContent = 'Idle';
    stepIndicator.style.display = 'none';
    return;
  }
  setDebugControlsEnabled(true);
  renderDebugStep(0);
}

function stopDebugAnimation() {
  if (debugTimer) { clearInterval(debugTimer); debugTimer = null; }
  iconPlay.style.display = 'block';
  iconPause.style.display = 'none';
}

function startDebugAnimation() {
  stopDebugAnimation();
  iconPlay.style.display = 'none';
  iconPause.style.display = 'block';
  const delay = { 1: 800, 2: 400, 3: 200, 4: 80 }[speedSlider.value] || 400;
  debugTimer = setInterval(() => {
    if (debugIndex >= debugSteps.length - 1) { stopDebugAnimation(); return; }
    renderDebugStep(debugIndex + 1);
  }, delay);
}

btnReset.addEventListener('click', () => { stopDebugAnimation(); renderDebugStep(0); });
btnPrev.addEventListener('click', () => { stopDebugAnimation(); renderDebugStep(debugIndex - 1); });
btnNext.addEventListener('click', () => { stopDebugAnimation(); renderDebugStep(debugIndex + 1); });
btnPlayPause.addEventListener('click', () => {
  if (debugTimer) stopDebugAnimation();
  else startDebugAnimation();
});
speedSlider.addEventListener('input', () => {
  speedValue.textContent = SPEED_LABELS[speedSlider.value] || 'Medium';
  if (debugTimer) startDebugAnimation();
});

// --- Swap Start/Goal ---
document.getElementById('swap').addEventListener('click', () => {
  const startSel = document.getElementById('start');
  const goalSel = document.getElementById('goal');
  const tmp = startSel.value;
  startSel.value = goalSel.value;
  goalSel.value = tmp;

  if (startMarker && goalMarker) {
    const sLatLng = startMarker.getLatLng();
    const gLatLng = goalMarker.getLatLng();
    startMarker.setLatLng(gLatLng);
    goalMarker.setLatLng(sLatLng);
    window._selectedStart = gLatLng;
    window._selectedGoal = sLatLng;
  } else {
    const tmpCoord = window._selectedStart;
    window._selectedStart = window._selectedGoal;
    window._selectedGoal = tmpCoord;
  }
});

document.getElementById('run').addEventListener('click', findRoute);
document.getElementById('clear').addEventListener('click', clearRoute);
fetchNodes();

// --- Leaflet map integration ---
let map = L.map('map').setView([9.02, 38.75], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let clickCount = 0;
let startMarker = null;
let goalMarker = null;
let routeLayer = null;

const legend = L.control({position: 'topright'});
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.innerHTML = `
    <div class="item"><span class="legend-swatch" style="background:green"></span> Start</div>
    <div class="item"><span class="legend-swatch" style="background:red"></span> Goal</div>
    <div class="item"><span class="legend-swatch" style="background:blue"></span> Route</div>
    <div class="item"><span class="legend-swatch" style="background:#6366f1"></span> Visited</div>
    <div class="item"><span class="legend-swatch" style="background:#f59e0b"></span> Frontier</div>
    <div class="item"><span class="legend-swatch" style="background:#10b981"></span> Current</div>
  `;
  return div;
};
legend.addTo(map);

map.on('click', function(e){
  clickCount++;
  if(clickCount === 1){
    if(startMarker) map.removeLayer(startMarker);
    startMarker = L.circleMarker(e.latlng, {radius:8, color:'green', fillColor:'green', fillOpacity:0.8}).addTo(map).bindPopup('Start');
    document.getElementById('start').value = '';
    startMarker.openPopup();
    window._selectedStart = e.latlng;
  } else if(clickCount === 2){
    if(goalMarker) map.removeLayer(goalMarker);
    goalMarker = L.circleMarker(e.latlng, {radius:8, color:'red', fillColor:'red', fillOpacity:0.8}).addTo(map).bindPopup('Goal');
    document.getElementById('goal').value = '';
    goalMarker.openPopup();
    window._selectedGoal = e.latlng;
    requestRouteFromCoords();
    clickCount = 0;
  }
});

async function requestRouteFromCoords(){
  if(!window._selectedStart || !window._selectedGoal) return;
  const algorithm = document.getElementById('algorithm').value;
  const start = {lat: window._selectedStart.lat, lon: window._selectedStart.lng};
  const goal = {lat: window._selectedGoal.lat, lon: window._selectedGoal.lng};
  await requestRoute({start, goal, algorithm});
}

function clearRoute(){
  if(routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
  if(startMarker) { map.removeLayer(startMarker); startMarker = null; }
  if(goalMarker) { map.removeLayer(goalMarker); goalMarker = null; }
  clearDebugLayers();
  stopDebugAnimation();
  debugSteps = [];
  setDebugControlsEnabled(false);
  debugStatus.textContent = 'Idle';
  stepIndicator.style.display = 'none';
  document.getElementById('results').style.display = 'none';
  document.getElementById('path').textContent = '';
  document.getElementById('cost-detail').textContent = '-';
  document.getElementById('nodes-detail').textContent = '-';
  document.getElementById('copy-route').disabled = true;
  document.getElementById('download-route').disabled = true;
  currentRoute = null;
  document.getElementById('metrics-table-body').innerHTML =
    '<tr class="placeholder-row"><td colspan="5">No search performed yet. Click Find Route to compare algorithms.</td></tr>';
  document.getElementById('start').value = '';
  document.getElementById('goal').value = '';
  window._selectedStart = null; window._selectedGoal = null; clickCount = 0;
}
