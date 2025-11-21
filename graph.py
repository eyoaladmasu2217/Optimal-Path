import json


def load_graph(path='data/addis_graph.json'):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # expect data to be dict of id -> {name, lat, lon, neighbors: [{id, cost}, ...]}
    return data


def nearest_node(graph, lat, lon):
    # brute-force nearest node by Euclidean distance on lat/lon
    best = None
    best_d = float('inf')
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
