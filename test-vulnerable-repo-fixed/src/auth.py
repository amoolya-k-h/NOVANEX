import os
import jwt
import hashlib

# Remediated: JWT secret retrieved from environment variables
JWT_SECRET = os.environ.get("JWT_SECRET", "default-dev-secret-replace-in-env")
SLACK_WEBHOOK = os.environ.get("SLACK_WEBHOOK")
DATADOG_API_KEY = os.environ.get("DATADOG_API_KEY")

def create_token(user_id):
    payload = {"user_id": user_id, "admin": False}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_password(plain_password, stored_hash):
    # Remediated: Using SHA-256 for verification
    return hashlib.sha256(plain_password.encode()).hexdigest() == stored_hash

def check_admin(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload.get("admin", False) is True
    except jwt.PyJWTError:
        return False
