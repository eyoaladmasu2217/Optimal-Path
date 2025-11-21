from algorithms import a_star, greedy_best_first, dfs
from graph import load_graph


def test_algorithms_on_sample_graph():
    g = load_graph('data/addis_graph.json')
    # simple path from piassa to bole should exist
    path_a, cost_a = a_star(g, 'piassa', 'bole')
    path_g, cost_g = greedy_best_first(g, 'piassa', 'bole')
    path_d, cost_d = dfs(g, 'piassa', 'bole')

    assert path_a[0] == 'piassa' and path_a[-1] == 'bole'
    assert cost_a != float('inf')
    assert path_g[0] == 'piassa' and path_g[-1] == 'bole'
    assert cost_g != float('inf')
    # DFS may find a path but not necessarily optimal; ensure it finds any path
    assert path_d[0] == 'piassa' and path_d[-1] == 'bole'
*** End Patch