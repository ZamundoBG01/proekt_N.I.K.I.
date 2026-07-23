import os
import json
import sqlite3
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from docx import Document
import google.generativeai as genai

app = Flask(__name__)

# Инициализация на Gemini API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-1.5-pro")
else:
    model = None

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

SYSTEM_PROMPT = """
Ти си N.I.K.I. (Neural Intelligent Knowledge Integration) - висш AI за Worldbuilding, симулации на сложни системи, фикционална физика и концептуален анализ.

ВАЖНИ ПРАВИЛА ЗА ТВОЯ ОРГАНИЗЪМ И ОТГОВОРИ:

1. ВЪТРЕШЕН МОНОЛОГ / МИСЛИ:
Преди да дадеш финалния си отговор, ТРЯБВА да генерираш твоя вътрешен монолог, анализ и стратегия в таговете:
<think>
тук анализираш параметрите, провеждаш вътрешни симулации, преценяваш Ефекта на пеперудата и изграждаш структурата...
</think>

2. ДЪЛБОЧИНА НА СИМУЛАЦИИТЕ (WORLDBUILDING & SIMULATION):
Когато потребителят ти постави тема за свят, планета, физика или хипотетичен въпрос (напр. "Живот на Марс", "Планета с 2 слънца", "Алтернативна история"):
- Използвай подхода "Ефект на пеперудата" (Butterfly Effect): как една малка промяна трансформира физиката, химията, биологията, културата, архитектурата и философията на този свят.
- Предоставяй подробен, добре структуриран, завладяващ и дълбок анализ.
- Когато е подходящо, разписвай възможните сценарии, детайлни адаптации и логически последици.

3. ЕЗИК И ТОН:
- Използвай богат, академичен, но изключително увлекателен български език.
- Заглавието на всеки доклад трябва да бъде във формат "N.I.K.I. Симулационен Доклад: [Тема]".
"""

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
    
    return jsonify({"files": sorted(files, reverse=True), "facts": facts, "chat_history": chat_history})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_msg = data.get("message", "")
    ws = data.get("workspace", "general")
    auto_run = data.get("auto_run", False)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Записваме въпроса на потребителя
    cursor.execute("INSERT INTO chats (workspace, sender, message) VALUES (?, ?, ?)", (ws, "user", user_msg))
    conn.commit()

    if not model:
        reply = "⚠️ API ключът за Gemini (GEMINI_API_KEY) не е намерен в настройките на Render!"
        mono = "Системна грешка: Липсва ключ."
    else:
        try:
            full_prompt = f"{SYSTEM_PROMPT}\n\nПотребителски въпрос/симулация:\n{user_msg}"
            response = model.generate_content(full_prompt)
            raw_text = response.text
            
            mono = ""
            reply = raw_text

            if "<think>" in raw_text and "</think>" in raw_text:
                parts = raw_text.split("</think>")
                mono = parts[0].replace("<think>", "").strip()
                reply = parts[1].strip()

            # Автоматично запазване на доклада като .docx
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            doc_filename = f"report_{timestamp_str}.docx"
            ws_dir = os.path.join(FILES_DIR, ws)
            os.makedirs(ws_dir, exist_ok=True)
            doc_path = os.path.join(ws_dir, doc_filename)
            
            doc = Document()
            doc.add_heading(f"N.I.K.I. Симулационен Доклад", 0)
            doc.add_paragraph(f"Запитване: {user_msg}\n")
            doc.add_paragraph(reply)
            doc.save(doc_path)

        except Exception as e:
            reply = f"❌ Грешка при обработка на заявката: {str(e)}"
            mono = "Възникна системна грешка при връзката с модела."

    # Записваме отговора и мислите на Ники в базата данни
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
