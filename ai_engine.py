import os
from google import genai
from google.genai import types

def call_ai_engine(prompt, existing_facts=None, file_list=None, library_text=None):
    """
    Динамично проверява наличните модели (тип *.* търсене) и автоматично премигва 
    към следващия работещ модел при грешка или отказ.
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

    last_error = None
    discovered_models = []

    # Стъпка 1: "Динамично търсене" (*.*) на наличните модели от сървъра на Google в реално време
    try:
        for m in client.models.list():
            model_path = m.name  # например 'models/gemini-2.0-flash'
            clean_name = model_path.replace("models/", "")
            # Предпочитаме гъвкавите flash модели, но приемаме и всякакви други налични
            if "gemini" in clean_name:
                if clean_name not in discovered_models:
                    discovered_models.append(clean_name)
    except Exception as e:
        print(f"Грешка при списъка с модели: {e}")

    # Резервен списък, ако динамичното извличане временно не върне резултат
    fallback_defaults = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro']
    for model in fallback_defaults:
        if model not in discovered_models:
            discovered_models.append(model)

    # Стъпка 2: Опитваме се последователно; ако даден модел спре да работи, веднага минава на следващия
    for model_name in discovered_models:
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
