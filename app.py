from flask import Flask, jsonify, request, render_template, Response
from graph import load_graph, nearest_node
import algorithms
import time
from typing import Dict, Any, Union, Optional, Callable, Tuple, List

app = Flask(__name__)

# Load sample Addis Ababa graph
GRAPH: Dict[str, Any] = load_graph('data/addis_graph.json')

ALGORITHMS: Dict[str, Callable[..., Tuple[List[str], float, List[Dict[str, Any]]]]] = {
    'astar': algorithms.a_star,
    'greedy': algorithms.greedy_best_first,
    'dfs': algorithms.dfs,
    'bfs': algorithms.bfs,
    'dijkstra': algorithms.dijkstra,
}


@app.route('/')
def index() -> str:
    """Render the main index page."""
    return render_template('index.html')


@app.route('/api/nodes')
def nodes() -> Response:
    """Return node ID and name for dropdown selects."""
    nodes_list = [
        { 'id': nid, 'name': data.get('name', nid) }
        for nid, data in GRAPH.items()
    ]
    return jsonify(nodes_list)


@app.route('/api/route', methods=['POST'])
def route() -> Union[Response, tuple]:
    """Calculate the route using the specified pathfinding algorithm."""
    body = request.get_json() or {}
    start: Optional[Union[str, Dict[str, float]]] = body.get('start')
    goal: Optional[Union[str, Dict[str, float]]] = body.get('goal')
    algo: str = body.get('algorithm', 'astar')

    def resolve(node_spec: Optional[Union[str, Dict[str, Any]]]) -> Optional[str]:
        return _resolve_node(node_spec)

    start_resolved = resolve(start)
    goal_resolved = resolve(goal)

    if start_resolved is None or goal_resolved is None:
        return jsonify({'error': 'start or goal node not found / invalid coordinates'}), 400

    if start_resolved not in GRAPH or goal_resolved not in GRAPH:
        return jsonify({'error': 'start or goal node not found'}), 400

    algo_fn = ALGORITHMS.get(algo)
    if algo_fn is None:
        return jsonify({'error': 'unknown algorithm'}), 400

    path, cost, steps = algo_fn(GRAPH, start_resolved, goal_resolved)

    # convert path of ids to node info
    path_info = [
        {
            'id': nid,
            'name': GRAPH[nid].get('name'),
            'lat': GRAPH[nid].get('lat'),
            'lon': GRAPH[nid].get('lon')
        }
        for nid in path
    ]

    return jsonify({'path': path_info, 'cost': cost, 'steps': steps})


def _resolve_node(node_spec: Optional[Union[str, Dict[str, Any]]]) -> Optional[str]:
    if isinstance(node_spec, dict):
        lat = node_spec.get('lat')
        lon = node_spec.get('lon')
        if lat is None or lon is None:
            return None
        return nearest_node(GRAPH, float(lat), float(lon))
    return node_spec


@app.route('/api/compare', methods=['POST'])
def compare() -> Union[Response, tuple]:
    """Run all algorithms on the same start/goal and return performance metrics."""
    body = request.get_json() or {}
    start_resolved = _resolve_node(body.get('start'))
    goal_resolved = _resolve_node(body.get('goal'))

    if start_resolved is None or goal_resolved is None:
        return jsonify({'error': 'start or goal node not found / invalid coordinates'}), 400

    if start_resolved not in GRAPH or goal_resolved not in GRAPH:
        return jsonify({'error': 'start or goal node not found'}), 400

    results = []
    for name, algo_fn in ALGORITHMS.items():
        t0 = time.perf_counter()
        path, cost, steps = algo_fn(GRAPH, start_resolved, goal_resolved)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0
        visited_count = len(steps[-1]['visited']) if steps else 0
        results.append({
            'algorithm': name,
            'cost': cost,
            'visited_nodes': visited_count,
            'steps_count': len(steps),
            'elapsed_ms': round(elapsed_ms, 2),
            'path_length': len(path),
        })

    return jsonify({'results': results})


if __name__ == '__main__':
    app.run(debug=True)
