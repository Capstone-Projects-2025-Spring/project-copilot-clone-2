from flask import request, Blueprint
from app.services.log_service import log_event, get_all_logs, get_logs_by_user, log_suggestion
from flasgger import swag_from
from app.models.response import *
from app.models.status_codes import StatusCodes



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
                    'event': {
                        'type': 'string',
                        'example': 'User logged in'
                        },
                    'metadata': {
                        'type': 'object',
                        'example': {
                            'userID': 12345,
                            'time_lapse': 1708
                            }
                        }
                },
                'required': ['event', 'metadata']
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
                    'message': {'type': 'string', 'example': 'Missing required fields: event'}
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

    required_fields = ['event', 'time_lapse', 'metadata']
    missing_fields = [field for field in required_fields if field not in data]

    if missing_fields:
        return error_response(
            f"Missing required fields: {', '.join(missing_fields)}",
            None,
            StatusCodes.BAD_REQUEST
        )

    try:
        log_event(data)
        return success_response(
            "Logged event",
            None,
            StatusCodes.CREATED
        )
    
    except Exception as e:
        return error_response(
            f"Error logging event: {e}",
            None,
            StatusCodes.SERVER_ERROR
        )


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
def get_all_logs_route():
    """
    Retrieve all logs in the database
    See Swagger docs for more information.
    """
    try:
        logs = get_all_logs()
        return success_response(
            "All logs",
            logs,
            StatusCodes.OK
        )
    
    except Exception as e:
        return error_response(
            f"Error fetching logs: {e}",
            None,
            StatusCodes.SERVER_ERROR
        )


@logging_bp.route('/logs/<string:user_id>', methods=['GET'])
@swag_from({
    'tags': ['Logging'],
    'summary': 'TODO Retrieve logs by user ID',
    'description': 'Fetches all logged events associated with a specific user ID.',
    'parameters': [
        {
            'name': 'user_id',
            'in': 'path',
            'required': True,
            'type': 'string',
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
            return success_response(
                f"No logs found for user {user_id}",
            )

        return success_response(
            f"Logs for user {user_id}",
            logs,
        )
    except Exception as e:
        return error_response(
            f"Error fetching logs for user {user_id}: {e}",
            None,
            StatusCodes.SERVER_ERROR
        )
    

@logging_bp.route('/logs/suggestion', methods=['POST'])
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
        return error_response(
            f"Missing required fields: {', '.join(missing_fields)}",
            None,
            StatusCodes.BAD_REQUEST
        )

    suggestion = {
        'prompt': data['prompt'],
        'suggestion_text': data['suggestionText'],
        'has_bug': data['hasBug'],
        'model': data['model'],
    }

    try:
        logged_suggestion = log_suggestion(suggestion)

        return success_response(
            "Logged suggestion",
            logged_suggestion['id'],
            StatusCodes.CREATED
        )
    
    except Exception as e:
        return error_response(
            f"Error logging event: {e}",
            None,
            StatusCodes.SERVER_ERROR
        )