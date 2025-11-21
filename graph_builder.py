"""
Graph builder using osmnx (optional). This script downloads the drivable road network
for Addis Ababa (by name) and serializes a simplified graph to `data/addis_graph.json`.

Usage (PowerShell):

python graph_builder.py

Notes:
- `osmnx` has non-trivial dependencies. Install via:
  pip install osmnx

- The script stores nodes as id -> {name, lat, lon, neighbors: [{id, cost}, ...]}
  where cost is edge length in meters.
"""

import json
import os

try:
    import osmnx as ox
except Exception as e:
    raise RuntimeError("osmnx is required to run this builder. Install with 'pip install osmnx'")


def build_addis_graph(save_path='data/addis_graph.json'):
    # download the driving network for Addis Ababa
    print('Downloading road network for Addis Ababa (this may take a while)...')
    G = ox.graph_from_place('Addis Ababa, Ethiopia', network_type='drive')

    # ensure output dir
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    nodes = {}
    for nid, data in G.nodes(data=True):
        nodes[str(nid)] = {
            'name': data.get('name') or str(nid),
            'lat': float(data.get('y')),
            'lon': float(data.get('x')),
            'neighbors': []
        }

    for u, v, data in G.edges(data=True):
        u_s = str(u); v_s = str(v)
        length = float(data.get('length', 1.0))
        # add neighbor both ways if graph is undirected-like; osmnx graphs are directed
        nodes[u_s]['neighbors'].append({'id': v_s, 'cost': length})

    with open(save_path, 'w', encoding='utf-8') as f:
        json.dump(nodes, f, indent=2)
    print(f'Graph saved to {save_path} (nodes: {len(nodes)})')


if __name__ == '__main__':
    build_addis_graph()
