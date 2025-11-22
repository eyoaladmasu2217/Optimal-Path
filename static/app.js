async function fetchNodes(){
  const res = await fetch('/api/nodes');
  const nodes = await res.json();
  const start = document.getElementById('start');
  const goal = document.getElementById('goal');
  nodes.forEach(n => {
    const opt1 = document.createElement('option');
    opt1.value = n.id; opt1.textContent = n.name;
    const opt2 = opt1.cloneNode(true);
    start.appendChild(opt1);
    goal.appendChild(opt2);
  });
}

async function findRoute(){
  const start = document.getElementById('start').value;
  const goal = document.getElementById('goal').value;
  const algorithm = document.getElementById('algorithm').value;
  const res = await fetch('/api/route', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({start, goal, algorithm})
  });
  const data = await res.json();
  const pathDiv = document.getElementById('path');
  const costDiv = document.getElementById('cost');
  if(data.error){
    pathDiv.textContent = 'Error: ' + data.error;
    costDiv.textContent = '';
    return;
  }
  pathDiv.textContent = data.path.map(p => p.name).join(' → ');
  costDiv.textContent = 'Total cost: ' + data.cost;
}

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

// Add a small legend control to the map
const legend = L.control({position: 'topright'});
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'map-legend');
  div.innerHTML = `
    <div class="item"><span class="legend-swatch" style="background:green"></span> Start</div>
    <div class="item"><span class="legend-swatch" style="background:red"></span> Goal</div>
    <div class="item"><span class="legend-swatch" style="background:blue"></span> Route</div>
  `;
  return div;
};
legend.addTo(map);

map.on('click', function(e){
  clickCount++;
  if(clickCount === 1){
    if(startMarker) map.removeLayer(startMarker);
    startMarker = L.circleMarker(e.latlng, {radius:8, color:'green', fillColor:'green', fillOpacity:0.8}).addTo(map).bindPopup('Start');
    // set start select to blank (so route uses coord)
    document.getElementById('start').value = '';
    startMarker.openPopup();
    window._selectedStart = e.latlng;
  } else if(clickCount === 2){
    if(goalMarker) map.removeLayer(goalMarker);
    goalMarker = L.circleMarker(e.latlng, {radius:8, color:'red', fillColor:'red', fillOpacity:0.8}).addTo(map).bindPopup('Goal');
    document.getElementById('goal').value = '';
    goalMarker.openPopup();
    window._selectedGoal = e.latlng;
    // trigger route
    requestRouteFromCoords();
    // reset for next pair
    clickCount = 0;
  }
});

async function requestRouteFromCoords(){
  if(!window._selectedStart || !window._selectedGoal) return;
  const algorithm = document.getElementById('algorithm').value;
  const start = {lat: window._selectedStart.lat, lon: window._selectedStart.lng};
  const goal = {lat: window._selectedGoal.lat, lon: window._selectedGoal.lng};
  const res = await fetch('/api/route', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({start, goal, algorithm})
  });
  const data = await res.json();
  const pathDiv = document.getElementById('path');
  const costDiv = document.getElementById('cost');
  if(data.error){ pathDiv.textContent = 'Error: ' + data.error; costDiv.textContent = ''; return; }

  // draw route on map
  if(routeLayer) map.removeLayer(routeLayer);
  const latlngs = data.path.map(p => [p.lat, p.lon]);
  if(latlngs.length) {
    routeLayer = L.polyline(latlngs, {color:'blue', weight:4}).addTo(map);
    map.fitBounds(routeLayer.getBounds(), {padding:[50,50]});
  }

  pathDiv.textContent = data.path.map(p => p.name).join(' → ');
  costDiv.textContent = 'Total cost: ' + data.cost;
}

function clearRoute(){
  if(routeLayer) { map.removeLayer(routeLayer); routeLayer = null; }
  if(startMarker) { map.removeLayer(startMarker); startMarker = null; }
  if(goalMarker) { map.removeLayer(goalMarker); goalMarker = null; }
  document.getElementById('path').textContent = '';
  document.getElementById('cost').textContent = '';
  // reset selects
  document.getElementById('start').value = '';
  document.getElementById('goal').value = '';
  window._selectedStart = null; window._selectedGoal = null; clickCount = 0;
}
