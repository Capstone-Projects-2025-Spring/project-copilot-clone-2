from flask import request, jsonify, Blueprint
from database import log_event, get_all_logs
from flasgger import swag_from

logging_bp = Blueprint('logging', __name__)

@logging_bp.route('/log', methods=['POST'])
@swag_from({
    'tags': ['Logging'],
    'summary': 'Log an event',
    'description': 'Receives an event and logs the event.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'timestamp': {
                        'type': 'number',
                        'example': 1708401940
                        },
                    'event': {
                        'type': 'string',
                        'example': 'User logged in'
                        },
                    'data': {
                        'type': 'object',
                        'example': {
                            'userID': 12345,
                            }
                        }
                },
                'required': ['event', 'timestamp', 'data']
            }
        }
    ],
    'responses': {
        '200': {
            'description': 'Event logged successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'example': 'logged'}
                }
            }
        },
        '400': {
            'description': 'Bad request or invalid input',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'example': 'error'},
                    'message': {'type': 'string', 'example': 'Missing required fields: event, text'}
                }
            }
        },
        '500': {
            'description': 'Internal server error'
        }
    }
})
def log_event_route():
    data = request.json

    required_fields = ['timestamp', 'event', 'data']
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return jsonify({"status": "error", "message": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    try:
        log_event(data)
        return jsonify({"status": "logged"}), 200
    except Exception as e:
        print(f"Error in logging event: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@logging_bp.route('/logs', methods=['GET'])
@swag_from({
    'tags': ['Logging'],
    'summary': 'Retrieve all logs',
    'description': 'Fetches all logged events from the database.',
    'responses': {
        '200': {
            'description': 'List of logs',
            'schema': {
                'type': 'array',
                'items': {
                    'type': 'object',
                    'properties': {
                        'id': {'type': 'integer', 'example': 1},
                        'timestamp': {'type': 'number', 'example': 1708401940},
                        'event': {'type': 'string', 'example': 'user_login'},
                        'data': {'type': 'object', 'example': {'user_id': 12345}}
                    }
                }
            }
        },
        '500': {
            'description': 'Internal server error'
        }
    }
})
def get_logs_route():
    try:
        logs = get_all_logs()
        return jsonify(logs), 200
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500