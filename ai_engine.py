import os
from google import genai
from google.genai import types

def call_ai_engine(prompt, existing_facts=None, file_list=None, library_text=None):
    """
    Извиква официалния Google GenAI SDK (google-genai) с пълния контекст от факти и файлове.
    """
    try:
        client = genai.Client()

        system_instruction = (
            "Ти си N.I.K.I. - интелигентен асистент и системна единица на потребителя. "
            "Отговаряй точно, полезно и професионално на български език, като "
            "взимаш предвид предоставените факти и контекст."
        )

        # Сглобяване на пълния контекст за модела
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

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            ),
        )

        if response and response.text:
            return response.text
        else:
            return "Сигналът е приет, но не беше върнат отговор от AI модела."

    except Exception as e:
        return f"Грешка при връзка с AI ядрото: {str(e)}"


def auto_run_worker(*args, **kwargs):
    """
    Фонова функция (worker), очаквана от app.py.
    """
    pass
