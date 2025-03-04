import base64
import hashlib
import os
import secrets

from dotenv import load_dotenv
import bcrypt
from supabase.client import Client, ClientOptions
from werkzeug.local import LocalProxy

from flask_storage import FlaskSessionStorage
from flask import g, session

load_dotenv()

SUPABASE_URL: str = os.getenv('SUPABASE_URL')
SUPABASE_KEY: str = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY. Check your .env file.")

def get_supabase() -> Client:
    if "supabase" not in g:
        g.supabase = Client(
            SUPABASE_URL,
            SUPABASE_KEY,
            options=ClientOptions(
                storage=FlaskSessionStorage(),
                flow_type="pkce"
            ),
        )
        return g.supabase

client: Client = LocalProxy(get_supabase)

def generate_code_verifier():
   """Generate a secure random code verifier (43-128 characters)."""
   return secrets.token_urlsafe(64)  # Secure random 64-character string

def generate_code_challenge(verifier):
   """Create a SHA256 challenge from the code verifier (RFC 7636)."""
   sha256_hash = hashlib.sha256(verifier.encode()).digest()
   challenge = base64.urlsafe_b64encode(sha256_hash).decode().rstrip("=")  # Remove '=' padding
   return challenge

def log_event(event):
    """
    Logs an event by inserting it into the 'Logs' table in the database.

    Args:
        event (dict): A dictionary containing event details. Expected keys are:
            - 'event': The name of the event.
            - 'time_lapse': A textual description of the event.
            - 'metadata': Additional data associated with the event.

    Raises:
        Exception: If there is an error inserting the log into the database.
    """

    try:
        response = client.table("logs").insert(event).execute()

        # if response.error:
        #     raise Exception(f"Error logging event: {response.error}")
        # else:
        print(f"LOGGED EVENT: {event}")
    
    except Exception as e:
        print(f"Exception occurred while logging event: {e}")
        raise e


def get_all_logs():
    """
    Retrieves all logs stored in the 'Logs' table.

    Returns:
        list: A list of dictionaries containing all logs.

    Raises:
        Exception: If there is an error fetching the logs from the database.
    """
    try:
        response = client.table("logs").select("*").execute()
        
        # if response.error:
        #     raise Exception(f"Error fetching logs: {response.error}")
        
        return response.data
    
    except Exception as e:
        print(f"Exception occurred while fetching logs: {e}")
        raise e


def get_logs_by_user(user_id):
    """
    Retrieves all logs associated with a specific user.

    Args:
        user_id (str): The ID of the user whose logs are to be fetched.

    Returns:
        list: A list of dictionaries containing logs for the specified user.

    Raises:
        Exception: If there is an error fetching logs for the user.
    """
    try:
        # This will not work right now. Need to decide if we want to store user id in schema or data
        response = client.table("logs").select("*").eq("data->>user_id", str(user_id)).execute()

        # if response.error:
        #     raise Exception(f"Error fetching logs for user {user_id}: {response.error}")
        
        return response.data

    except Exception as e:
        print(f"Exception occurred while fetching logs for user {user_id}: {e}")
        raise e
    
def get_user_by_id(user_id):
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

        if response.error:
            raise Exception(f"Error fetching user {user_id}: {response.error}")

        if not response.data:
            return None
        
        return response.data[0]
    
    except Exception as e:
        print(f"Exception occurred while fetching user {user_id}: {e}")
        raise e
    
def create_user(first_name, last_name, email, password):
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
        existing_user = client.table("users").select("id").eq("email", email).execute()
        if existing_user.data:
            return {"error": "Email already exists"}, 400
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        response = client.table("users").insert({
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": hashed_password
        }).execute()

        if response.error:
            raise Exception(f"Error creating user: {response.error}")

        return response.data[0], 201
    
    except Exception as e:
        print(f"Exception while creating user: {e}")
        return {"error": "Internal server error"}, 500


def login(request):
    session.clear()  # Ensure we start fresh each time
    res = client.auth.sign_in_with_oauth(
        {
            "provider": "github",
            "options": {
                "redirect_to": "https://ai.nickrucinski.com/auth/callback"
            },
        }
    )
    return res

def callback(code):
    try:
        # Supabase automatically retrieves and verifies the code_verifier from the session
        res = client.auth.exchange_code_for_session({"auth_code": code})
        print("Authentication successful:", res)
    except Exception as e:
        return f"Authentication failed: {str(e)}", 500