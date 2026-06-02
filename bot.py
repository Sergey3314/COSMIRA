import os
import asyncio
import logging
import pathlib
from datetime import datetime

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
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
        # Основная таблица
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
                birth_place TEXT
            )
        """)
        
        # МИГРАЦИЯ: добавляем недостающие колонки (если их нет)
        await conn.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS zodiac TEXT,
            ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT ''
        """)
        
        logging.info("✅ База данных инициализирована (с миграцией zodiac + avatar)")
    finally:
        await conn.close()

async def save_user(user_id, username, name, birth_date, birth_time, birth_place, zodiac=None, avatar='🔮'):
    conn = await get_conn()
    try:
        await conn.execute("""
            INSERT INTO users (user_id, username, name, joined, premium, free_uses, 
                               birth_date, birth_time, birth_place, zodiac, avatar)
            VALUES ($1, $2, $3, $4, FALSE, 3, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id) DO UPDATE SET
                username = $2, name = $3,
                birth_date = $5, birth_time = $6, birth_place = $7,
                zodiac = $8, avatar = $9
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
            # Нормализуем поле для фронта: birth_place → birth_city
            user['birth_city'] = user.get('birth_place') or ''
            # Форматируем zodiac для фронта
            if user.get('zodiac'):
                try:
                    user['zodiac'] = eval(user['zodiac'])
                except:
                    user['zodiac'] = None
            return user
        return None
    finally:
        await conn.close()

# ==========================================
# TELEGRAM БОТ
# ==========================================
from aiogram.types import FSInputFile  # Убедись, что этот импорт есть в самом верху файла!

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✨ Открыть COSMIRA", web_app=WebAppInfo(url=WEBAPP_URL))]
    ])
    
    # Путь к твоей картинке
    photo = FSInputFile("static/welcome.png")
    
    caption = (
        "**🌌 Добро пожаловать в COSMIRA**\n\n"
        "*Твой персональный проводник в мир звёзд*\n\n"
        "✨ **Что мы умеем:**\n"
        "• 🔮 Натальные карты и расчёт планет\n"
        "• 🌟 Персональные гороскопы каждый день\n"
        "• 💫 Совместимость партнёров\n"
        "•  Ответы на главные вопросы (Хорар)\n\n"
        "Нажми кнопку, чтобы начать путешествие! 👇"
    )
    
    await message.answer_photo(
        photo=photo,
        caption=caption,
        reply_markup=kb,
        parse_mode="Markdown"
    )

@dp.message(lambda m: m.web_app_data)
async def handle_webapp_data(message: types.Message):
    await message.answer("📥 Данные из приложения получены")

# ==========================================
# API ДЛЯ WEB APP
# ==========================================
async def handle_get_user(request):
    uid = request.query.get('uid')
    if not uid:
        return web.json_response({"error": "No uid"}, status=400)
    user = await get_user(uid)
    return web.json_response(user if user else {})

async def handle_save_user(request):
    try:
        data = await request.json()
        zodiac = data.get('zodiac')
        if isinstance(zodiac, dict):
            zodiac = str(zodiac)
        
        await save_user(
            user_id=str(data.get('id')),
            username=data.get('username', ''),
            name=data.get('name', 'Пользователь'),
            birth_date=data.get('birth_date'),
            birth_time=data.get('birth_time'),
            birth_place=data.get('birth_city', ''),
            zodiac=zodiac,
            avatar=data.get('avatar', '🔮')
        )
        return web.json_response({"status": "ok", "user": data})
    except Exception as e:
        logging.error(f"Save error: {e}")
        return web.json_response({"status": "error", "error": str(e)}, status=500)

# Заглушки API (потом подключим AI)
async def handle_horoscope(request):
    sign = request.query.get('sign', 'Aries')
    return web.json_response({"text": f"Энергия {sign} сегодня направлена на внутренние преображения."})

async def handle_natal(request):
    return web.json_response({"planets": {}, "interpretation": ""})

async def handle_horary(request):
    try:
        data = await request.json()
        return web.json_response({"answer": "Звёзды ответят позже", "timestamp": datetime.now().isoformat()})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

# ==========================================
# ЗАПУСК
# ==========================================
async def main():
    await init_db()
    
    web_app = web.Application()
    
    # Статика
    webapp_dir = pathlib.Path(__file__).parent / 'webapp'
    web_app.router.add_static('/webapp/', path=webapp_dir)
    
    async def handle_index(request):
        return web.FileResponse(webapp_dir / 'index.html')
    
    web_app.router.add_get('/', handle_index)
    
    # API
    web_app.router.add_get('/api/user', handle_get_user)
    web_app.router.add_post('/api/user', handle_save_user)
    web_app.router.add_get('/api/horoscope', handle_horoscope)
    web_app.router.add_get('/api/natal', handle_natal)
    web_app.router.add_post('/api/horary', handle_horary)
    
    # Фоновый поллинг бота
    async def start_polling(app):
        asyncio.create_task(dp.start_polling(bot))
    
    web_app.on_startup.append(start_polling)
    
    runner = web.AppRunner(web_app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()
    logging.info(f" Сервер запущен на порту {PORT}")
    
    await asyncio.Event().wait()  # Ждём вечно

if __name__ == "__main__":
    asyncio.run(main())