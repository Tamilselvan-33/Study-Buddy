from functools import wraps
from flask import request, jsonify
from utils.security import decode_jwt_token

def success_response(data=None, message=None, status_code=200):
    """Generates standardized successful API response."""
    payload = {
        "success": True,
        "data": data if data is not None else {},
    }
    if message:
        payload["message"] = message
    return jsonify(payload), status_code

def error_response(code="INTERNAL_ERROR", message="An unexpected error occurred", details=None, status_code=500):
    """Generates standardized error API response."""
    payload = {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "details": details or []
        }
    }
    return jsonify(payload), status_code

def token_required(f):
    """Decorator to enforce valid JWT authentication on protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return error_response(
                code="AUTH_ERROR",
                message="Authentication header is missing. Please login.",
                status_code=401
            )
        
        token_parts = auth_header.split(" ")
        if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
            return error_response(
                code="AUTH_ERROR",
                message="Invalid authorization header format. Expected 'Bearer <token>'",
                status_code=401
            )
        
        token = token_parts[1]
        try:
            payload = decode_jwt_token(token)
            request.user_id = payload.get("sub")
            request.user_email = payload.get("email")
        except ValueError as err:
            return error_response(
                code="AUTH_ERROR",
                message=str(err),
                status_code=401
            )
        return f(*args, **kwargs)
    return decorated
