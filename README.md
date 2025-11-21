# Optimal-Path (Addis Ababa)

Minimal web app that finds a route between two nodes on a small sample Addis Ababa graph using A*, Greedy Best-First, or DFS. Backend is Python/Flask; frontend is static HTML/CSS/JS.

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

## Files

- `app.py` - Flask app and API endpoints
- `algorithms.py` - implementations of A*, Greedy Best-First, and DFS
- `data/addis_graph.json` - small sample graph with nodes and neighbors
- `templates/index.html` and `static/*` - frontend

## Notes

- The sample graph is minimal. For a realistic map, replace `data/addis_graph.json` with data extracted from OSM or your routing graph.
- Heuristic uses Euclidean distance on lat/lon (approximate). For better accuracy use haversine or proper projection.
