# Optimal-Path (Addis Ababa)

Interactive web app that finds routes between locations on a sample Addis Ababa graph. Choose A*, Dijkstra, Greedy Best-First, BFS, or DFS, then inspect the search trace on the map.

The frontend also supports map-based start and goal selection, algorithm comparison, a step-by-step debugger, recent route history, and route copy/download actions. Backend is Python/Flask; frontend is static HTML/CSS/JS.

## Setup

1. Create a virtual environment and activate it (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Run the app:

```powershell
python app.py
```

3. Open your browser to `http://127.0.0.1:5000/`.
