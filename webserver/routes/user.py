from flask import Blueprint, request, jsonify
from database import get_user_by_id, create_user
from flasgger import swag_from

users_bp = Blueprint('users', __name__)

@users_bp.route('/users/<user_id>', methods=['GET'])
@swag_from({
    'tags': ['Users'],
    'summary': 'TODO Get a specific user by ID',
    'description': 'Retrieves user details based on the provided user ID.',
    'parameters': [
        {
            'name': 'user_id',
            'in': 'path',
            'required': True,
            'type': 'string',
            'example': '123'
        }
    ],
    'responses': {
        '200': {
            'description': 'User found successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'string'},
                    'name': {'type': 'string'},
                    'email': {'type': 'string'}
                }
            }
        },
        '404': {
            'description': 'User not found',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def get_user_route(user_id):
    try:
        user = get_user_by_id(user_id)

        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        return jsonify(user), 200
    except Exception as e:
        print(f"Error fetching user {user_id}: {e}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500
    
@users_bp.route('/users', methods=['POST'])
@swag_from({
    'tags': ['Users'],
    'summary': 'TODO Create a new user',
    'description': 'Registers a new user with first name, last name, email, and password.',
    'parameters': [
        {
            'name': 'body',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'first_name': {'type': 'string', 'example': 'Jaime'},
                    'last_name': {'type': 'string', 'example': 'Nguyen'},
                    'email': {'type': 'string', 'example': 'jaime@example.com'},
                    'password': {'type': 'string', 'example': 'password123'}
                },
                'required': ['first_name', 'last_name', 'email', 'password']
            }
        }
    ],
    'responses': {
        '201': {
            'description': 'User created successfully',
            'schema': {
                'type': 'object',
                'properties': {
                    'id': {'type': 'string'},
                    'first_name': {'type': 'string'},
                    'last_name': {'type': 'string'},
                    'email': {'type': 'string'}
                }
            }
        },
        '400': {
            'description': 'Bad request (missing fields or email already exists)',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        },
        '500': {
            'description': 'Internal server error',
            'schema': {
                'type': 'object',
                'properties': {
                    'error': {'type': 'string'}
                }
            }
        }
    }
})
def create_user_route():
    """
    Create a new user with first name, last name, email, and password.
    """
    data = request.json

    required_fields = ['first_name', 'last_name', 'email', 'password']
    if not all(field in data and data[field] for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    first_name = data["first_name"]
    last_name = data["last_name"]
    email = data["email"]
    password = data["password"]

    result, status_code = create_user(first_name, last_name, email, password)
    return jsonify(result), status_code