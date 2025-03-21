from flask import request, render_template, Blueprint, redirect
from app.services.auth_service import login, callback
from app.models.response import *
from app.models.status_codes import StatusCodes

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login')
def login_page():
   return render_template('login.html')


@auth_bp.route('/auth/login', methods=['GET'])
def login_route():
    provider = request.json.data.get("provider", "")
    if not provider:
        return error_response(
            "Provider not provided. Ex github",
            None,
            StatusCodes.BAD_REQUEST
        )
    
    res = login(provider)
    return redirect(res.url)


@auth_bp.route('/auth/complete')
def auth_complete_route():
   return render_template('auth_success.html')


@auth_bp.route('/auth/callback')
def auth():
    code = request.args.get("code")
    next_url = request.args.get("next", "/auth/complete")

    if not code:
        return error_response(
            "Error: Missing authorization code",
            None,
            StatusCodes.BAD_REQUEST
        )

    callback(code)

    return redirect(next_url)

