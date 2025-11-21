import math
import heapq


def _dist(a, b):
    # Euclidean distance on lat/lon for heuristic (approximate)
    lat1, lon1 = a.get('lat'), a.get('lon')
    lat2, lon2 = b.get('lat'), b.get('lon')
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0
    # simple Pythagorean approximation (not great for long distances but fine here)
    return math.hypot(lat1 - lat2, lon1 - lon2)


def a_star(graph, start, goal):
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
                f = tentative_g + _dist(graph[neighbor], graph[goal])
                heapq.heappush(open_heap, (f, neighbor))

    if goal not in came_from:
        return [], float('inf')

    # reconstruct path
    path = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = came_from[cur]
    path.reverse()
    return path, g_score.get(goal, float('inf'))


def greedy_best_first(graph, start, goal):
    open_heap = []
    heapq.heappush(open_heap, (_dist(graph[start], graph[goal]), start))
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
            heapq.heappush(open_heap, (_dist(graph[neighbor], graph[goal]), neighbor))

    if goal not in came_from:
        return [], float('inf')

    # compute path and cost
    path = []
    cur = goal
    while cur is not None:
        path.append(cur)
        cur = came_from[cur]
    path.reverse()

    # compute actual cost along edges
    total = 0
    for i in range(len(path) - 1):
        u = path[i]
        v = path[i + 1]
        # find edge cost
        for e in graph[u].get('neighbors', []):
            if e['id'] == v:
                total += e.get('cost', 1)
                break
    return path, total


def dfs(graph, start, goal):
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
