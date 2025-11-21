import json


def load_graph(path='data/addis_graph.json'):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    # expect data to be dict of id -> {name, lat, lon, neighbors: [{id, cost}, ...]}
    return data
