from app import app


def test_nodes_include_coordinates():
    client = app.test_client()
    response = client.get('/api/nodes')

    assert response.status_code == 200
    assert all('lat' in node and 'lon' in node for node in response.get_json())


def test_route_returns_path_and_trace():
    client = app.test_client()
    response = client.post('/api/route', json={
        'start': 'piassa',
        'goal': 'bole',
        'algorithm': 'astar',
    })

    body = response.get_json()
    assert response.status_code == 200
    assert body['path'][0]['id'] == 'piassa'
    assert body['path'][-1]['id'] == 'bole'
    assert body['steps']


def test_route_rejects_invalid_coordinates():
    client = app.test_client()
    response = client.post('/api/route', json={
        'start': {'lat': 'unknown', 'lon': 38.75},
        'goal': 'bole',
        'algorithm': 'astar',
    })

    assert response.status_code == 400
    assert 'invalid coordinates' in response.get_json()['error']