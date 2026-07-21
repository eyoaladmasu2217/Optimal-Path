from algorithms import a_star, greedy_best_first, dfs, bfs, dijkstra
from graph import load_graph


def test_algorithms_on_sample_graph():
    g = load_graph('data/addis_graph.json')
    # Simple path from Piassa to Bole should exist
    path_a, cost_a, steps_a = a_star(g, 'piassa', 'bole')
    path_g, cost_g, steps_g = greedy_best_first(g, 'piassa', 'bole')
    path_d, cost_d, steps_d = dfs(g, 'piassa', 'bole')
    path_b, cost_b, steps_b = bfs(g, 'piassa', 'bole')
    path_dj, cost_dj, steps_dj = dijkstra(g, 'piassa', 'bole')

    # Verify A* search results
    assert path_a[0] == 'piassa' and path_a[-1] == 'bole'
    assert cost_a != float('inf')
    assert len(steps_a) > 0
    assert 'current' in steps_a[0]
    assert 'visited' in steps_a[0]
    assert 'frontier' in steps_a[0]
    assert 'came_from' in steps_a[0]

    # Verify Greedy Best-First results
    assert path_g[0] == 'piassa' and path_g[-1] == 'bole'
    assert cost_g != float('inf')
    assert len(steps_g) > 0

    # Verify DFS search results
    assert path_d[0] == 'piassa' and path_d[-1] == 'bole'
    assert cost_d != float('inf')
    assert len(steps_d) > 0

    # Verify BFS search results
    assert path_b[0] == 'piassa' and path_b[-1] == 'bole'
    assert cost_b != float('inf')
    assert len(steps_b) > 0

    # Verify Dijkstra search results
    assert path_dj[0] == 'piassa' and path_dj[-1] == 'bole'
    assert cost_dj != float('inf')
    assert len(steps_dj) > 0

    # Dijkstra and A* should find equally optimal costs on this graph
    assert cost_dj == cost_a