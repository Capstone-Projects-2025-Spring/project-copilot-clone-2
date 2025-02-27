import pytest

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))
from webserver.app import create_app
import json


@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })

    yield app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

def test_index_route(client):
    response = client.get("/")
    assert response.status_code == 200

def test_logging_route(client):
    response = client.post(
        "/logs",
        data=json.dumps({
            "event": "test_event",
            "data": "test_data",
            "timestamp": 1708401940,
        }),
        content_type="application/json"
    )
    assert response.status_code == 200
    assert response.json == {"status": "logged"}

def test_suggestions_route_prompt(client):
    response = client.post(
        "/suggestion",
        data=json.dumps({"prompt": "Hello"}),
        content_type="application/json"
    )
    assert response.status_code == 200

def test_suggestions_route_no_prompt(client):
    response = client.post(
        "/suggestion",
        data=json.dumps({}),
        content_type="application/json"
    )
    assert response.status_code == 400