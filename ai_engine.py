import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(Path(__file__).resolve().parent / ".env")

DEFAULT_MODELS = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-pro-latest",
]


def _get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None, "Липсва GEMINI_API_KEY. Добавете ключа в .env файла в корена на проекта."
    return genai.Client(api_key=api_key), None


def call_ai_engine(prompt, existing_facts=None, file_list=None, library_text=None):
    """
    Изпраща запитване към Gemini и автоматично преминава към следващия
    резервен модел при грешка или отказ.
    """
    client, key_error = _get_gemini_client()
    if key_error:
        return {
            "reply": key_error,
            "thought": "Не е конфигуриран API ключ за Gemini.",
        }

    system_instruction = (
        "Ти си N.I.K.I. - интелигентен асистент и системна единица на потребителя. "
        "Отговаряй точно, полезно и професионално на български език, като "
        "взимаш предвид предоставените факти и контекст."
    )

    context_parts = []
    if existing_facts:
        context_parts.append(f"Запазени факти:\n{existing_facts}")
    if file_list:
        context_parts.append(f"Налични файлове:\n{file_list}")
    if library_text:
        context_parts.append(f"Съдържание от библиотека:\n{library_text}")

    full_prompt = prompt
    if context_parts:
        full_prompt = "\n\n".join(context_parts) + f"\n\nПотребителско запитване: {prompt}"

    last_error = None

    for model_name in DEFAULT_MODELS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.7,
                ),
            )

            if response and response.text:
                return {
                    "reply": response.text,
                    "thought": f"Успешен преход и изпълнение през модел: {model_name}"
                }
        except Exception as e:
            last_error = str(e)
            # Автоматично продължава (failover) към следващия модел в списъка
            continue

    # Ако абсолютно всички модели върнат грешка
    return {
        "reply": f"Грешка при връзка с всички налични AI модели. Последна грешка: {last_error}",
        "thought": "Всички налични модели изчерпиха квотата си или върнаха грешка при изпълнение."
    }

def auto_run_worker(*args, **kwargs):
    pass
