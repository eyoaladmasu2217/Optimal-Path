import math
import heapq
from typing import Dict, Any, List, Tuple, Set


def _haversine(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    """Return approximate distance in meters between two points (dicts with 'lat' and 'lon')
    using the Haversine formula.
    """
    lat1, lon1 = a.get('lat'), a.get('lon')
    lat2, lon2 = b.get('lat'), b.get('lon')
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    R = 6371000.0
    a_h = math.sin(dphi/2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a_h), math.sqrt(1 - a_h))
    return R * c


def _dist(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    """Calculate distance between two nodes."""
    return _haversine(a, b)


def a_star(graph: Dict[str, Any], start: str, goal: str) -> Tuple[List[str], float, List[Dict[str, Any]]]:
    """A* search algorithm on graph.

    graph: dict of node_id -> { 'lat', 'lon', 'neighbors': [{id, cost}, ...] }
    start, goal: node ids (strings)
    returns: Tuple of (path_list_of_ids, total_cost, trace_steps)
    """
    open_heap: List[Tuple[float, str]] = []
    heapq.heappush(open_heap, (0.0, start))
    came_from: Dict[str, Any] = {start: None}
    g_score: Dict[str, float] = {start: 0.0}
    visited: Set[str] = set()
    steps: List[Dict[str, Any]] = []

    while open_heap:
        _, current = heapq.heappop(open_heap)
        if current in visited:
            continue
        visited.add(current)

        # Record visualizer step
        steps.append({
            'current': current,
            'visited': list(visited),
            'frontier': list(set(item[1] for item in open_heap)),
            'came_from': came_from.copy()
        })

        if current == goal:
            break

        for edge in graph[current].get('neighbors', []):
            neighbor = edge['id']
            cost = edge.get('cost', 1.0)
            tentative_g = g_score[current] + cost
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f = tentative_g + _dist(graph.get(neighbor, {}), graph.get(goal, {}))
                heapq.heappush(open_heap, (f, neighbor))

    if goal not in came_from:
        return [], float('inf'), steps

    path: List[str] = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = came_from[cur]
    path.reverse()
    return path, g_score.get(goal, float('inf')), steps


def greedy_best_first(graph: Dict[str, Any], start: str, goal: str) -> Tuple[List[str], float, List[Dict[str, Any]]]:
    """Greedy best-first search using heuristic only (not guaranteed optimal)."""
    open_heap: List[Tuple[float, str]] = []
    heapq.heappush(open_heap, (_dist(graph.get(start, {}), graph.get(goal, {})), start))
    came_from: Dict[str, Any] = {start: None}
    visited: Set[str] = set()
    steps: List[Dict[str, Any]] = []

    while open_heap:
        _, current = heapq.heappop(open_heap)
        if current in visited:
            continue
        visited.add(current)

        # Record visualizer step
        steps.append({
            'current': current,
            'visited': list(visited),
            'frontier': list(set(item[1] for item in open_heap)),
            'came_from': came_from.copy()
        })

        if current == goal:
            break

        for edge in graph[current].get('neighbors', []):
            neighbor = edge['id']
            if neighbor in visited:
                continue
            came_from[neighbor] = current
            heapq.heappush(open_heap, (_dist(graph.get(neighbor, {}), graph.get(goal, {})), neighbor))

    if goal not in came_from:
        return [], float('inf'), steps

    path: List[str] = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = came_from[cur]
    path.reverse()

    # compute actual path cost by summing edge costs
    total = 0.0
    for i in range(len(path) - 1):
        u = path[i]
        v = path[i+1]
        for e in graph[u].get('neighbors', []):
            if e['id'] == v:
                total += e.get('cost', 1.0)
                break
    return path, total, steps


def dfs(graph: Dict[str, Any], start: str, goal: str) -> Tuple[List[str], float, List[Dict[str, Any]]]:
    """Depth-first search (stack) returning first found path and visualizer steps."""
    stack: List[Tuple[str, Any]] = [(start, None)]
    came_from: Dict[str, Any] = {}
    visited: Set[str] = set()
    steps: List[Dict[str, Any]] = []
    path_found = False

    while stack:
        current, parent = stack.pop()
        if current in visited:
            continue
        visited.add(current)
        came_from[current] = parent

        # frontier is the list of node IDs on the stack
        frontier = [item[0] for item in stack]

        steps.append({
            'current': current,
            'visited': list(visited),
            'frontier': list(dict.fromkeys(frontier)),
            'came_from': came_from.copy()
        })

        if current == goal:
            path_found = True
            break

        for edge in graph[current].get('neighbors', []):
            neighbor = edge['id']
            if neighbor not in visited:
                stack.append((neighbor, current))

    if not path_found or goal not in came_from:
        return [], float('inf'), steps

    path: List[str] = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = came_from[cur]
    path.reverse()

    # compute cost
    total = 0.0
    for i in range(len(path) - 1):
        u = path[i]
        v = path[i+1]
        for e in graph[u].get('neighbors', []):
            if e['id'] == v:
                total += e.get('cost', 1.0)
                break
    return path, total, steps
