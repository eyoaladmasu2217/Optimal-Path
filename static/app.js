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

map.on('click', function(e){
  clickCount++;
  if(clickCount === 1){
    if(startMarker) map.removeLayer(startMarker);
    startMarker = L.marker(e.latlng, {icon: L.icon({iconUrl:'/static/marker-icon.png', iconSize:[25,41], iconAnchor:[12,41]})}).addTo(map).bindPopup('Start');
    // set start select to blank (so route uses coord)
    document.getElementById('start').value = '';
    startMarker.openPopup();
    window._selectedStart = e.latlng;
  } else if(clickCount === 2){
    if(goalMarker) map.removeLayer(goalMarker);
    goalMarker = L.marker(e.latlng).addTo(map).bindPopup('Goal');
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
  routeLayer = L.polyline(latlngs, {color:'blue', weight:4}).addTo(map);
  map.fitBounds(routeLayer.getBounds(), {padding:[50,50]});

  pathDiv.textContent = data.path.map(p => p.name).join(' → ');
  costDiv.textContent = 'Total cost: ' + data.cost;
}
