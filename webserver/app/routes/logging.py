from flask import request, jsonify, Blueprint
from app.controllers.database import log_event, get_all_logs, get_logs_by_user, log_suggestion
from flasgger import swag_from

logging_bp = Blueprint('logging', __name__)

@logging_bp.route('/logs', methods=['POST'])
@swag_from({
    'tags': ['Logging'],
    'summary': 'Log an event',
    'description': 'Logs the event to the database.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'time_lapse': {
                        'type': 'number',
                        'example': 1708
                        },
                    'event': {
                        'type': 'string',
                        'example': 'User logged in'
                        },
                    'metadata': {
                        'type': 'object',
                        'example': {
                            'userID': 12345,
                            }
                        }
                },
                'required': ['event', 'timelapse', 'metadata']
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
    """
    Logs the event to the database.
    See Swagger docs for more information.
    """
    data = request.json

    required_fields = ['time_lapse', 'event']
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
    """
    Retrieve all logs in the database
    See Swagger docs for more information.
    """
    try:
        logs = get_all_logs()
        return jsonify(logs), 200
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    
@logging_bp.route('/logs/<int:user_id>', methods=['GET'])
@swag_from({
    'tags': ['Logging'],
    'summary': 'TODO Retrieve logs by user ID',
    'description': 'Fetches all logged events associated with a specific user ID.',
    'parameters': [
        {
            'name': 'user_id',
            'in': 'path',
            'required': True,
            'type': 'integer',
            'description': 'The ID of the user whose logs are being retrieved.',
            'example': 12345
        }
    ],
    'responses': {
        '200': {
            'description': 'List of logs for the specified user',
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
        '404': {
            'description': 'No logs found for the specified user'
        },
        '500': {
            'description': 'Internal server error'
        }
    }
})
def get_logs_by_user_route(user_id):
    """
    Get all logs for a specific user
    See Swagger docs for more information.
    """
    try:
        logs = get_logs_by_user(user_id)

        if not logs:
            return jsonify({"status": "error", "message": "No logs found for this user"}), 404

        return jsonify(logs), 200
    except Exception as e:
        print(f"Error fetching logs for user {user_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
    

@logging_bp.route('/log-suggestion', methods=['POST'])
@swag_from({
    'tags': ['Logging'],
    'summary': 'Log a suggestion',
    'description': 'Logs a suggestion to the database.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'prompt': {
                        'type': 'string',
                        'example': 'function add(a, b)'
                    },
                    'suggestionText': {
                        'type': 'string',
                        'example': '{\n    return a + b;\n}'
                    },
                    'hasBug': {
                        'type': 'boolean',
                        'example': False
                    },
                    'model': {
                        'type': 'string',
                        'example': 'gpt-3'
                    }
                },
                'required': ['prompt', 'suggestionText', 'hasBug', 'model']
            }
        }
    ],
    'responses': {
        '200': {
            'description': 'Suggestion logged successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'example': 'success'},
                    'data': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'string', 'example': "12345"},
                            'prompt': {'type': 'string', 'example': 'function add(a, b)'},
                            'suggestionText': {'type': 'string', 'example': '{\n    return a + b;\n}'},
                            'hasBug': {'type': 'boolean', 'example': False},
                            'model': {'type': 'string', 'example': 'gpt-3'},
                            'created_at': {'type': 'timestamp', 'example': '2023-10-01T12:00:00Z'}
                        }
                    }
                }
            }
        },
        '400': {
            'description': 'Bad request or invalid input',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'example': 'error'},
                    'message': {'type': 'string', 'example': 'Missing required fields: prompt, suggestionText'}
                }
            }
        },
        '500': {
            'description': 'Internal server error',
            'schema': {
                'type': 'object',
                'properties': {
                    'status': {'type': 'string', 'example': 'error'},
                    'message': {'type': 'string', 'example': 'Internal server error'}
                }
            }
        }
    }
})
def log_suggestion_route():
    data = request.json

    # Validate required fields
    required_fields = ['prompt', 'suggestionText', 'hasBug', 'model']
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return jsonify({
            'status': 'error',
            'message': f'Missing required fields: {", ".join(missing_fields)}'
        }), 400

    suggestion = {
        'prompt': data['prompt'],
        'suggestion_text': data['suggestionText'],
        'has_bug': data['hasBug'],
        'model': data['model'],
    }

    try:
        logged_suggestion = log_suggestion(suggestion)

        data = {
            'prompt': logged_suggestion['prompt'],
            'suggestionText': logged_suggestion['suggestion_text'],
            'hasBug': logged_suggestion['has_bug'],
            'model': logged_suggestion['model'],
            'id': logged_suggestion['id']
        }

        return jsonify({
            'status': 'success',
            'data': data
        }), 200

    except Exception as e:
        print(f"Error logging suggestion: {e}")
        return jsonify({
            'status': 'error',
            'message': 'Internal server error'
        }), 500