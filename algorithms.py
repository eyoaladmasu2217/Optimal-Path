import math
import heapq


def _haversine(a, b):
    """Return approximate distance in meters between two points (dicts with 'lat' and 'lon')."""
    lat1, lon1 = a.get('lat'), a.get('lon')
    lat2, lon2 = b.get('lat'), b.get('lon')
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    R = 6371000.0
    a_h = math.sin(dphi/2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a_h), math.sqrt(1 - a_h))
    return R * c


def _dist(a, b):
    return _haversine(a, b)


def a_star(graph, start, goal):
    """A* search on graph.

    graph: dict of node_id -> { 'lat', 'lon', 'neighbors': [{id, cost}, ...] }
    start, goal: node ids (strings)
    returns: (path_list_of_ids, total_cost)
    """
    open_heap = []
    heapq.heappush(open_heap, (0, start))
    came_from = {start: None}
    g_score = {start: 0}

    while open_heap:
        _, current = heapq.heappop(open_heap)
        if current == goal:
            break

        for edge in graph[current].get('neighbors', []):
            neighbor = edge['id']
            cost = edge.get('cost', 1)
            tentative_g = g_score[current] + cost
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f = tentative_g + _dist(graph.get(neighbor, {}), graph.get(goal, {}))
                heapq.heappush(open_heap, (f, neighbor))

    if goal not in came_from:
        return [], float('inf')

    path = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = came_from[cur]
    path.reverse()
    return path, g_score.get(goal, float('inf'))


def greedy_best_first(graph, start, goal):
    """Greedy best-first search using heuristic only (not guaranteed optimal)."""
    open_heap = []
    heapq.heappush(open_heap, (_dist(graph.get(start, {}), graph.get(goal, {})), start))
    came_from = {start: None}
    visited = set()

    while open_heap:
        _, current = heapq.heappop(open_heap)
        if current == goal:
            break
        if current in visited:
            continue
        visited.add(current)

        for edge in graph[current].get('neighbors', []):
            neighbor = edge['id']
            if neighbor in visited:
                continue
            came_from[neighbor] = current
            heapq.heappush(open_heap, (_dist(graph.get(neighbor, {}), graph.get(goal, {})), neighbor))

    if goal not in came_from:
        return [], float('inf')

    path = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = came_from[cur]
    path.reverse()

    # compute actual path cost by summing edge costs
    total = 0
    for i in range(len(path) - 1):
        u = path[i]; v = path[i+1]
        for e in graph[u].get('neighbors', []):
            if e['id'] == v:
                total += e.get('cost', 1)
                break
    return path, total


def dfs(graph, start, goal):
    """Depth-first search (stack) returning first found path (not optimal)."""
    stack = [(start, [start], 0)]
    visited = set()

    while stack:
        current, path, cost = stack.pop()
        if current == goal:
            return path, cost
        if current in visited:
            continue
        visited.add(current)
        for edge in graph[current].get('neighbors', []):
            neighbor = edge['id']
            stack.append((neighbor, path + [neighbor], cost + edge.get('cost', 1)))

    return [], float('inf')
