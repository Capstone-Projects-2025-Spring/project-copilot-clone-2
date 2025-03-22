from flask import render_template, Blueprint
from app.models.response import error_response
from app.models.status_codes import StatusCodes

main_page_bp = Blueprint('main_page', __name__)

@main_page_bp.route('/')
def main_page_route():
    """
    Displays test AI input page
    """
    try:
        return render_template('index.html')
    except Exception as e:
        return error_response(
            f"Error loading page {e}",
            StatusCodes.SERVER_ERROR
        )