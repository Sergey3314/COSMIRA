# ============================================
# COSMIRA ASTRO ENGINE
# Реальные расчеты + текстовые шаблоны
# ============================================

import datetime
import random

# Пытаемся импортировать flatlib для реальных расчетов
try:
    from flatlib import chart, geopos, date
    FLATLIB_AVAILABLE = True
except ImportError:
    FLATLIB_AVAILABLE = False

# ============================================
# БАЗА ЗНАНИЙ (ПРОМТЫ / ТЕКСТЫ)
# Твоя девушка будет править этот раздел
# ============================================

SIGN_NAMES_RU = {
    "Aries": "Овен", "Taurus": "Телец", "Gemini": "Близнецы", "Cancer": "Рак",
    "Leo": "Лев", "Virgo": "Дева", "Libra": "Весы", "Scorpio": "Скорпион",
    "Sagittarius": "Стрелец", "Capricorn": "Козерог", "Aquarius": "Водолей", "Pisces": "Рыбы"
}

# Шаблоны интерпретаций планет в знаках
PLANET_INTERPRETATIONS = {
    "Sun": {
        "Aries": "Солнце в Овне даёт тебе лидерские качества, импульсивность и жажду новых начинаний. Ты не любишь ждать — действуешь сразу.",
        "Taurus": "Солнце в Тельце делает тебя устойчивым, практичным и ценящим комфорт. Ты умеешь наслаждаться жизнью и строить надёжный фундамент.",
        "Gemini": "Солнце в Близнецах наделяет тебя любознательностью, гибкостью ума и талантом к общению. Ты легко адаптируешься к переменам.",
        "Cancer": "Солнце в Раке даёт глубокую эмоциональность, интуицию и привязанность к близким. Ты чувствуешь настроение других как своё.",
        "Leo": "Солнце во Льве делает тебя ярким, творческим и уверенным в себе. Ты любишь быть в центре внимания и вдохновлять людей.",
        "Virgo": "Солнце в Деве наделяет аналитическим умом, вниманием к деталям и желанием помогать. Ты стремишься к порядку и совершенству.",
        "Libra": "Солнце в Весах даёт чувство гармонии, дипломатичность и стремление к партнёрству. Ты умеешь находить баланс в любых ситуациях.",
        "Scorpio": "Солнце в Скорпионе наделяет глубиной, страстностью и мощной интуицией. Ты видишь суть там, где другие видят поверхность.",
        "Sagittarius": "Солнце в Стрельце делает тебя оптимистом, философом и искателем приключений. Ты стремишься к расширению горизонтов.",
        "Capricorn": "Солнце в Козероге даёт дисциплину, амбиции и ответственность. Ты умеешь ставить долгосрочные цели и достигать их.",
        "Aquarius": "Солнце в Водолее наделяет оригинальностью, независимостью и гуманизмом. Ты думаешь о будущем и ценишь свободу.",
        "Pisces": "Солнце в Рыбах даёт богатое воображение, эмпатию и духовность. Ты чувствуешь тонкие энергии и умеешь сострадать."
    },
    "Moon": {
        "Aries": "Луна в Овне: эмоции быстрые и прямые. Ты реагируешь мгновенно, но так же быстро отходишь.",
        "Taurus": "Луна в Тельце: потребность в стабильности и комфорте. Тебя успокаивает вкусная еда и уют.",
        "Gemini": "Луна в Близнецах: эмоции через общение. Тебе важно говорить, делиться, узнавать новое.",
        "Cancer": "Луна в Раке (сильная позиция): глубокая чувствительность, забота о близких, сильная интуиция.",
        "Leo": "Луна во Льве: эмоции яркие, потребность в признании. Ты любишь, когда тебя хвалят и замечают.",
        "Virgo": "Луна в Деве: эмоции через заботу и порядок. Тебе важно чувствовать полезность.",
        "Libra": "Луна в Весах: гармония в чувствах, потребность в партнёре. Одиночество даётся тяжело.",
        "Scorpio": "Луна в Скорпионе: интенсивные, глубокие эмоции. Ты всё чувствуешь на 200%.",
        "Sagittarius": "Луна в Стрельце: оптимизм в чувствах, потребность в свободе и приключениях.",
        "Capricorn": "Луна в Козероге: сдержанность в эмоциях, ответственность. Ты не показываешь слабость.",
        "Aquarius": "Луна в Водолее: эмоции через идеи и дружбу. Ты ценишь независимость даже в чувствах.",
        "Pisces": "Луна в Рыбах (сильная позиция): высокая эмпатия, мечтательность, тонкое восприятие мира."
    }
}

# Шаблоны гороскопов (заглушки, пока нет AI)
HOROSCOPE_TEMPLATES = {
    "day": {
        "general": [
            "Сегодня звёзды благоприятствуют активным действиям. Не откладывай важное на потом.",
            "День требует внимания к деталям. Мелочи могут сыграть большую роль.",
            "Энергия дня направлена на общение. Используй это для решения личных и рабочих вопросов."
        ],
        "love": [
            "В любви сегодня важна искренность. Скажи то, что давно хотел(а).",
            "Романтическое настроение в воздухе. Одиноким — шанс на интересное знакомство.",
            "В отношениях — период гармонии. Уделите время друг другу."
        ],
        "career": [
            "На работе возможен прорыв в застарелом вопросе. Прояви инициативу.",
            "Финансовый день: будь внимателен(на) к тратам и предложениям.",
            "Коллеги оценят твою помощь. Не отказывай в поддержке."
        ]
    },
    "month": {
        "general": "Этот месяц принесёт важные перемены в сфере {sphere}. Будь готов(а) адаптироваться.",
        "love": "В личной жизни месяц благоприятен для {action}. Не бойся проявлять чувства.",
        "career": "В карьере месяц требует {strategy}. Результат не заставит себя ждать."
    },
    "year": {
        "general": "Годовой вектор направлен на {theme}. Это время роста и трансформации.",
        "love": "В отношениях год принесёт {outcome}. Доверяй своей интуиции.",
        "career": "В профессиональной сфере год благоприятен для {goal}. Действуй смело."
    }
}

# ============================================
# РАСЧЁТ НАТАЛЬНОЙ КАРТЫ (РЕАЛЬНЫЙ)
# ============================================

def get_chart_data(birth_date: str, birth_time: str, lat: float = 55.75, lon: float = 37.62):
    """
    Рассчитывает положение планет на дату/время/место.
    birth_date: 'YYYY-MM-DD'
    birth_time: 'HH:MM'
    lat, lon: координаты места рождения (по умолчанию Москва)
    """
    if not FLATLIB_AVAILABLE:
        # Если flatlib не установлен — возвращаем демо-данные
        return {
            "Sun": {"sign": "Leo", "degree": 15.5, "house": 10},
            "Moon": {"sign": "Cancer", "degree": 8.2, "house": 9},
            "Mercury": {"sign": "Virgo", "degree": 22.1, "house": 11},
            "Ven": {"sign": "Libra", "degree": 3.7, "house": 12},
            "Mars": {"sign": "Aries", "degree": 28.9, "house": 5},
            "note": "Установите flatlib для точных расчётов"
        }
    
    try:
        # Парсим дату и время
        d = birth_date.split('-')
        t = birth_time.split(':')
        dt = date.Date(int(d[0]), int(d[1]), int(d[2]), int(t[0]), int(t[1]), 0)
        geo = geopos.GeoPos(lat, lon)
        
        # Строим карту
        c = chart.Chart(dt, geo)
        
        result = {}
        # Список объектов для расчёта
        objects = ['Sun', 'Moon', 'Mercury', 'Ven', 'Mars', 'Jup', 'Sat', 'Ura', 'Nep', 'Plu']
        
        for obj_id in objects:
            obj = c.get(obj_id)
            if obj:
                # Определяем дом (упрощённо)
                house_num = 1 + int((obj.lon - c.houses().cusps[0]) // 30) % 12
                result[obj_id] = {
                    "sign": obj.sign,
                    "sign_ru": SIGN_NAMES_RU.get(obj.sign, obj.sign),
                    "degree": round(obj.lon % 30, 2),
                    "house": house_num
                }
        
        # Асцендент
        asc = c.get('Asc')
        if asc:
            result['Ascendant'] = {
                "sign": asc.sign,
                "sign_ru": SIGN_NAMES_RU.get(asc.sign, asc.sign),
                "degree": round(asc.lon % 30, 2)
            }
        
        return result
        
    except Exception as e:
        return {"error": f"Calculation error: {str(e)}"}

# ============================================
# ГЕНЕРАЦИЯ ТЕКСТОВ (ПРОМТЫ)
# ============================================

def generate_horoscope_text(sign: str, period: str = "day", category: str = "general") -> str:
    """Генерирует текст гороскопа на основе шаблонов."""
    if period == "day":
        options = HOROSCOPE_TEMPLATES["day"].get(category, HOROSCOPE_TEMPLATES["day"]["general"])
        return random.choice(options)
    
    elif period == "month":
        sphere = "личных отношений" if category == "love" else "карьеры" if category == "career" else "жизни в целом"
        return HOROSCOPE_TEMPLATES["month"][category].format(sphere=sphere, action="открытости", strategy="терпения")
    
    elif period == "year":
        theme = "саморазвития" if category == "general" else "построения гармонии" if category == "love" else "профессионального роста"
        return HOROSCOPE_TEMPLATES["year"][category].format(theme=theme, outcome="укрепление связи", goal="реализации планов")
    
    return "Звёзды молчат. Попробуйте позже."

def generate_natal_interpretation(planets: dict) -> str:
    """Собирает интерпретацию натальной карты из шаблонов."""
    if "error" in planets:
        return f"⚠️ {planets['error']}"
    
    lines = []
    
    # Солнце
    if "Sun" in planets:
        s = planets["Sun"]["sign"]
        text = PLANET_INTERPRETATIONS["Sun"].get(s, f"Солнце в {SIGN_NAMES_RU.get(s, s)} даёт уникальные качества.")
        lines.append(f"☀️ **Солнце в {planets['Sun']['sign_ru']}**\n{text}")
    
    # Луна
    if "Moon" in planets:
        m = planets["Moon"]["sign"]
        text = PLANET_INTERPRETATIONS["Moon"].get(m, f"Луна в {SIGN_NAMES_RU.get(m, m)} формирует эмоциональный фон.")
        lines.append(f"\n🌙 **Луна в {planets['Moon']['sign_ru']}**\n{text}")
    
    # Асцендент
    if "Ascendant" in planets:
        a = planets["Ascendant"]["sign"]
        lines.append(f"\n⬆️ **Асцендент в {planets['Ascendant']['sign_ru']}**\nТы производишь впечатление человека, который {get_asc_description(a)}.")
    
    return "\n\n".join(lines)

def get_asc_description(sign: str) -> str:
    """Краткое описание Асцендента."""
    descs = {
        "Aries": "энергичен и прямолинеен",
        "Taurus": "спокоен и надёжен",
        "Gemini": "общителен и любопытен",
        "Cancer": "заботлив и интуитивен",
        "Leo": "ярок и уверен",
        "Virgo": "внимателен и практичен",
        "Libra": "дипломатичен и гармоничен",
        "Scorpio": "интенсивен и проницателен",
        "Sagittarius": "оптимистичен и свободен",
        "Capricorn": "серьёзен и ответственен",
        "Aquarius": "оригинален и независим",
        "Pisces": "мечтателен и эмпатичен"
    }
    return descs.get(sign, "непредсказуем")

def generate_compatibility_text(sign1: str, sign2: str) -> dict:
    """Анализ совместимости двух знаков."""
    # Таблица стихий
    elements = {
        "Aries": "Fire", "Leo": "Fire", "Sagittarius": "Fire",
        "Taurus": "Earth", "Virgo": "Earth", "Capricorn": "Earth",
        "Gemini": "Air", "Libra": "Air", "Aquarius": "Air",
        "Cancer": "Water", "Scorpio": "Water", "Pisces": "Water"
    }
    
    el1 = elements.get(sign1, "Fire")
    el2 = elements.get(sign2, "Fire")
    
    # Базовый скор
    if el1 == el2:
        score = random.randint(75, 90)
        comment = "Одинаковые стихии создают понимание с полуслова."
    elif (el1 in ["Fire", "Air"] and el2 in ["Fire", "Air"]) or (el1 in ["Earth", "Water"] and el2 in ["Earth", "Water"]):
        score = random.randint(65, 80)
        comment = "Стихии дополняют друг друга: огонь разжигает воздух, земля удерживает воду."
    else:
        score = random.randint(45, 65)
        comment = "Разные стихии требуют работы над пониманием, но могут дать уникальный опыт."
    
    # Детализация
    details = {
        "love": min(100, score + random.randint(-5, 10)),
        "friendship": min(100, score + random.randint(-8, 8)),
        "career": min(100, score + random.randint(-10, 12)),
        "emotions": min(100, score + random.randint(-7, 7))
    }
    
    return {
        "sign1_ru": SIGN_NAMES_RU.get(sign1, sign1),
        "sign2_ru": SIGN_NAMES_RU.get(sign2, sign2),
        "score": score,
        "comment": comment,
        "details": details,
        "text": f"{SIGN_NAMES_RU.get(sign1, sign1)} + {SIGN_NAMES_RU.get(sign2, sign2)}\n\n{comment}\n\n💕 Любовь: {details['love']}%\n🤝 Дружба: {details['friendship']}%\n💼 Работа: {details['career']}%\n💭 Эмоции: {details['emotions']}%"
    }

def generate_horary_answer(question: str) -> str:
    """
    Заглушка для хорара.
    ПОЗЖЕ: сюда твоя девушка вставит реальный промт для AI.
    """
    # Простая логика для демо
    keywords_positive = ["получится", "успех", "да", "будет", "стоит"]
    keywords_negative = ["не получится", "провал", "нет", "не стоит", "опасно"]
    
    q_lower = question.lower()
    
    if any(k in q_lower for k in keywords_positive):
        return "🔮 Звёзды говорят: ДА. Действуйте смело, но с оглядкой на детали. Благоприятный период — ближайшие 2 недели."
    elif any(k in q_lower for k in keywords_negative):
        return "🔮 Звёзды предупреждают: сейчас не лучший момент. Отложите решение на 10-14 дней или пересмотрите подход."
    else:
        return "🔮 Ситуация неоднозначна. Задайте вопрос конкретнее: что именно вы хотите узнать? Да/Нет, когда, как?"