import os
import time
import re
import json
from google import genai
from database import get_workspace_facts, save_chat_message, add_workspace_fact
from file_manager import save_text_as_docx, WORKSPACES_DIR

# Инициализиране на Gemini клиент
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
gemini_client = genai.Client(api_key=GEMINI_KEY) if GEMINI_KEY else None

def clean_ai_response(text):
    if not text:
        return text
    fixes = {
        r"\bfasсиниращ\ь": "фасциниращ",
        r"\bfaѕсинираща\b": "фасцинираща",
        r"\bfasсиниращо\b": "фасциниращо",
        r"\bfasсиниращи\b": "фасциниращи",
        r"\ьСъм съгласен\b": "Съгласен съм",
        r"\ съм съгласен\b": "Съгласен съм",
        r"\ьСъм готов\b": "Готов съм"
    }
    result = text
    for pattern, replacement in fixes.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
    return result

def get_prioritized_models():
    if not gemini_client:
        return ['gemini-flash', 'gemini-pro']
    try:
        all_models = gemini_client.models.list()
        model_names = []
        for m in all_models:
            name = m.name.replace("models/", "")
            if ("generateContent" in getattr(m, 'supported_generation_methods', []) or "flash" in name or "pro" in name):
                if not "1.0" in name and not "bison" in name:
                    model_names.append(name)
        
        def model_priority(name):
            score = 0
            if "2.5" in name: score += 50
            elif "2.0" in name: score += 40
            elif "1.5" in name: score += 30
            elif name in ['gemini-flash', 'gemini-pro']: score += 20
            if "pro" in name: score += 5
            if "flash" in name: score += 4
            return score

        sorted_models = sorted(model_names, key=model_priority, reverse=True)
        for fallback in ['gemini-flash', 'gemini-pro', 'gemini-1.5-flash']:
            if fallback not in sorted_models:
                sorted_models.append(fallback)
        return sorted_models
    except Exception as e:
        print(f"Грешка при извличане на модели: {e}")
        return ['gemini-flash', 'gemini-pro', 'gemini-1.5-flash']

def call_ai_engine(prompt, context_facts=[], file_list=[], library_context=""):
    if not gemini_client:
        return {
            "reply": f"Обработена инструкция: {prompt}",
            "thought": "Липсва GEMINI_API_KEY в системните променливи."
        }
    
    files_str = ", ".join(file_list) if file_list else "Няма качени файлове"
    system_instructions = f"""
Ти си П.І.К.І. - главен архитект на светове, физични и биологични симулации ("Ефекта на пеперудата") за писатели, сценаристи и гейм-разработчици.
СПИСЪК НА ФАЙЛОВЕ В БИБЛИОТЕКАТА:
[{files_str}]
ПРОВЕРЕНИ ФАКТИ И ПРАВИЛА В ТОЗИ ПРОЕКТ/СВЯТ:
{json.dumps(context_facts, ensure_ascii=False)}
СЪДЪРЖАНИЕ НА БИБЛИОТЕКАТА:
{library_context[:6000] if library_context else 'Няма допълнителен текст.'}
ПРАВИЛА ЗА РАБОТА:
1. За светове, планети и същества: Базирай анатомията, климата и еволюцията на РЕАЛНИ ФИЗИЧНИ И БИОЛОГИЧНИ ЗАКОНИ, освен ако потребителят не дефинира магически правила.
2. Избягвай клишета! Генерирай уникални имена, езици, традиции и архитектура.
3. Когато провеждаш АНАЛИЗ или СИМУЛАЦИЯ на промяна ("Ефекта на пеперудата"):
- **Секция 1: ТВЪРДА ДЕТЕРМИНИРАНА ВЕРИГА** (Неизбежни преки последици)
- **Секция 2: СИМУЛАЦИЯ НА 10 ВАРИАНТА** (Спонтанни вторични променливи)
4. Отговаряй ВИНАГИ на чист и правилен български език.
"""
    full_prompt = f"{system_instructions}\n\nПотребител: {prompt}"
    models_to_try = get_prioritized_models()
    last_error = ""

    for model_name in models_to_try:
        try:
            response = gemini_client.models.generate_content(
                model=model_name,
                contents=full_prompt
            )
            raw_reply = response.text
            cleaned_reply = clean_ai_response(raw_reply)
            
            return {
                "reply": cleaned_reply,
                "thought": f"Вътрешен монолог:\n- Използван модел: {model_name}\n- Използвани факти от DB: {len(context_facts)}\n- Прочетени файлове от библиотеката: {len(file_list)}"
            }
        except Exception as e:
            last_error = str(e)
            continue

    return {
        "reply": f"Грешка при свързването с Gemini API. Уверете се, че GEMINI_API_KEY е валиден. Детайли: {last_error}",
        "thought": f"Пробвани модели: {models_to_try}. Последна грешка: {last_error}"
    }

def auto_run_worker(ws_name, initial_prompt, cycles=3):
    print(f"Стартиран Auto-Run за проект '{ws_name}' с {cycles} цикъла.")
    current_prompt = initial_prompt
    for i in range(1, cycles + 1):
        facts = get_workspace_facts(ws_name)
        ai_res = call_ai_engine(f"[АВТОМАТИЧЕН ЦИКЪЛ {i}/{cycles}] {current_prompt}", facts)
        reply_msg = f"**[Auto-Run Цикъл {i}/{cycles}]**\n\n" + ai_res["reply"]
        save_chat_message(ws_name, "niki", reply_msg, ai_res["thought"])
        
        doc_filename = f"autorun_cycle_{i}_{int(time.time())}.docx"
        save_text_as_docx(ws_name, doc_filename, f"Auto-Run Симулация Цикъл {i}", ai_res["reply"])
        current_prompt = f"Въз основа на предишната симулация, задълбочи анализа на най-вероятните 2 варианта и генерирай следващите 5 години развитие."
        time.sleep(15)
