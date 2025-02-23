from flask import Flask
from flask_cors import CORS
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
    app.run(host=ip_address, port=port, debug=True)
