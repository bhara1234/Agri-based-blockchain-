from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import json
import bcrypt
import os
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "agri.db")

app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not os.path.exists(DB_PATH):
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT,
            username TEXT,
            password TEXT,
            mobile TEXT,
            data TEXT,
            updated_at TEXT
        )
        """)
        conn.commit()
        conn.close()

@app.route("/signup", methods=["POST"])
def signup():
    payload = request.get_json()
    role = payload.get("role")
    username = payload.get("username")
    password = payload.get("password")
    mobile = payload.get("mobile")
    if not (role and username and password):
        return jsonify({"error":"Missing fields"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE role=? AND username=?", (role, username))
    if cur.fetchone():
        conn.close()
        return jsonify({"error":"User already exists"}), 400

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode('utf-8')
    cur.execute("INSERT INTO users (role, username, password, mobile, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (role, username, hashed, mobile or "", json.dumps({}), None))
    conn.commit()
    conn.close()
    return jsonify({"message":"Signup successful"})

@app.route("/login", methods=["POST"])
def login():
    payload = request.get_json()
    role = payload.get("role")
    username = payload.get("username")
    password = payload.get("password")
    if not (role and username and password):
        return jsonify({"error":"Missing fields"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE role=? AND username=?", (role, username))
    row = cur.fetchone()
    conn.close()
    if not row:
        return jsonify({"error":"Invalid credentials"}), 400
    hashed = row["password"]
    if not bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8")):
        return jsonify({"error":"Invalid credentials"}), 400
    user = dict(row)
    user.pop("password", None)
    try:
        user["data"] = json.loads(user.get("data") or "{}")
    except:
        user["data"] = {}
    return jsonify(user)

@app.route("/update", methods=["POST"])
def update():
    payload = request.get_json()
    uid = payload.get("id")
    data = payload.get("data")
    if uid is None or data is None:
        return jsonify({"error":"Missing fields"}), 400
    now = datetime.utcnow().isoformat()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET data=?, updated_at=? WHERE id=?", (json.dumps(data), now, uid))
    conn.commit()
    conn.close()
    return jsonify({"message":"Updated", "updated_at": now})

@app.route("/users", methods=["GET"])
def users():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, role, username, mobile, data, updated_at FROM users")
    rows = cur.fetchall()
    conn.close()
    users = []
    for r in rows:
        u = dict(r)
        try:
            u["data"] = json.loads(u.get("data") or "{}")
        except:
            u["data"] = {}
        users.append(u)
    return jsonify(users)

@app.route("/host_login", methods=["POST"])
def host_login():
    payload = request.get_json()
    username = payload.get("username")
    password = payload.get("password")
    # Hardcoded credentials
    if username == "Bharath" and password == "bharath123":
        return jsonify({"ok": True})
    return jsonify({"ok": False}), 401

@app.route("/")
def index():
    return send_from_directory('.', 'index.html')

if __name__ == "__main__":
    init_db()
    app.run(debug=True)