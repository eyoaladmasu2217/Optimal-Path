import json
from typing import Dict, Any, Optional


def load_graph(path: str = 'data/addis_graph.json') -> Dict[str, Any]:
    """Loads the graph structure from a serialized JSON file.

    Expected schema: Dict[node_id, Dict[name/lat/lon/neighbors]]
    """
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading graph from {path}: {e}")
        return {}


def nearest_node(graph: Dict[str, Any], lat: float, lon: float) -> Optional[str]:
    """Finds the nearest node in the graph to the given lat/lon coordinates
    using Euclidean distance.
    """
    best: Optional[str] = None
    best_d: float = float('inf')
    for nid, data in graph.items():
        nlat = data.get('lat')
        nlon = data.get('lon')
        if nlat is None or nlon is None:
            continue
        d = (nlat - lat) ** 2 + (nlon - lon) ** 2
        if d < best_d:
            best_d = d
            best = nid
    return best
