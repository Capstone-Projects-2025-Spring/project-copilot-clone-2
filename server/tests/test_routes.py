import pytest
from unittest.mock import patch, Mock
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))
from app import create_app
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
            "metadata": {
                "userID": 12345
            },
            "time_lapse": 1708
        }),
        content_type="application/json"
    )
    assert response.status_code == 201
    assert response.json.get("status") == "Success"

@pytest.fixture
def mock_requests_post(mocker):
    mock_response = {
        "response": "Mocked response for: Hello"
    }
    
    return mocker.patch("requests.post", return_value=Mock(status_code=200, json=lambda: mock_response))


def test_suggestions_route_prompt(mock_requests_post, client):
    response = client.post(
        "/suggestion",
        data=json.dumps({"prompt": "Hello"}),
        content_type="application/json"
    )

    assert response.status_code == 200
    assert response.json.get("data") == {"suggestions": ["Mocked response for: Hello"]}


def test_suggestions_route_no_prompt(client):
    response = client.post(
        "/suggestion",
        data=json.dumps({}),
        content_type="application/json"
    )

    assert response.status_code == 400
    assert response.json.get("message") == "No prompt provided"