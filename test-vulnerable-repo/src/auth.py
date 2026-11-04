import jwt
import hashlib

# Hardcoded secret for JWT
JWT_SECRET = "my-jwt-secret-key-12345"

# Another hardcoded credential
SLACK_WEBHOOK = "https://slack-mock.internal/services/mock_token_123456789"
DATADOG_API_KEY = "1234567890abcdef1234567890abcdef"

def create_token(user_id):
    # Using HS256 which can be weak with poor secrets
    payload = {"user_id": user_id, "admin": True}
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_password(plain_password, stored_hash):
    # Using MD5 for password verification - INSECURE
    return hashlib.md5(plain_password.encode()).hexdigest() == stored_hash

def check_admin(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        # Missing proper admin validation
        return payload.get("admin", False)
    except:
        return False  # Swallowing exception
