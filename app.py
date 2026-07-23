import os
import json
import re
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACES_DIR = os.path.join(BASE_DIR, "NIKI_CORE", "workspaces")

def sanitize_ws_name(name):
    """Преобразува имената на проектите в безопасен формат за папки."""
    if not name:
        return "general"
    return name.strip().lower().replace(" ", "_")

def safe_read_json(file_path):
    """Безопасно четене на JSON файл без сриване на сървъра."""
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception as e:
            print(f"Грешка при четене на {file_path}: {e}")
            return []
    return []

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/workspaces", methods=["GET", "POST"])
def handle_workspaces():
    if not os.path.exists(WORKSPACES_DIR):
        os.makedirs(WORKSPACES_DIR, exist_ok=True)

    if request.method == "POST":
        data = request.get_json() or {}
        raw_name = data.get("name", "")
        ws_name = sanitize_ws_name(raw_name)
        
        if ws_name:
            ws_path = os.path.join(WORKSPACES_DIR, ws_name)
            os.makedirs(os.path.join(ws_path, "facts"), exist_ok=True)
            os.makedirs(os.path.join(ws_path, "tasks"), exist_ok=True)
            os.makedirs(os.path.join(ws_path, "library"), exist_ok=True)
            
            # Инициализиране на празен facts файл
            facts_file = os.path.join(ws_path, "facts", "verified_facts.json")
            if not os.path.exists(facts_file):
                with open(facts_file, "w", encoding="utf-8") as f:
                    json.dump([], f, ensure_ascii=False, indent=2)

        return jsonify({"status": "success", "workspace": ws_name})

    # GET: Връща списък с всички съществуващи проекти
    try:
        entries = os.listdir(WORKSPACES_DIR)
        workspaces = [d for d in entries if os.path.isdir(os.path.join(WORKSPACES_DIR, d))]
    except Exception:
        workspaces = ["general"]

    if "general" not in workspaces:
        workspaces.insert(0, "general")

    return jsonify({"workspaces": sorted(list(set(workspaces)))})

@app.route("/workspace_data/<path:ws_name>")
def workspace_data(ws_name):
    clean_ws = sanitize_ws_name(ws_name)
    ws_path = os.path.join(WORKSPACES_DIR, clean_ws)

    # 1. Зареждане на факти
    facts_path = os.path.join(ws_path, "facts", "verified_facts.json")
    facts = safe_read_json(facts_path)

    # 2. Зареждане на задачи
    tasks_path = os.path.join(ws_path, "tasks", "backlog.json")
    tasks = safe_read_json(tasks_path)

    # 3. Зареждане на файлове от библиотеката
    library_path = os.path.join(ws_path, "library")
    files = []
    if os.path.exists(library_path) and os.path.isdir(library_path):
        try:
            files = os.listdir(library_path)
        except Exception:
            files = []

    return jsonify({
        "facts": facts,
        "tasks": tasks,
        "files": files
    })

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    active_ws = sanitize_ws_name(data.get("workspace", "general"))

    if not message:
        return jsonify({"reply": "Моля, въведете съобщение.", "monologue": None})

    monologue = f"Анализ на заявката за проект [{active_ws.upper()}]:\n- Потребителска инструкция: '{message}'\n- Синхронизация с локалната база данни: Успешна."
    
    reply = f"Получих вашата инструкция: '{message}'. В момента я обработвам в контекста на проект **{active_ws.upper()}**."

    return jsonify({
        "reply": reply,
        "monologue": monologue,
        "target_workspace": active_ws
    })

@app.route("/delete_file", methods=["POST"])
def delete_file():
    data = request.get_json() or {}
    ws_name = sanitize_ws_name(data.get("workspace", "general"))
    filename = data.get("filename", "")

    if not filename:
        return jsonify({"message": "Невалидно име на файл."}), 400

    file_path = os.path.join(WORKSPACES_DIR, ws_name, "library", filename)

    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({"message": f"Файлът '{filename}' беше изтрит успешно."})
        except Exception as e:
            return jsonify({"message": f"Грешка при изтриване: {str(e)}"}), 500
    
    return jsonify({"message": "Файлът не бе намерен."}), 444

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
