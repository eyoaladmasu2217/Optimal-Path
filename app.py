from flask import Flask, jsonify, request, render_template
from graph import load_graph, nearest_node
import algorithms

app = Flask(__name__)

# Load sample Addis Ababa graph
GRAPH = load_graph('data/addis_graph.json')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/nodes')
def nodes():
    # return node id and name for frontend selects
    nodes = [
        { 'id': nid, 'name': data.get('name', nid) }
        for nid, data in GRAPH.items()
    ]
    return jsonify(nodes)


@app.route('/api/route', methods=['POST'])
def route():
    body = request.get_json()
    start = body.get('start')
    goal = body.get('goal')
    algo = body.get('algorithm', 'astar')

    # allow start/goal to be provided as coordinates {lat, lon} or as node id
    def resolve(node_spec):
        if isinstance(node_spec, dict):
            lat = node_spec.get('lat')
            lon = node_spec.get('lon')
            if lat is None or lon is None:
                return None
            return nearest_node(GRAPH, float(lat), float(lon))
        return node_spec

    start_resolved = resolve(start)
    goal_resolved = resolve(goal)

    if start_resolved is None or goal_resolved is None:
        return jsonify({'error': 'start or goal node not found / invalid coordinates'}), 400

    if start_resolved not in GRAPH or goal_resolved not in GRAPH:
        return jsonify({'error': 'start or goal node not found'}), 400

    if algo == 'astar':
        path, cost = algorithms.a_star(GRAPH, start_resolved, goal_resolved)
    elif algo == 'greedy':
        path, cost = algorithms.greedy_best_first(GRAPH, start_resolved, goal_resolved)
    elif algo == 'dfs':
        path, cost = algorithms.dfs(GRAPH, start_resolved, goal_resolved)
    else:
        return jsonify({'error': 'unknown algorithm'}), 400

    # convert path of ids to node info
    path_info = [
        { 'id': nid, 'name': GRAPH[nid].get('name'), 'lat': GRAPH[nid].get('lat'), 'lon': GRAPH[nid].get('lon') }
        for nid in path
    ]

    return jsonify({'path': path_info, 'cost': cost})


if __name__ == '__main__':
    app.run(debug=True)
