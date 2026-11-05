import os
import sqlite3
import hashlib
import shlex
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)

# Credentials securely retrieved from environment variables
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_USER = os.environ.get("DB_USER", "appuser")
DB_PASS = os.environ.get("DB_PASS")
DB_NAME = os.environ.get("DB_NAME", "myapp")

PAYMENT_API_KEY = os.environ.get("PAYMENT_API_KEY")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN")

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    
    # Remediated: Parameterized query prevents SQL injection attacks
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    query = "SELECT * FROM users WHERE username = ? AND password = ?"
    cursor.execute(query, (username, password))
    user = cursor.fetchone()
    
    if user:
        return jsonify({"token": ADMIN_TOKEN or "authenticated", "status": "success"})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/execute', methods=['POST'])
def execute_command():
    # Remediated: Avoid invoking system shell with shell=True
    cmd = request.form.get('cmd')
    safe_args = shlex.split(cmd or "")
    if not safe_args or safe_args[0] not in ["uptime", "date"]:
        return jsonify({"error": "Unauthorized command"}), 403
    result = subprocess.run(safe_args, shell=False, capture_output=True, text=True, check=True)
    return jsonify({"output": result.stdout})

@app.route('/file', methods=['GET'])
def read_file():
    # Remediated: Path traversal protection using basename and abspath verification
    filename = request.args.get('name', '')
    safe_filename = os.path.basename(filename)
    base_dir = os.path.abspath("/var/data")
    target_path = os.path.abspath(os.path.join(base_dir, safe_filename))
    
    if not target_path.startswith(base_dir):
        return jsonify({"error": "Invalid file path"}), 400
        
    if not os.path.exists(target_path):
        return jsonify({"error": "File not found"}), 404

    with open(target_path, 'r') as f:
        return f.read()

@app.route('/hash', methods=['POST'])
def hash_password():
    # Remediated: Using SHA-256 instead of MD5
    password = request.form.get('password', '')
    hashed = hashlib.sha256(password.encode()).hexdigest()
    return jsonify({"hash": hashed})

if __name__ == '__main__':
    # Remediated: Debug mode disabled
    debug_mode = os.environ.get("DEBUG", "False").lower() == "true"
    app.run(host='0.0.0.0', port=8000, debug=debug_mode)
