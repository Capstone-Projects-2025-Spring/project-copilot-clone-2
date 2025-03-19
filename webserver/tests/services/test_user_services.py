# import os
# import sys
# sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/../.."))

# import pytest
# from unittest.mock import MagicMock, patch, Mock
# from app.controllers.database import client
# from app.models.user import User
# from app.models.errors import UserAlreadyExistsError, DatabaseError
# from app.services.user_service import get_user_by_id

# import pytest
# from unittest.mock import MagicMock
# from app.services.user_service import get_user_by_id
# from flask import g

# @pytest.fixture
# def mock_database(app, mocker):
#     """Manually set `g.db` to a mock client to bypass `LocalProxy`."""
#     with app.app_context():
#         mock_client = mocker.MagicMock()
#         g.db = mock_client  # Directly override the database client

#         # Mock table and query chain
#         mock_table = mock_client.table.return_value
#         mock_select = mock_table.select.return_value
#         mock_eq = mock_select.eq.return_value
#         mock_execute = mock_eq.execute.return_value

#         # Mock response data
#         mock_execute.data = [
#             {"id": "1", "first_name": "John", "last_name": "Doe", "email": "john.doe@example.com"}
#         ]

#         yield mock_client  # Return the mock for assertions if needed

# def test_get_user_by_id_success(mock_database, app):
#     with app.app_context():
#         user = get_user_by_id("1")

#         assert user is not None
#         assert user.id == "1"
#         assert user.first_name == "John"
#         assert user.last_name == "Doe"
#         assert user.email == "john.doe@example.com"

# def test_get_user_by_id_not_found(mock_database, app):
#     with app.app_context():
#         # Mock an empty response
#         mock_response = MagicMock()
#         mock_response.data = []
#         mock_response.error = None  # Ensure no errors are returned
#         mock_database.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response

#         # Test the function
#         user = get_user_by_id("999")
        
#         # Assertions
#         assert user is None

# # def test_get_user_by_id_exception(mock_database, app):
# #     with app.app_context():
# #         # Raise DatabaseError directly from the mock
# #         mock_database.table.return_value.select.return_value.eq.return_value.execute.side_effect = DatabaseError("Database error")

# #         # Ensure get_user_by_id raises DatabaseError
# #         with pytest.raises(DatabaseError, match="Database error"):
# #             get_user_by_id("1")
