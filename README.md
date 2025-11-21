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
 
## Building a realistic Addis Ababa graph (optional)

You can use `graph_builder.py` to download the drivable road network for Addis Ababa and create a JSON graph usable by the app. This requires `osmnx` and its dependencies (which are larger and may require system packages).

Install osmnx (optional):

```powershell
pip install osmnx
```

Run the builder:

```powershell
python graph_builder.py
```

This will produce `data/addis_graph.json`. The app will automatically load it on startup.

## Map UI

Open the app in a browser and use the Leaflet map: click once to set the Start, click again to set the Goal. The chosen algorithm will run and the path will be drawn on the map.

## Tests

Run unit tests with:

```powershell
pytest -q
```
