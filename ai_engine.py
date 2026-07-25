import os
from google import genai
from google.genai import types

def call_ai_engine(prompt, existing_facts=None, file_list=None, library_text=None):
    """
    Автоматично опитва различни версии на моделите на Gemini (2.5 -> 2.0 -> 1.5),
    ако някоя от тях върне грешка за квота или лимити.
    """
    client = genai.Client()

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

    # Списък с модели за автоматичен резервен избор (fallback)
    models_to_try = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
    
    last_error = None

    for model_name in models_to_try:
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
                    "thought": f"Успешен отговор през модел: {model_name}"
                }
        except Exception as e:
            last_error = str(e)
            # Продължава към следващия модел в списъка при грешка
            continue

    # Ако всички модели се провалят
    return {
        "reply": f"Грешка при връзка с всички AI модели. Последна грешка: {last_error}",
        "thought": "Всички резервни модели изчерпиха квотата или върнаха грешка."
    }


def auto_run_worker(*args, **kwargs):
    """
    Фонова функция (worker), очаквана от app.py.
    """
    pass
