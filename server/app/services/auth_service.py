from flask import session
from app.controllers.database import client
from app.models.response import *

AUTH_URL = "https://ai.nickrucinski.com/auth/callback"

def login(provider: str):
    session.clear()  # Ensure fresh session
    res = client.auth.sign_in_with_oauth(
        {
            "provider": provider,
            "options": {
                "redirect_to": AUTH_URL
            },
        }
    )
    return res

def callback(code: str):
    """Handles OAuth callback and exchanges code for a session."""
    try:
        res = client.auth.exchange_code_for_session({"auth_code": code})
        return res
    except Exception as e:
        return error_response(
            "Authentication failed: {str(e)}",
            None,
            StatusCodes.UNAUTHORIZED
        )
