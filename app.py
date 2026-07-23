import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from docx import Document
from google import genai
from google.genai import types

app = Flask(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FILES_DIR = os.path.join(BASE_DIR, "workspace_files")
DB_PATH = os.path.join(BASE_DIR, "niki_memory.db")

os.makedirs(FILES_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS facts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace TEXT,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            workspace TEXT,
            sender TEXT,
            message TEXT,
            monologue TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/workspaces", methods=["GET"])
def get_workspaces():
    dirs = [d for d in os.listdir(FILES_DIR) if os.path.isdir(os.path.join(FILES_DIR, d))]
    if "general" not in dirs:
        dirs.append("general")
        os.makedirs(os.path.join(FILES_DIR, "general"), exist_ok=True)
    return jsonify({"workspaces": sorted(dirs)})

@app.route("/workspaces", methods=["POST"])
def create_workspace():
    data = request.json
    ws_name = data.get("name", "").strip().lower().replace(" ", "_")
    if ws_name:
        os.makedirs(os.path.join(FILES_DIR, ws_name), exist_ok=True)
        return jsonify({"status": "success", "workspace": ws_name})
    return jsonify({"status": "error"}), 400

@app.route("/workspace_data/<ws>", methods=["GET"])
def get_workspace_data(ws):
    ws_dir = os.path.join(FILES_DIR, ws)
    os.makedirs(ws_dir, exist_ok=True)
    files = [f for f in os.listdir(ws_dir) if os.path.isfile(os.path.join(ws_dir, f))]
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT content FROM facts WHERE workspace = ? ORDER BY id DESC", (ws,))
    facts = [{"content": row[0]} for row in cursor.fetchall()]
    
    cursor.execute("SELECT sender, message, monologue FROM chats WHERE workspace = ? ORDER BY id ASC", (ws,))
    chat_history = [{"sender": row[0], "message": row[1], "monologue": row[2]} for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({"files": files, "facts": facts, "chat_history": chat_history})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_msg = data.get("message", "")
    ws = data.get("workspace", "general")
    auto_run = data.get("auto_run", False)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chats (workspace, sender, message) VALUES (?, ?, ?)", (ws, "user", user_msg))
    conn.commit()

    if not client:
        reply = "⚠️ API ключът за Gemini не е намерен!"
        mono = "Грешка: Липсва GEMINI_API_KEY."
    else:
        system_instruction = (
            "Ти си N.I.K.I. - AI симулационна платформа за Worldbuilding и сложни сценарии. "
            "Давай подробни, структурирани и дълбоки анализи. "
            "ПЪРВО напиши твоите мисли/анализ в следния формат: <think>тук са твоите мисли</think>. "
            "След това напиши пълния и подробен отговор."
        )
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=user_msg,
                config=types.GenerateContentConfig(system_instruction=system_instruction)
            )
            raw_text = response.text
            mono = ""
            reply = raw_text

            if "<think>" in raw_text and "</think>" in raw_text:
                parts = raw_text.split("</think>")
                mono = parts[0].replace("<think>", "").strip()
                reply = parts[1].strip()

            # Автоматично запазване на доклада като .docx файл
            doc_filename = f"report_{int(datetime.now().timestamp())}.docx"
            ws_dir = os.path.join(FILES_DIR, ws)
            os.makedirs(ws_dir, exist_ok=True)
            doc_path = os.path.join(ws_dir, doc_filename)
            
            doc = Document()
            doc.add_heading(f"N.I.K.I. Доклад: {user_msg[:30]}...", 0)
            doc.add_paragraph(reply)
            doc.save(doc_path)

        except Exception as e:
            reply = f"Грешка при обработка: {str(e)}"
            mono = "Възникна системна грешка."

    cursor.execute("INSERT INTO chats (workspace, sender, message, monologue) VALUES (?, ?, ?, ?)", (ws, "niki", reply, mono))
    conn.commit()
    conn.close()

    return jsonify({"reply": reply, "monologue": mono})

@app.route("/download/<ws>/<filename>")
def download_file(ws, filename):
    ws_dir = os.path.join(FILES_DIR, ws)
    return send_from_directory(ws_dir, filename, as_attachment=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
