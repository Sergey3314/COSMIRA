import os, json, logging
from datetime import datetime
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.filters import Command
from aiohttp import web

load_dotenv()
TOKEN = os.getenv("TOKEN")
if not TOKEN:
    raise RuntimeError("TOKEN missing!")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

USERS_FILE = "users.json"
ADMIN_ID = 8789067375

def load_users():
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=4)

def register_user(user):
    users = load_users()
    uid = str(user.id)
    if uid not in users:
        users[uid] = {
            "id": user.id,
            "username": user.username,
            "name": user.full_name,
            "joined": datetime.now().strftime("%d.%m.%Y %H:%M"),
            "messages": 0,
            "premium": False,
            "level": 1
        }
    users[uid]["messages"] = users[uid].get("messages", 0) + 1
    users[uid]["level"] = 1 + (users[uid]["messages"] // 50)
    save_users(users)
    return users[uid]

dp = Dispatcher()
logging.info("✅ COSMIRA STARTED")

# 🔘 КНОПКИ
main_kb = ReplyKeyboardMarkup(keyboard=[
    [KeyboardButton(text="🚀 Открыть COSMIRA", web_app=WebAppInfo(url="https://cosmira.netlify.app/"))],
    [KeyboardButton(text="👤 Профиль"), KeyboardButton(text="💎 Premium")],
    [KeyboardButton(text="📊 Статистика"), KeyboardButton(text="⚙️ Настройки")]
], resize_keyboard=True)

@dp.message(Command("start"))
async def start_cmd(m: Message):
    register_user(m.from_user)
    await m.answer("🌌 <b>COSMIRA AI</b>\n\nЖми кнопку ниже 👇", reply_markup=main_kb, parse_mode=ParseMode.HTML)

@dp.message(F.text == "👤 Профиль")
async def profile_cmd(m: Message):
    u = load_users().get(str(m.from_user.id), {})
    await m.answer(f"👤 {u.get('name','')}\n⭐ Уровень: {u.get('level',1)}\n💬 Сообщений: {u.get('messages',0)}")

@dp.message(F.text == "💎 Premium")
async def prem_cmd(m: Message):
    await m.answer("💎 Premium скоро! ✨")

@dp.message(F.text == "📊 Статистика")
async def stats_cmd(m: Message):
    users = load_users()
    await m.answer(f"👥 {len(users)} пользователей\n💬 {sum(u.get('messages',0) for u in users.values())} сообщений")

@dp.message(F.text == "⚙️ Настройки")
async def settings_cmd(m: Message):
    await m.answer("⚙️ В разработке...")

@dp.message()
async def echo(m: Message):
    await m.answer("Используй кнопки или /start 🚀")

# 🌐 Простой веб-сервер для health-check
async def health(req):
    return web.Response(text="OK")

async def start_web():
    app = web.Application()
    app.router.add_get("/", health)
    app.router.add_get("/api/health", health)
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.environ.get("PORT", 10000))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logging.info(f"🌐 Web on port {port}")

async def main():
    bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await start_web()
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("🛑 Stopped")