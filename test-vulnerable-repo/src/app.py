import os
import sqlite3
import hashlib
import subprocess
from flask import Flask, request, jsonify

app = Flask(__name__)

# Hardcoded database credentials
DB_HOST = "localhost"
DB_USER = "root"
DB_PASS = "password123"  # hardcoded password
DB_NAME = "myapp"

# Hardcoded API key
PAYMENT_API_KEY = "pk_live_very_secret_payment_key_12345"
ADMIN_TOKEN = "super_secret_admin_token_abc123"

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')
    
    # SQL injection vulnerability
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    cursor.execute(query)
    user = cursor.fetchone()
    
    if user:
        return jsonify({"token": ADMIN_TOKEN, "status": "success"})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/execute', methods=['POST'])
def execute_command():
    # Command injection vulnerability
    cmd = request.form.get('cmd')
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return jsonify({"output": result.stdout})

@app.route('/file', methods=['GET'])
def read_file():
    # Path traversal vulnerability
    filename = request.args.get('name')
    filepath = f"/var/data/{filename}"
    with open(filepath, 'r') as f:
        return f.read()

@app.route('/hash', methods=['POST'])
def hash_password():
    # Using weak MD5 for password hashing
    password = request.form.get('password')
    hashed = hashlib.md5(password.encode()).hexdigest()
    return jsonify({"hash": hashed})

if __name__ == '__main__':
    # Debug mode enabled in production
    app.run(host='0.0.0.0', port=8000, debug=True)
