import os, json, asyncio, logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.filters import Command
from aiohttp import web

from astro_engine import get_chart_data, generate_horoscope_text, generate_compatibility_text

load_dotenv()
TOKEN = os.getenv("TOKEN")
if not TOKEN: raise RuntimeError("TOKEN missing!")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

USERS_FILE = "users.json"
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "webapp"

def load_users():
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f: return json.load(f)
    except: return {}

def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f: json.dump(users, f, ensure_ascii=False, indent=4)

dp = Dispatcher()
logging.info("✅ COSMIRA ENGINE STARTED")

# --- TELEGRAM HANDLERS ---

@dp.message(Command("start"))
async def start_cmd(m: Message):
    users = load_users()
    uid = str(m.from_user.id)
    user = users.get(uid)
    
    if not user or not user.get("birth_date"):
        # Если нет данных - просим заполнить (в WebApp)
        btn = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="🔮 Заполнить профиль", web_app=WebAppInfo(url="https://cosmira-bot.onrender.com/?mode=register"))]], resize_keyboard=True)
        await m.answer("Привет! Чтобы строить карты, мне нужно знать дату и время твоего рождения. Нажми кнопку ниже.", reply_markup=btn)
    else:
        btn = ReplyKeyboardMarkup(keyboard=[[KeyboardButton(text="🚀 Открыть COSMIRA", web_app=WebAppInfo(url="https://cosmira-bot.onrender.com/"))]], resize_keyboard=True)
        await m.answer(f"Привет, {user.get('name', 'Звездный Странник')}! Твоя карта готова.", reply_markup=btn)

@dp.message()
async def echo(m: Message):
    await m.answer("Используй кнопку меню или /start")

# --- WEB API (Для WebApp) ---

async def api_get_user(request):
    uid = request.query.get("uid")
    users = load_users()
    return web.json_response(users.get(uid, {}))

async def api_save_user(request):
    data = await request.json()
    users = load_users()
    uid = str(data.get("id"))
    
    # Сохраняем астроданные
    users[uid] = {
        "id": data.get("id"),
        "name": data.get("name"),
        "birth_date": data.get("birth_date"), # YYYY-MM-DD
        "birth_time": data.get("birth_time"), # HH:MM
        "birth_city": data.get("birth_city"),
        "premium": False
    }
    save_users(users)
    return web.json_response({"status": "ok"})

async def api_natal_chart(request):
    uid = request.query.get("uid")
    users = load_users()
    u = users.get(uid)
    if not u or not u.get("birth_date"):
        return web.json_response({"error": "No data"}, status=400)
    
    # Реальный расчет
    chart = get_chart_data(u["birth_date"], u["birth_time"])
    return web.json_response(chart)

async def api_horoscope(request):
    sign = request.query.get("sign")
    period = request.query.get("period", "day")
    text = generate_horoscope_text(sign, period)
    return web.json_response({"text": text})

async def api_compatibility(request):
    s1 = request.query.get("s1")
    s2 = request.query.get("s2")
    res = generate_compatibility_text(s1, s2)
    return web.json_response(res)

async def serve_webapp(request):
    mode = request.query.get("mode")
    # Если режим регистрации - можно подгрузить другой html, но пока используем один
    index_path = STATIC_DIR / "index.html"
    return web.FileResponse(index_path) if index_path.exists() else web.Response(text="404", status=404)

async def start_web():
    app = web.Application()
    app.router.add_get("/", serve_webapp)
    app.router.add_static('/static/', path=str(STATIC_DIR), name='static')
    
    # API
    app.router.add_get("/api/user", api_get_user)
    app.router.add_post("/api/user", api_save_user)
    app.router.add_get("/api/natal", api_natal_chart)
    app.router.add_get("/api/horoscope", api_horoscope)
    app.router.add_get("/api/compatibility", api_compatibility)
    
    @web.middleware
    async def cors(req, handler):
        resp = await handler(req)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
    app.middlewares.append(cors)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", int(os.environ.get("PORT", 10000)))
    await site.start()
    logging.info("🌐 WebApp Online")

async def main():
    bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await start_web()
    await dp.start_polling(bot)

if __name__ == "__main__":
    try: asyncio.run(main())
    except: logging.info("Stopped")