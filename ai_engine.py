import os
import aiohttp

OR_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "meta-llama/llama-3.3-70b-instruct:free"

SYSTEM_PROMPT = """Ты профессиональный астролог. Отвечай строго по входным данным. Стиль: экспертный, без воды, с чёткими выводами. Если данных не хватает — напиши, чего не хватает. Никогда не выдумывай аспекты или положения."""

async def ask_ai(prompt: str) -> str:
    if not OR_KEY:
        return "️ Ключ AI не найден. Добавь OPENROUTER_API_KEY в Render."

    headers = {
        "Authorization": f"Bearer {OR_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cosmira.bot",
        "X-Title": "COSMIRA"
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1200
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(BASE_URL, headers=headers, json=payload, timeout=aiohttp.ClientTimeout(total=15)) as response:
                response.raise_for_status()
                data = await response.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"⚠️ Ошибка AI: {str(e)}"