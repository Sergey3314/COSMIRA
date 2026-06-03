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
            
            # Безопасно парсим zodiac
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

# Регистрация/обновление пользователя из Telegram
async def handle_init_user(request):
    try:
        data = await request.json()
        telegram_id = str(data.get('telegram_id') or data.get('id'))
        username = data.get('username', '')
        first_name = data.get('first_name', 'Пользователь')
        
        if not telegram_id:
            return web.json_response({"error": "No telegram_id"}, status=400)
        
        # Проверяем есть ли юзер
        existing = await get_user(telegram_id)
        if existing:
            return web.json_response(existing)
        
        # Создаём нового
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

# Сохранение профиля (регистрация)
async def handle_save_profile(request):
    try:
        data = await request.json()
        telegram_id = str(data.get('telegram_id'))
        
        if not telegram_id:
            return web.json_response({"error": "No telegram_id"}, status=400)
        
        # Расчёт знака зодиака
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

# Гороскоп
async def handle_horoscope(request):
    try:
        data = await request.json()
        sign = data.get('sign', 'aries')
        period = data.get('period', 'day')
        category = data.get('category', 'general')
        
        # Инициализация OpenAI через proxy
        client = AsyncOpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url=os.getenv('OPENAI_BASE_URL', 'https://api.proxyapi.ru/v1')
        )
        
        # Промпт для AI
        sign_names = {
            'aries': 'Овен', 'taurus': 'Телец', 'gemini': 'Близнецы',
            'cancer': 'Рак', 'leo': 'Лев', 'virgo': 'Дева',
            'libra': 'Весы', 'scorpio': 'Скорпион', 'sagittarius': 'Стрелец',
            'capricorn': 'Козерог', 'aquarius': 'Водолей', 'pisces': 'Рыбы'
        }
        sign_name = sign_names.get(sign, sign)
        
        period_names = {'day': 'день', 'month': 'месяц', 'year': 'год'}
        category_names = {'general': 'общий', 'love': 'любовь', 'career': 'карьера'}
        
        prompt = f"""Ты профессиональный астролог с 20-летним опытом. 
Напиши {period_names.get(period, 'дневной')} {category_names.get(category, 'общий')} гороскоп для знака {sign_name}.

Требования к тексту:
- Пиши душевно, тепло, с эмпатией
- Используй метафоры и образы
- Давай практические советы
- Длина: 150-200 слов
- Добавь 1-2 эмодзи ✨
- Избегай шаблонных фраз
- Будь конкретным, но не сухим

Гороскоп:"""

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты профессиональный астролог. Пишешь красивые, душевные гороскопы."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        text = response.choices[0].message.content.strip()
        
        return web.json_response({
            "text": text, 
            "sign": sign_name, 
            "period": period
        })
        
    except Exception as e:
        logging.error(f"Horoscope AI error: {e}")
        # Фолбэк на демо-текст если AI не ответил
        return web.json_response({
            "text": "Звёзды сейчас отдыхают... Попробуй через минуту ✨",
            "sign": "—",
            "period": "day"
        })

# Совместимость
async def handle_compatibility(request):
    try:
        data = await request.json()
        sign1 = data.get('sign1', 'leo')
        sign2 = data.get('sign2', 'libra')
        
        sign_names = {
            'aries': 'Овен', 'taurus': 'Телец', 'gemini': 'Близнецы',
            'cancer': 'Рак', 'leo': 'Лев', 'virgo': 'Дева',
            'libra': 'Весы', 'scorpio': 'Скорпион', 'sagittarius': 'Стрелец',
            'capricorn': 'Козерог', 'aquarius': 'Водолей', 'pisces': 'Рыбы'
        }
        name1 = sign_names.get(sign1, sign1)
        name2 = sign_names.get(sign2, sign2)
        
        # Простой алгоритм совместимости
        import hashlib
        h = int(hashlib.md5(f"{sign1}{sign2}".encode()).hexdigest(), 16)
        score = 60 + (h % 35)  # от 60 до 95
        
        if score >= 85:
            text = f"{name1} и {name2} — союз, проверенный звёздами. Между вами сильная энергетическая связь, способная преодолеть любые преграды. Вы дополняете друг друга как свет и тень."
        elif score >= 75:
            text = f"{name1} и {name2} — гармоничный союз. У вас много общего, но есть и различия, которые делают отношения живыми. Учитесь слышать друг друга."
        else:
            text = f"{name1} и {name2} — непростой, но интересный союз. Вам предстоит многому научиться друг у друга. Терпение и уважение — ключ к счастью."
        
        return web.json_response({"score": score, "text": text})
    except Exception as e:
        logging.error(f"Compatibility error: {e}")
        return web.json_response({"score": 0, "text": "Ошибка расчёта"}, status=500)

# Натальная карта
async def handle_natal(request):
    try:
        data = await request.json()
        birth_date = data.get('birth_date')
        birth_time = data.get('birth_time')
        
        if not birth_date or not birth_time:
            return web.json_response({
                "planets": [],
                "interpretation": "Для расчёта натальной карты нужны дата и время рождения."
            })
        
        # Демо-планеты (потом реальный расчёт)
        planets = [
            {"name": "Солнце", "sign": "Лев", "degree": 15, "house": 5},
            {"name": "Луна", "sign": "Рак", "degree": 22, "house": 4},
            {"name": "Меркурий", "sign": "Дева", "degree": 8, "house": 6},
            {"name": "Венера", "sign": "Весы", "degree": 12, "house": 7},
            {"name": "Марс", "sign": "Овен", "degree": 28, "house": 1},
            {"name": "Юпитер", "sign": "Стрелец", "degree": 5, "house": 9},
            {"name": "Сатурн", "sign": "Козерог", "degree": 18, "house": 10}
        ]
        
        interpretation = "Твоя натальная карта показывает сильную личность с лидерскими качествами. Солнце в Льве даёт харизму, Луна в Раке — глубокую интуицию и привязанность к дому."
        
        return web.json_response({"planets": planets, "interpretation": interpretation})
    except Exception as e:
        logging.error(f"Natal error: {e}")
        return web.json_response({"planets": [], "interpretation": "Ошибка расчёта"}, status=500)

# Хорар
async def handle_horary(request):
    try:
        data = await request.json()
        question = data.get('question', '')
        
        if not question:
            return web.json_response({"answer": "Задай вопрос, чтобы получить ответ звёзд."})
        
        # Демо-ответы
        answers = [
            f"Звёзды отвечают: да, путь открыт. Действуй смело, но не торопись — вселенная поддерживает твои намерения.",
            f"Ответ звёзд положительный. Ситуация развивается в твою пользу, но требуется терпение. Результат придёт в нужный момент.",
            f"Звёзды советуют подождать. Сейчас не лучшее время для активных действий. Наблюдай и собирай информацию.",
            f"Ответ неоднозначен. Есть как возможности, так и риски. Прислушайся к интуиции — она подскажет верное решение.",
            f"Звёзды видят препятствия на пути, но они преодолимы. Главное — не сдавайся и ищи обходные пути."
        ]
        
        import hashlib
        h = int(hashlib.md5(question.encode()).hexdigest(), 16)
        answer = answers[h % len(answers)]
        
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
    
    # Статика
    webapp_dir = pathlib.Path(__file__).parent / 'webapp'
    if webapp_dir.exists():
        web_app.router.add_static('/webapp/', path=str(webapp_dir))
    
    async def handle_index(request):
        return web.FileResponse(webapp_dir / 'index.html')
    
    web_app.router.add_get('/', handle_index)
    
    # API
    web_app.router.add_post('/api/user', handle_init_user)
    web_app.router.add_post('/api/profile', handle_save_profile)
    web_app.router.add_post('/api/horoscope', handle_horoscope)
    web_app.router.add_post('/api/compatibility', handle_compatibility)
    web_app.router.add_post('/api/natal', handle_natal)
    web_app.router.add_post('/api/horary', handle_horary)
    
    # Фоновый поллинг бота
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