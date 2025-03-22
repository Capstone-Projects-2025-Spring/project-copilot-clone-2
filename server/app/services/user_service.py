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
        print("Calling Supabase client...")  # Debugging line
        response = client.table("users").select("*").eq("id", user_id).execute()
        print("Got response:", response)

        if not response.data:
            return None
        
        user_data = response.data[0]
        return User(**user_data)
    
    except Exception as e:
        print(f"Error fetching user {user_id}: {e}")
        raise DatabaseError(f"Failed to retrieve user: {str(e)}")


def create_user(id: str, first_name: str, last_name: str, email: str):
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

        response = client.table("users").insert({
            "id": id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
        }).execute()

        return response.data[0]
    
    except Exception as e:
        print("In create user")
        print(f"Error while creating user: {e}")
        raise e