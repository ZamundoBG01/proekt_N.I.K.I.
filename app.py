import os
import json
import re
from datetime import datetime
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
    """Безопасно четене на JSON файл."""
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception as e:
            print(f"Грешка при четене на {file_path}: {e}")
            return []
    return []

def safe_write_json(file_path, data):
    """Безопасно записване на JSON файл."""
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Грешка при запис в {file_path}: {e}")
        return False

def clean_command_phrases(text):
    """Изчиства командата и оставя само същинския факт."""
    patterns = [
        r"^(запиши предното съобщение|запиши|добави факт|запиши следното|тогава запиши за дата [0-9\.]+ следното\.?)\s*:?",
        r"предното \"запиши предното съобщение\" може да го изтриеш.*$",
        r"имах предвид да запишеш съобщението преди него.*$"
    ]
    cleaned = text
    for pattern in patterns:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE).strip()
    return cleaned if cleaned else text

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
            
            facts_file = os.path.join(ws_path, "facts", "verified_facts.json")
            if not os.path.exists(facts_file):
                safe_write_json(facts_file, [])

        return jsonify({"status": "success", "workspace": ws_name})

    try:
        entries = os.listdir(WORKSPACES_DIR)
        workspaces = [d for d in entries if os.path.isdir(os.path.join(WORKSPACES_DIR, d))]
    except Exception:
        workspaces = ["general"]

    other_workspaces = sorted([w for w in workspaces if w.lower() != "general"])
    ordered_workspaces = ["general"] + other_workspaces

    return jsonify({"workspaces": ordered_workspaces})

@app.route("/workspace_data/<path:ws_name>")
def workspace_data(ws_name):
    clean_ws = sanitize_ws_name(ws_name)
    ws_path = os.path.join(WORKSPACES_DIR, clean_ws)

    facts_path = os.path.join(ws_path, "facts", "verified_facts.json")
    facts = safe_read_json(facts_path)

    tasks_path = os.path.join(ws_path, "tasks", "backlog.json")
    tasks = safe_read_json(tasks_path)

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
        return jsonify({"reply": "Моля, въведете инструкция.", "monologue": None})

    facts_path = os.path.join(WORKSPACES_DIR, active_ws, "facts", "verified_facts.json")
    existing_facts = safe_read_json(facts_path)

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Искане за изтриване/изчистване
    if "изтрий" in message.lower() and "всичко" in message.lower():
        safe_write_json(facts_path, [])
        return jsonify({
            "reply": f"🗑️ Всички факти в проект **{active_ws.upper()}** бяха изтрити.",
            "monologue": "Изчистване на базата данни по заявка.",
            "target_workspace": active_ws
        })

    # Записване на нов факт (автоматично изчистен от командите)
    if any(kw in message.lower() for kw in ["запиши", "добави факт", "дневник:"]):
        cleaned_content = clean_command_phrases(message)
        
        new_fact = {
            "content": cleaned_content,
            "timestamp": now_str,
            "confidence": 100,
            "category": "ДИРЕКТЕН ЗАПИС"
        }
        existing_facts.append(new_fact)
        safe_write_json(facts_path, existing_facts)
        
        reply = f"✅ Анализирах съобщението, премахнах излишните команди и записах следния факт в **{active_ws.upper()}**:\n\n> \"{cleaned_content}\""
        monologue = f"Интелигентно филтриране на команда:\n- Оригинален текст: '{message}'\n- Извлечен чист факт: '{cleaned_content}'\n- Статус: Успешно записан."

    # Въпрос за записите
    elif any(kw in message.lower() for kw in ["вчера", "записи", "какво има", "покажи", "факти"]):
        if existing_facts:
            facts_text = "\n".join([f"• **[{f.get('timestamp', 'Б/Д')}]**: {f.get('content', f.get('fact', ''))}" for f in existing_facts])
            reply = f"📚 Ето намерените записи/факти в проект **{active_ws.upper()}**:\n\n{facts_text}"
        else:
            reply = f"ℹ️ Все още няма намерени записи или факти в проект **{active_ws.upper()}**."
        
        monologue = f"Сканиране на {facts_path}...\n- Намерени записи: {len(existing_facts)}"

    else:
        reply = f"Разбрах. Съобщението ви беше прието в **{active_ws.upper()}**."
        monologue = f"Обработка в проект [{active_ws.upper()}]: '{message}'"

    return jsonify({
        "reply": reply,
        "monologue": monologue,
        "target_workspace": active_ws
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
