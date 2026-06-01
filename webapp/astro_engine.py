import datetime
import requests
import random
from flatlib.const import LAT_NYC, LON_NYC # Дефолтные координаты, если город не найден

# ==========================================
# БАЗА ЗНАНИЙ (СЮДА ТВОЯ ДЕВУШКА БУДЕТ ПИСАТЬ ТЕКСТЫ)
# ==========================================

# Пример: Как интерпретировать знаки
SIGN_INTERPRETATIONS = {
    "Sun": {
        "Aries": "Энергия лидера. Импульсивность и начало.",
        "Taurus": "Стабильность. Материальный комфорт.",
        "Gemini": "Коммуникация. Интеллект и двойственность.",
        "Cancer": "Эмоции. Семья и интуиция.",
        "Leo": "Творчество. Эго и самовыражение.",
        "Virgo": "Анализ. Порядок и служение.",
        "Libra": "Партнерство. Гармония и эстетика.",
        "Scorpio": "Трансформация. Глубина и власть.",
        "Sagittarius": "Философия. Расширение горизонтов.",
        "Capricorn": "Структура. Амбиции и контроль.",
        "Aquarius": "Инновации. Свобода и коллектив.",
        "Pisces": "Воображение. Мистика и эмпатия."
    },
    "Moon": {
        "Aries": "Быстрая реакция эмоций.",
        "Taurus": "Потребность в комфорте и еде.",
        # ... твоя девушка дополнит остальные
    }
}

# ==========================================
# РАСЧЕТЫ (РЕАЛЬНАЯ АСТРОЛОГИЯ)
# ==========================================

def get_chart_data(birth_date, birth_time, lat=40.71, lon=-74.0):
    """
    Строит реальную карту с помощью flatlib.
    birth_date: 'YYYY-MM-DD'
    birth_time: 'HH:MM'
    """
    try:
        from flatlib import chart, geopos, date
        from flatlib.objects import Object, GenericObject
        
        # Формируем дату
        d_parts = birth_date.split('-')
        t_parts = birth_time.split(':')
        
        dt = date.Date(int(d_parts[0]), int(d_parts[1]), int(d_parts[2]), int(t_parts[0]), int(t_parts[1]), 0)
        geo = geopos.GeoPos(lat, lon)
        
        # Создаем карту
        c = chart.Chart(dt, geo)
        
        # Собираем данные
        planets = {}
        for obj_id in ['Sun', 'Moon', 'Mercury', 'Ven', 'Mars', 'Jup', 'Sat', 'Ura', 'Nep', 'Plu']:
            obj = c.get(obj_id)
            if obj:
                planets[obj_id] = {
                    "sign": obj.sign,
                    "degree": round(obj.lon % 30, 2), # Градус в знаке
                    "house": c.houses().get(obj_id).sign if c.houses().get(obj_id) else "Unknown"
                }
        
        return planets
    except Exception as e:
        return {"error": str(e)}

# ==========================================
# ГЕНЕРАЦИЯ ТЕКСТА (СВЯЗЬ С AI)
# ==========================================

def generate_horoscope_text(sign, period="day"):
    """
    Здесь будет вызов к AI. 
    Пока выдаем базовую структуру, чтобы работало.
    """
    # Твоя девушка может заменить это на вызов API:
    # response = requests.post("https://api.openai.com/...", json={...})
    
    # Временный реал-текст (архетипы)
    texts = {
        "day": f"День благоприятен для действий, связанных с энергией {sign}. Следуй за интуицией.",
        "month": f"В этом месяце {sign} принесет трансформацию в сфере финансов. Будьте внимательны к деталям.",
        "year": f"Годовой прогноз для {sign}: Время глобальных перемен и укрепления статуса."
    }
    return texts.get(period, "Текст не найден")

def generate_compatibility_text(sign1, sign2):
    """Анализ совместимости."""
    # Простая логика стихий для старта (Огонь+Воздух = Ок, Огонь+Вода = Сложно)
    elements = {
        "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
        "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
        "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
        "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water"
    }
    
    el1 = elements.get(sign1, "Fire")
    el2 = elements.get(sign2, "Fire")
    
    score = 85 if el1 == el2 else (70 if (el1 in ["Fire", "Air"] and el2 in ["Fire", "Air"]) else 50)
    
    return {
        "score": score,
        "text": f"Сочетание {sign1} и {sign2}. Стихии: {el1} и {el2}. Потенциал отношений: {score}%."
    }