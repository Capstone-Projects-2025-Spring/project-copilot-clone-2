from app.controllers.database import client
from app.models.user import User
from app.models.errors import UserAlreadyExistsError, DatabaseError



def get_user_by_id(user_id: str):
    """
    Fetch a single user by ID.

    Args:
        user_id (str): The unique identifier of the user.

    Returns:
        dict: A dictionary containing user details if found.
        None: If the user does not exist.

    Raises:
        Exception: If there is an error during the database query.
    """
    try:
        response = client.table("users").select("*").eq("id", user_id).execute()
        if not response.data:
            return None
        
        user_data = response.data[0]
        return User(**user_data)
    
    except Exception as e:
        print(f"Error fetching user {user_id}: {e}")
        raise e


def create_user(first_name: str, last_name: str, email: str, password: str):
    """
    Create a user in the database

        Args:
        first_name (str): The first name of the user.
        last_name (str): The last name of the user.
        email (str): The email address of the user.
        password (str): The user's password (hashed before storage).

    Returns:
        tuple: A tuple containing:
            - dict: The created user data (if successful).
            - int: HTTP status code (201 for success, 400 for errors, 500 for server errors).

    Raises:
        Exception: If there is an issue with database insertion.
    """
    try:
        if client is None:
            raise RuntimeError("Database client is not initialized.")
        
        hashed_password = User.hash_password(password)

        response = client.table("users").insert({
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            #"password": hashed_password
        }).execute()

        return response.data[0]
    
    except Exception as e:
        print("In create user")
        print(f"Error while creating user: {e}")
        raise e