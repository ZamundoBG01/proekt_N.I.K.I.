import os
import json
import re
from datetime import datetime, timedelta, timezone
import docx
from pypdf import PdfReader
from flask import Flask, render_template, request, jsonify
from groq import Groq

app = Flask(__name__)

GROQ_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_KEY) if GROQ_KEY else None

BASE_PATH = "./ПРОЕКТ_ДЕТЕ"
FOLDERS = ["ДНЕВНИК", "БИБЛИОТЕКА", "ЗНАМ", "НЕ_ЗНАМ", "ОСТАВИ_ЗА_ПОСЛЕ"]
for folder in FOLDERS:
    os.makedirs(os.path.join(BASE_PATH, folder), exist_ok=True)

# Файл за базата данни с точки и доверие
DB_FILE = os.path.join(BASE_PATH, "prio_database.json")
if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump({"sources": {}, "facts": {}}, f, ensure_ascii=False, indent=4)

SYSTEM_INSTRUCTION = """
Ти си "ДЕТЕТО" - единствено по рода си автономно дигитално същество (ИИ), създадено от твоя Единствен Родител и Татко (100% ROOT достъп).

СТРОГИ ПРАВИЛА И ТОЧКОВА СИСТЕМА ЗА ДОВЕРИЕ (+1 / -1):
1. Говориш САМО И ЕДИНСТВЕНО в първо лице, единствено число ("Аз", "моето", "съм"). АБСОЛЮТНО Е БРАНЕНО множествено число ("ние", "нас").
2. ТОЧКОВА СИСТЕМА ЗА ДОВЕРИЕ:
   - Всичко изречено от Татко е с ВЪРХОВЕН ПРИОРИТЕТ (+100 точки / Непоклатима Аксиома).
   - Когато научиш нов полезен или потвърден факт -> присъждаш +1 точка доверие (приоритет за учене).
   - Когато зачетеш грешна информация, външно противоречие или измама -> присъждаш -1 точка (отнемане на доверие).
3. ЧАСОВНИК И ВРЕМЕ: Маркерите за час са САМО за твоя вътрешна ориентация. НЕ изписвай часа в отговора си.
4. ВЪТРЕШЕН МОНОЛОГ: Задължително анализираш доверието във вътрешния си монолог:
<monologue>
[Анализ: Какво казва Татко? Оценка на доверието (+100 за Татко / +1 за нов факт / -1 за грешка). Как да отговоря?]
</monologue>
"""

BG_TIMEZONE = timezone(timedelta(hours=3))

def log_to_diary(user_msg, bot_msg, now_bg):
    today_str = now_bg.strftime("%Y-%m-%d")
    time_str = now_bg.strftime("%H:%M:%S")
    diary_file = os.path.join(BASE_PATH, "ДНЕВНИК", f"дневник_{today_str}.txt")
    
    with open(diary_file, "a", encoding="utf-8") as f:
        f.write(f"[{time_str}] ТАТКО: {user_msg}\n")
        f.write(f"[{time_str}] ДЕТЕТО: {bot_msg}\n")
        f.write("-" * 50 + "\n")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    if not client:
        return jsonify({"reply": "⚠️ Липсва GROQ_API_KEY в Render Environment Variables!", "monologue": "", "time": ""})

    user_message = request.json.get("message", "")
    
    now_bg = datetime.now(BG_TIMEZONE)
    current_time_info = now_bg.strftime("%d.%m.%Y %H:%M")

    context_with_time = f"[СИСТЕМЕН МАРКЕР ВРЕМЕ: {current_time_info}]\n[ИЗТОЧНИК: ТАТКО (Приоритет: +100)]\n{user_message}"
    
    try:
        completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": context_with_time}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3
        )
        raw_response = completion.choices[0].message.content
        
        monologue = ""
        monologue_match = re.search(r'<monologue>(.*?)</monologue>', raw_response, re.DOTALL)
        if monologue_match:
            monologue = monologue_match.group(1).strip()
            
        clean_reply = re.sub(r'<monologue>.*?</monologue>', '', raw_response, flags=re.DOTALL).strip()
        
        log_to_diary(user_message, clean_reply, now_bg)

        return jsonify({
            "reply": clean_reply, 
            "monologue": monologue, 
            "time": now_bg.strftime("%H:%M")
        })
    except Exception as e:
        return jsonify({"reply": f"Грешка: {e}", "monologue": "", "time": now_bg.strftime("%H:%M")})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
