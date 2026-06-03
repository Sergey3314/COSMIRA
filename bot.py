import os
import asyncio
import logging
import pathlib
from openai import AsyncOpenAI
from datetime import datetime

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton, FSInputFile
import asyncpg
from aiohttp import web
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)

# ==========================================
# КОНФИГУРАЦИЯ
# ==========================================
BOT_TOKEN = os.getenv("BOT_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://cosmira-bot.onrender.com/")
PORT = int(os.getenv("PORT", 10000))

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# ==========================================
# БАЗА ДАННЫХ
# ==========================================
async def get_conn():
    return await asyncpg.connect(DATABASE_URL)

async def init_db():
    conn = await get_conn()
    try:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT,
                name TEXT,
                joined TEXT,
                premium BOOLEAN DEFAULT FALSE,
                free_uses INTEGER DEFAULT 3,
                birth_date TEXT,
                birth_time TEXT,
                birth_place TEXT,
                zodiac TEXT,
                avatar TEXT DEFAULT '🔮'
            )
        """)
        
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                type TEXT,
                sign TEXT,
                period TEXT,
                category TEXT,
                result_text TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        logging.info("✅ База данных инициализирована")
    finally:
        await conn.close()

async def save_user(user_id, username, name, birth_date=None, birth_time=None, birth_place=None, zodiac=None, avatar='🔮'):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO users (user_id, username, name, joined, premium, free_uses, 
                               birth_date, birth_time, birth_place, zodiac, avatar)
            VALUES ($1, $2, $3, $4, FALSE, 3, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id) DO UPDATE SET
                username = COALESCE($2, users.username),
                name = COALESCE($3, users.name),
                birth_date = COALESCE($5, users.birth_date),
                birth_time = COALESCE($6, users.birth_time),
                birth_place = COALESCE($7, users.birth_place),
                zodiac = COALESCE($8, users.zodiac),
                avatar = COALESCE($9, users.avatar)
        """, str(user_id), username, name, datetime.now().isoformat(),
            birth_date, birth_time, birth_place, zodiac, avatar)
    finally:
        await conn.close()

async def get_user(user_id):
    conn = await get_conn()
    try:
        row = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", str(user_id))
        if row:
            user = dict(row)
            user['birth_city'] = user.get('birth_place') or ''
            user['has_profile'] = bool(user.get('birth_date'))
            user['is_premium'] = user.get('premium', False)
            user['telegram_id'] = user['user_id']
            
            if user.get('zodiac'):
                try:
                    z = user['zodiac']
                    if z.startswith('{'):
                        import ast
                        user['zodiac'] = ast.literal_eval(z)
                except:
                    user['zodiac'] = None
            return user
        return None
    finally:
        await conn.close()

async def save_reading(user_id, type, sign, period, category, result_text):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO readings (user_id, type, sign, period, category, result_text)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, str(user_id), type, sign, period, category, result_text)
    finally:
        await conn.close()

async def get_history(user_id, limit=20):
    conn = await get_conn()
    try:
        rows = await conn.fetch("""
            SELECT * FROM readings 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2
        """, str(user_id), limit)
        
        # Конвертируем datetime в строки
        result = []
        for row in rows:
            item = dict(row)
            if item.get('created_at'):
                item['created_at'] = item['created_at'].isoformat()
            result.append(item)
        
        return result
    finally:
        await conn.close()

# ==========================================
# TELEGRAM БОТ
# ==========================================
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✨ Открыть COSMIRA", web_app=WebAppInfo(url=WEBAPP_URL))]
    ])
    
    photo_path = pathlib.Path(__file__).parent / "static" / "welcome.png"
    caption = (
        "**🌌 Добро пожаловать в COSMIRA**\n\n"
        "*Твой персональный проводник в мир звёзд*\n\n"
        "✨ **Что мы умеем:**\n"
        "• 🔮 Натальные карты и расчёт планет\n"
        "• 🌟 Персональные гороскопы каждый день\n"
        "• 💫 Совместимость партнёров\n"
        "• 🔮 Ответы на главные вопросы (Хорар)\n\n"
        "Нажми кнопку, чтобы начать путешествие! 👇"
    )
    
    if photo_path.exists():
        photo = FSInputFile(str(photo_path))
        await message.answer_photo(photo=photo, caption=caption, reply_markup=kb, parse_mode="Markdown")
    else:
        await message.answer(caption.replace("**", "").replace("*", ""), reply_markup=kb)

@dp.message(lambda m: m.web_app_data)
async def handle_webapp_data(message: types.Message):
    await message.answer("📥 Данные из приложения получены")

# ==========================================
# API ДЛЯ WEB APP
# ==========================================

async def handle_init_user(request):
    try:
        data = await request.json()
        telegram_id = str(data.get('telegram_id') or data.get('id'))
        username = data.get('username', '')
        first_name = data.get('first_name', 'Пользователь')
        
        if not telegram_id:
            return web.json_response({"error": "No telegram_id"}, status=400)
        
        existing = await get_user(telegram_id)
        if existing:
            return web.json_response(existing)
        
        await save_user(
            user_id=telegram_id,
            username=username,
            name=first_name,
            avatar='🔮'
        )
        user = await get_user(telegram_id)
        return web.json_response(user)
    except Exception as e:
        logging.error(f"Init user error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def handle_save_profile(request):
    try:
        data = await request.json()
        telegram_id = str(data.get('telegram_id'))
        
        if not telegram_id:
            return web.json_response({"error": "No telegram_id"}, status=400)
        
        birth_date = data.get('birth_date')
        zodiac = None
        if birth_date:
            from datetime import datetime as dt
            try:
                d = dt.strptime(birth_date, '%Y-%m-%d')
                month, day = d.month, d.day
                signs = [
                    ('Козерог', '♑', 1, 1, 1, 19), ('Водолей', '♒', 1, 20, 2, 18),
                    ('Рыбы', '♓', 2, 19, 3, 20), ('Овен', '♈', 3, 21, 4, 19),
                    ('Телец', '♉', 4, 20, 5, 20), ('Близнецы', '♊', 5, 21, 6, 20),
                    ('Рак', '♋', 6, 21, 7, 22), ('Лев', '♌', 7, 23, 8, 22),
                    ('Дева', '♍', 8, 23, 9, 22), ('Весы', '♎', 9, 23, 10, 22),
                    ('Скорпион', '♏', 10, 23, 11, 21), ('Стрелец', '♐', 11, 22, 12, 21),
                    ('Козерог', '♑', 12, 22, 12, 31)
                ]
                for name, emoji, m1, d1, m2, d2 in signs:
                    after = month > m1 or (month == m1 and day >= d1)
                    before = month < m2 or (month == m2 and day <= d2)
                    if after and before:
                        zodiac = {'name': name, 'emoji': emoji}
                        break
            except:
                pass
        
        await save_user(
            user_id=telegram_id,
            username=data.get('username'),
            name=data.get('name', 'Пользователь'),
            birth_date=birth_date,
            birth_time=data.get('birth_time'),
            birth_place=data.get('birth_city', ''),
            zodiac=str(zodiac) if zodiac else None,
            avatar=data.get('avatar', '🔮')
        )
        
        user = await get_user(telegram_id)
        return web.json_response(user)
    except Exception as e:
        logging.error(f"Save profile error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def handle_horoscope(request):
    try:
        data = await request.json()
        sign = data.get('sign', 'aries')
        period = data.get('period', 'day')
        category = data.get('category', 'general')
        user_id = data.get('user_id', 'anonymous')
        
        current_year = datetime.now().year
        
        client = AsyncOpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url=os.getenv('OPENAI_BASE_URL', 'https://api.proxyapi.ru/v1')
        )
        
        sign_names = {
            'aries': 'Овен', 'taurus': 'Телец', 'gemini': 'Близнецы',
            'cancer': 'Рак', 'leo': 'Лев', 'virgo': 'Дева',
            'libra': 'Весы', 'scorpio': 'Скорпион', 'sagittarius': 'Стрелец',
            'capricorn': 'Козерог', 'aquarius': 'Водолей', 'pisces': 'Рыбы'
        }
        sign_name = sign_names.get(sign, sign)
        
        period_names = {'day': 'дневной', 'month': 'прогноз на месяц', 'year': f'прогноз на {current_year} год'}
        category_names = {'general': 'общий', 'love': 'прогноз о любви', 'career': 'прогноз о карьере'}
        
        prompt = f"""Ты профессиональный астролог с 20-летним опытом. 
Напиши {period_names.get(period, 'дневной')} {category_names.get(category, 'общий')} для знака {sign_name}.

ОТВЕЧАЙ СТРОГО ПО ЭТОЙ СТРУКТУРЕ (без вступлений, сразу начинай с первого раздела):

🌟 ЭНЕРГИЯ ДНЯ
(2-3 предложения о общей энергии и настроении)

💫 ЛЮБОВЬ И ОТНОШЕНИЯ
(2-3 предложения о любви, отношениях, чувствах)

💰 РАБОТА И ФИНАНСЫ
(2-3 предложения о карьере, деньгах, делах)

🔮 СОВЕТ ЗВЁЗД
(1-2 предложения с мудрым советом)

ПРАВИЛА:
- Пиши душевно, тепло, с эмпатией
- Используй метафоры и образы
- Каждый раздел с новой строки
- Используй эмодзи как в структуре выше
- Длина: 200-250 слов
- Не используй слова "проблемы", "кризис", "негатив"
- Будь конкретным и вдохновляющим
- Упоминай текущий {current_year} год если это уместно

Начни сразу с раздела 🌟 ЭНЕРГИЯ ДНЯ, без приветствий."""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты профессиональный астролог. Пишешь красивые, душевные гороскопы структурированно."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.7
        )
        
        text = response.choices[0].message.content.strip()
        
        # Сохраняем в историю
        await save_reading(user_id, 'horoscope', sign_name, period, category, text)
        
        return web.json_response({
            "text": text, 
            "sign": sign_name, 
            "period": period
        })
        
    except Exception as e:
        logging.error(f"Horoscope AI error: {e}")
        return web.json_response({
            "text": "Звёзды сейчас отдыхают... Попробуй через минуту ✨",
            "sign": "—",
            "period": "day"
        })

async def handle_history(request):
    try:
        uid = request.query.get('uid')
        if not uid:
            return web.json_response({"error": "No uid"}, status=400)
        
        history = await get_history(uid, limit=20)
        return web.json_response(history)
    except Exception as e:
        logging.error(f"History error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def handle_compatibility(request):
    try:
        data = await request.json()
        sign1 = data.get('sign1', 'leo')
        sign2 = data.get('sign2', 'libra')
        user_id = data.get('user_id', 'anonymous')
        
        sign_names = {
            'aries': 'Овен', 'taurus': 'Телец', 'gemini': 'Близнецы',
            'cancer': 'Рак', 'leo': 'Лев', 'virgo': 'Дева',
            'libra': 'Весы', 'scorpio': 'Скорпион', 'sagittarius': 'Стрелец',
            'capricorn': 'Козерог', 'aquarius': 'Водолей', 'pisces': 'Рыбы'
        }
        name1 = sign_names.get(sign1, sign1)
        name2 = sign_names.get(sign2, sign2)
        
        # AI анализ совместимости
        client = AsyncOpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url=os.getenv('OPENAI_BASE_URL', 'https://api.proxyapi.ru/v1')
        )
        
        prompt = f"""Ты профессиональный астролог-синастрист. Проанализируй совместимость пары:
        
**{name1}** и **{name2}**

ДАЙ РАЗВЁРНУТЫЙ ОТВЕТ ПО СТРУКТУРЕ:

🔥 ОБЩАЯ ЭНЕРГЕТИКА СОЮЗА
(2-3 предложения о том, как знаки взаимодействуют)

💖 ЛЮБОВЬ И ЧУВСТВА
(2-3 предложения о романтической совместимости)

🤝 ДРУЖБА И ПОНЯМАНИЕ
(2-3 предложения о ментальной связи)

⚡ СИЛЬНЫЕ СТОРОНЫ
(2-3 пункта что работает отлично)

⚠️ ЗОНЫ РИСКА
(2-3 пункта над чем работать)

🌟 СОВЕТ ЗВЁЗД
(1-2 предложения как гармонизировать отношения)

ПРАВИЛА:
- Пиши душевно, с эмпатией
- Будь конкретен, но не жесток
- Используй метафоры и образы
- Длина: 250-350 слов
- Добавь 2-3 эмодзи
- Не используй слова "катастрофа", "ужасно", "невозможно"
- Даже в сложных аспектах находи возможности роста

Начни сразу с раздела 🔥 ОБЩАЯ ЭНЕРГЕТИКА."""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты астролог-синастрист. Даёшь глубокий, но тактичный анализ совместимости."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        text = response.choices[0].message.content.strip()
        
        # Рассчитываем процент совместимости на основе анализа
        import hashlib
        h = int(hashlib.md5(f"{sign1}{sign2}".encode()).hexdigest(), 16)
        score = 60 + (h % 35)  # от 60 до 95
        
        # Сохраняем в историю
        await save_reading(
            user_id, 
            'compatibility', 
            f"{name1} + {name2}", 
            'синастрия', 
            'совместимость', 
            text
        )
        
        return web.json_response({
            "score": score, 
            "text": text,
            "sign1": name1,
            "sign2": name2
        })
        
    except Exception as e:
        logging.error(f"Compatibility error: {e}")
        return web.json_response({"score": 0, "text": "Ошибка расчёта"}, status=500)

import swisseph as swe

# Простая база городов (координаты)
CITIES = {
    'москва': (55.7558, 37.6173), 'спб': (59.9311, 30.3609), 'санкт-петербург': (59.9311, 30.3609),
    'киев': (50.4501, 30.5234), 'минск': (53.9045, 27.5615), 'алматы': (43.2220, 76.8512),
    'ташкент': (41.2995, 69.2401), 'баку': (40.4093, 49.8671), 'екатеринбург': (56.8389, 60.6057),
    'новосибирск': (55.0084, 82.9357), 'казань': (55.7887, 49.1221), 'челябинск': (55.1644, 61.4368),
    'самара': (53.2001, 50.1500), 'ростов': (47.2357, 39.7015), 'уфа': (54.7388, 55.9721),
    'красноярск': (56.0184, 92.8672), 'воронеж': (51.6720, 39.1843), 'пермь': (58.0105, 56.2502)
}

async def handle_natal(request):
    try:
        data = await request.json()
        user_id = data.get('user_id', 'anonymous')
        
        # Берем данные юзера из БД если они есть
        birth_date = data.get('birth_date')
        birth_time = data.get('birth_time')
        birth_city = data.get('birth_city', '').lower()
        
        if not birth_date or not birth_time:
            return web.json_response({"error": "Нужна дата и время рождения"}, status=400)
        
        # Координаты города
        lat, lon = 55.75, 37.61 # Москва по умолчанию
        for city_name, coords in CITIES.items():
            if city_name in birth_city:
                lat, lon = coords
                break
        
        # Парсим дату
        from datetime import datetime
        dt = datetime.strptime(f"{birth_date} {birth_time}", "%Y-%m-%d %H:%M")
        
        # Расчет Юлианского дня
        jd = swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute/60.0)
        
        # Список планет
        planet_ids = [swe.SUN, swe.MOON, swe.MERCURY, swe.VENUS, swe.MARS, 
                      swe.JUPITER, swe.SATURN, swe.URANUS, swe.NEPTUNE, swe.PLUTO]
        planet_names_ru = ['Солнце', 'Луна', 'Меркурий', 'Венера', 'Марс', 
                           'Юпитер', 'Сатурн', 'Уран', 'Нептун', 'Плутон']
        
        planets_data = []
        sun_sign = moon_sign = ""
        
        for p_id, p_name in zip(planet_ids, planet_names_ru):
            res = swe.calc_ut(jd, p_id, swe.FLG_SWIEPH)
            longitude = res[0][0] # Долгота 0-360
            
            # Определяем знак
            sign_idx = int(longitude / 30)
            sign_names = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 
                          'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы']
            sign_emojis = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓']
            
            degree_in_sign = longitude % 30
            
            if p_name == 'Солнце': sun_sign = f"{sign_emojis[sign_idx]} {sign_names[sign_idx]}"
            if p_name == 'Луна': moon_sign = f"{sign_emojis[sign_idx]} {sign_names[sign_idx]}"
            
            planets_data.append({
                "name": p_name,
                "sign": sign_names[sign_idx],
                "emoji": sign_emojis[sign_idx],
                "degree": round(degree_in_sign, 2),
                "longitude": round(longitude, 2)
            })
        
        # Расчет Асцендента и MC (вершины домов)
        # swe.houses(jd, lat, lon, b'P') -> Placidus system
        cusps, ascmc = swe.houses(jd, lat, lon, b'P')
        asc_longitude = ascmc[0]
        asc_sign_idx = int(asc_longitude / 30)
        asc_sign_name = sign_names[asc_sign_idx]
        asc_sign_emoji = sign_emojis[asc_sign_idx]
        
        # AI Интерпретация
        client = AsyncOpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url=os.getenv('OPENAI_BASE_URL', 'https://api.proxyapi.ru/v1')
        )
        
        prompt = f"""Ты великий астролог с даром ясновидения. Расшифруй натальную карту:
- Солнце (суть личности): {sun_sign} ({planets_data[0]['degree']}°)
- Луна (эмоции, душа): {moon_sign} ({planets_data[1]['degree']}°)
- Асцендент (внешняя маска, как видят люди): {asc_sign_emoji} {asc_sign_name}

Напиши ПОЛНЫЙ РАЗБОР по структуре:
🌟 ТВОЯ СУТЬ (Солнце)
(3-4 предложения о характере, эго, жизненной силе)

🌙 ТВОЯ ДУША (Луна)
(3-4 предложения об эмоциях, подсознании, что дает комфорт)

🎭 ТВОЯ МАСКА (Асцендент)
(3-4 предложения о том, как тебя видят другие, первое впечатление)

 ГЛАВНЫЙ ВЫЗОВ КАРТЫ
(1-2 предложения: над чем тебе стоит работать в этой жизни)

ПРАВИЛА:
- Пиши МАГИЧЕСКИ, глубоко, как будто смотришь прямо в душу.
- Обращайся на "Ты".
- Используй метафоры стихий (огонь, вода, воздух, земля).
- Длина: 300-400 слов.
- Никаких "проблем" и "негатива", только точки роста.

Начни сразу с 🌟 ТВОЯ СУТЬ."""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты мистический астролог. Твои тексты — это откровения."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.8
        )
        
        interpretation = response.choices[0].message.content.strip()
        
        # Сохраняем в историю
        await save_reading(
            user_id, 'natal', f"Натальная карта", 'natal', 'general',
            f"️ {sun_sign} | 🌙 {moon_sign} | 🌅 {asc_sign_emoji}{asc_sign_name}\n\n{interpretation}"
        )
        
        return web.json_response({
            "planets": planets_data,
            "ascendant": {"sign": asc_sign_name, "emoji": asc_sign_emoji, "degree": round(asc_longitude % 30, 2)},
            "interpretation": interpretation,
            "sun_sign": sun_sign,
            "moon_sign": moon_sign
        })
        
    except Exception as e:
        logging.error(f"Natal error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def handle_horary(request):
    try:
        data = await request.json()
        question = data.get('question', '')
        user_id = data.get('user_id', 'anonymous')
        
        if not question:
            return web.json_response({"answer": "Задай вопрос, чтобы получить ответ звёзд."})
        
        client = AsyncOpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url=os.getenv('OPENAI_BASE_URL', 'https://api.proxyapi.ru/v1')
        )
        
        prompt = f"""Ты хорарный астролог с 30-летним опытом. Человек задал вопрос:

**"{question}"**

Дай ответ по структуре:

🌙 ОТВЕТ ЗВЁЗД
(прямой ответ: да/нет/возможно + краткое пояснение)

 АСТРОЛОГИЧЕСКАЯ КАРТИНА
(2-3 предложения о том, что говорят планеты)

⏰ БЛАГОПРИЯТНОЕ ВРЕМЯ
(когда лучше действовать)

💫 РЕКОМЕНДАЦИЯ
(конкретный совет что делать)

ПРАВИЛА:
- Будь точен, но не категоричен
- Не давай медицинских/юридических советов
- Длина: 200-300 слов
- Добавь 1-2 эмодзи
- Тон: мудрый, спокойный, поддерживающий
- Если вопрос не по теме астрологии — мягко скажи об этом

Начни сразу с раздела 🌙 ОТВЕТ ЗВЁЗД."""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты хорарный астролог. Даёшь точные, но тактичные ответы на вопросы."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.6
        )
        
        answer = response.choices[0].message.content.strip()
        
        # Сохраняем в историю
        await save_reading(
            user_id, 
            'horary', 
            'Вопрос', 
            'хорар', 
            'general', 
            f"**Вопрос:** {question}\n\n{answer}"
        )
        
        return web.json_response({
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"Horary error: {e}")
        return web.json_response({"answer": "Связь с космосом потеряна"}, status=500)
# ==========================================
# ЗАПУСК
# ==========================================
async def main():
    await init_db()
    
    web_app = web.Application()
    
    webapp_dir = pathlib.Path(__file__).parent / 'webapp'
    if webapp_dir.exists():
        web_app.router.add_static('/webapp/', path=str(webapp_dir))
    
    async def handle_index(request):
        return web.FileResponse(webapp_dir / 'index.html')
    
    web_app.router.add_get('/', handle_index)
    
    web_app.router.add_post('/api/user', handle_init_user)
    web_app.router.add_post('/api/profile', handle_save_profile)
    web_app.router.add_post('/api/horoscope', handle_horoscope)
    web_app.router.add_post('/api/compatibility', handle_compatibility)
    web_app.router.add_post('/api/natal', handle_natal)
    web_app.router.add_post('/api/horary', handle_horary)
    web_app.router.add_get('/api/history', handle_history)
    
    async def start_polling(app):
        asyncio.create_task(dp.start_polling(bot))
    
    web_app.on_startup.append(start_polling)
    
    runner = web.AppRunner(web_app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()
    logging.info(f"✅ Сервер запущен на порту {PORT}")
    
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())