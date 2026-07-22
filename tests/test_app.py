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