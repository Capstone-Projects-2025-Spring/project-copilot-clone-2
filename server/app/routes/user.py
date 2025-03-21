from flask import Blueprint, request
from app.services.user_service import get_user_by_id, create_user
from app.models.response import *
from flasgger import swag_from
from app.models.status_codes import StatusCodes



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
            return success_response(
                f"User not found for id {user_id}",
                None,
                StatusCodes.NOT_FOUND
            )

        return success_response(
            f"User for id {user_id}",
            user.to_json(),
            StatusCodes.OK
        )
    
    except Exception as e:
        return error_response(
            f"Error fetching user {user_id}: {e}",
            None,
            StatusCodes.SERVER_ERROR
        )
    

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
        return error_response(
            f"Missing required fields: {', '.join(required_fields)}",
            None,
            StatusCodes.BAD_REQUEST
        )

    first_name = data["first_name"]
    last_name = data["last_name"]
    email = data["email"]
    password = data["password"]

    try:
        create_user(first_name, last_name, email, password)
        return success_response(
            "User created successfully",
            None,
            StatusCodes.CREATED
        )
    
    except Exception as e:
        return error_response(
            "Error creating user",
            {
                "error": str(e)
            }
        )