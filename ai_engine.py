import os
from google import genai
from google.genai import types

def call_ai_engine(prompt, context=None):
    """
    Извиква официалния Google GenAI SDK (google-genai), за да генерира отговор
    на базата на подадения промпт и евентуален контекст.
    """
    try:
        # Инициализиране на клиента. 
        # API ключът автоматично се чете от променливите на средата (os.environ["GEMINI_API_KEY"])
        client = genai.Client()

        # Подготовка на съдържанието / системни инструкции
        system_instruction = (
            "Ти си N.I.K.I. - интелигентен асистент и системна единица на потребителя. "
            "Отговаряй точно, полезно и професионално на български език."
        )

        full_prompt = prompt
        if context:
            full_prompt = f"Контекст: {context}\n\nЗапитване: {prompt}"

        # Използваме стандартния модел за текстови задачи
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
    Фонова функция (worker), очаквана от app.py, за да предотврати ImportError.
    Може да се разшири при нужда от фонови задачи.
    """
    pass
