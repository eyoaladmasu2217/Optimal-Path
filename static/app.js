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
