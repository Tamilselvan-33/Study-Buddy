import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import get_db, db_instance
from utils.validation import success_response, error_response
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.matching_routes import matching_bp
from routes.group_routes import group_bp
from routes.progress_routes import progress_bp
from routes.invite_routes import invite_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Parse comma-separated allowed origins (e.g. multiple frontend URLs)
    allowed_origins = [o.strip() for o in Config.ALLOWED_ORIGINS.split(",")]
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(matching_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(progress_bp)
    app.register_blueprint(invite_bp)

    # Health Check Endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db = get_db()
        db_status = "Fallback (In-Memory)" if db_instance.is_fallback else "Connected (MongoDB)"
        return success_response(
            data={
                "status": "healthy",
                "service": "StudyBuddy Backend API",
                "version": "1.0.0",
                "database": db_status
            },
            message="StudyBuddy backend services are operating normally."
        )

    # Register Global Error Handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return error_response(
            code="NOT_FOUND",
            message="Requested API resource or endpoint was not found.",
            status_code=404
        )

    @app.errorhandler(500)
    def internal_server_error(error):
        return error_response(
            code="INTERNAL_ERROR",
            message="An internal server error occurred.",
            status_code=500
        )

    return app

app = create_app()

if __name__ == "__main__":
    print(f"Starting StudyBuddy Flask Server on port {Config.PORT}...")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
