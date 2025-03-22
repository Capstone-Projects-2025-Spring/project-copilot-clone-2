from app.controllers.database import client
from app.models.response import *



def log_event(event):
    """Logs an event to the database."""
    try:
        client.table("logs").insert(event).execute()
        
    except Exception as e:
        print(f"Error logging event: {e}")
        raise e


def log_suggestion(suggestion):
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
        response = client.table("suggestions").insert(suggestion).execute()
        if response.data:
            suggestion['id'] = response.data[0]['id']
            return suggestion
        else:
            raise Exception("No data returned from insert operation")
    except Exception as e:
        print(f"Error logging suggestion: {e}")
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
        return response.data
    except Exception as e:
        print(f"Error fetching logs: {e}")
        raise e

def get_logs_by_user(user_id, code_context_id=None):
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
        query = client.table("logs").select("*").eq("metadata->>user_id", str(user_id))

        if code_context_id:
            query = query.eq("metadata->>code_context_id", str(code_context_id))

        response = query.execute()

        print(f"Fetched logs for user {user_id}: {response.data}")

        return response.data
    except Exception as e:
        print(f"Error fetching logs for user {user_id}: {e}")
        raise e
