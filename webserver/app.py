from flask import Flask
from flask_cors import CORS
from flask_session import Session

from routes.__init__ import register_blueprints
from flasgger import Swagger

port = 8001
ip_address = "0.0.0.0"

def create_app():
    app = Flask(__name__)
    app.config['SWAGGER'] = {
        'title': 'Github Copilot Extension'
    }
    CORS(app)
    register_blueprints(app)
    swagger = Swagger(app)
    return app

if __name__ == '__main__':
    app = create_app()
    app.config["SESSION_PERMANENT"] = True  # Keep session across requests
    app.config["SESSION_TYPE"] = "filesystem"  # Store session data in files
    app.config["SESSION_FILE_DIR"] = "./flask_session"  # Ensure sessions persist
    app.config["SESSION_COOKIE_SECURE"] = False  # Allow local development

    Session(app)
    app.run(host=ip_address, port=port, debug=True)
