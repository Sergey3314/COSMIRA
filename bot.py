import os, json, asyncio, logging, random
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.filters import Command
from aiohttp import web

from astro_engine import (
    get_chart_data, 
    generate_horoscope_text, 
    generate_compatibility_text,
    generate_natal_interpretation,
    generate_horary_answer
)

load_dotenv()
TOKEN = os.getenv("TOKEN")
if not TOKEN:
    raise RuntimeError("❌ TOKEN not found in environment variables!")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

USERS_FILE = "users.json"
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "webapp"

def load_users():
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}

def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=4)

dp = Dispatcher()
logging.info("✅ COSMIRA BOT STARTED")

# Клавиатура
def get_main_keyboard():
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="🚀 Открыть COSMIRA", web_app=WebAppInfo(url="https://cosmira-bot.onrender.com/"))],
        [KeyboardButton(text="👤 Профиль"), KeyboardButton(text="💎 Premium")],
        [KeyboardButton(text="📊 Статистика")]
    ], resize_keyboard=True)

@dp.message(Command("start"))
async def start_cmd(m: Message):
    users = load_users()
    uid = str(m.from_user.id)
    
    if uid not in users:
        users[uid] = {
            "id": m.from_user.id,
            "name": m.from_user.full_name,
            "username": m.from_user.username,
            "joined": datetime.now().strftime("%d.%m.%Y"),
            "messages": 0,
            "premium": False
        }
        save_users(users)
    
    users[uid]["messages"] = users[uid].get("messages", 0) + 1
    save_users(users)
    
    await m.answer(
        f"🌌 <b>COSMIRA</b>\n\nПривет, {m.from_user.first_name}!\n\nЯ помогу тебе узнать:\n• Гороскоп на день/месяц/год\n• Совместимость с партнёром\n• Твою натальную карту\n• Ответ на важный вопрос (Хорар)\n\nНажми кнопку ниже, чтобы начать ✨",
        reply_markup=get_main_keyboard(),
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "👤 Профиль")
async def profile_cmd(m: Message):
    users = load_users()
    u = users.get(str(m.from_user.id), {})
    
    text = f"👤 <b>Профиль</b>\n"
    text += f"Имя: {u.get('name', m.from_user.full_name)}\n"
    if u.get('birth_date'):
        text += f"📅 Дата рождения: {u['birth_date']}\n"
        text += f"⏰ Время: {u.get('birth_time', 'не указано')}\n"
        text += f"📍 Город: {u.get('birth_city', 'не указан')}\n"
    else:
        text += "⚠️ Заполни данные в приложении для расчётов"
    text += f"\n💎 Premium: {'✅ Да' if u.get('premium') else '❌ Нет'}"
    
    await m.answer(text, parse_mode=ParseMode.HTML)

@dp.message(F.text == "💎 Premium")
async def premium_cmd(m: Message):
    await m.answer(
        "💎 <b>COSMIRA PREMIUM</b>\n\n"
        "✨ Полный доступ к:\n"
        "• Гороскопам на месяц и год\n"
        "• Детальной натальной карте с аспектами\n"
        "• Неограниченным хорарным вопросам\n"
        "• Персональным рекомендациям от астролога\n\n"
        "💰 Тарифы:\n"
        "• Разовый разбор: 50₽\n"
        "• Подписка на месяц: 299₽\n"
        "• Подписка на год: 1990₽\n\n"
        "🔜 Оплата будет доступна в следующем обновлении!",
        parse_mode=ParseMode.HTML
    )

@dp.message(F.text == "📊 Статистика")
async def stats_cmd(m: Message):
    users = load_users()
    total = len(users)
    msgs = sum(u.get("messages", 0) for u in users.values())
    premium = sum(1 for u in users.values() if u.get("premium"))
    
    await m.answer(
        f"📊 <b>Статистика COSMIRA</b>\n\n"
        f"👥 Пользователей: {total}\n"
        f"💬 Всего сообщений: {msgs}\n"
        f"💎 Premium-подписок: {premium}",
        parse_mode=ParseMode.HTML
    )

@dp.message()
async def echo(m: Message):
    await m.answer("Используй кнопки меню или команду /start 🚀")

# ============================================
# WEB API ENDPOINTS
# ============================================

async def api_get_user(request):
    uid = request.query.get("uid")
    users = load_users()
    return web.json_response(users.get(uid, {}))

async def api_save_user(request):
    try:
        data = await request.json()
        users = load_users()
        uid = str(data.get("id"))
        
        users[uid] = {
            "id": data.get("id"),
            "name": data.get("name"),
            "username": data.get("username"),
            "birth_date": data.get("birth_date"),
            "birth_time": data.get("birth_time"),
            "birth_city": data.get("birth_city"),
            "premium": data.get("premium", False),
            "joined": users.get(uid, {}).get("joined", datetime.now().strftime("%d.%m.%Y")),
            "messages": users.get(uid, {}).get("messages", 0)
        }
        save_users(users)
        return web.json_response({"status": "ok", "user": users[uid]})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=400)

async def api_natal_chart(request):
    uid = request.query.get("uid")
    users = load_users()
    u = users.get(uid)
    
    if not u or not u.get("birth_date") or not u.get("birth_time"):
        return web.json_response({"error": "Заполните дату и время рождения в профиле"}, status=400)
    
    # Координаты по городу (упрощённо)
    coords = {
        "москва": (55.75, 37.62), "спб": (59.93, 30.33), "киев": (50.45, 30.52),
        "минск": (53.90, 27.56), "алматы": (43.22, 76.85), "новосибирск": (55.00, 82.93)
    }
    city = u.get("birth_city", "").lower()
    lat, lon = coords.get(city, (55.75, 37.62))  # Москва по умолчанию
    
    chart_data = get_chart_data(u["birth_date"], u["birth_time"], lat, lon)
    
    if "error" in chart_data:
        return web.json_response(chart_data, status=500)
    
    # Генерируем текст интерпретации
    interpretation = generate_natal_interpretation(chart_data)
    
    return web.json_response({
        "planets": chart_data,
        "interpretation": interpretation
    })

async def api_horoscope(request):
    sign = request.query.get("sign", "Leo")
    period = request.query.get("period", "day")
    category = request.query.get("category", "general")
    
    # Проверка Premium для месячных/годовых
    uid = request.query.get("uid")
    users = load_users()
    user = users.get(uid, {})
    
    if period in ["month", "year"] and not user.get("premium"):
        return web.json_response({
            "locked": True,
            "message": "Полный прогноз доступен в Premium. Разовый доступ: 50₽"
        })
    
    text = generate_horoscope_text(sign, period, category)
    
    return web.json_response({
        "sign": sign,
        "period": period,
        "category": category,
        "text": text,
        "premium_hint": period in ["month", "year"]
    })

async def api_compatibility(request):
    s1 = request.query.get("s1", "Leo")
    s2 = request.query.get("s2", "Libra")
    
    result = generate_compatibility_text(s1, s2)
    return web.json_response(result)

async def api_horary(request):
    try:
        data = await request.json()
        question = data.get("question", "")
        uid = data.get("uid")
        
        if not question or len(question) < 10:
            return web.json_response({"error": "Задайте вопрос подробнее (минимум 10 символов)"}, status=400)
        
        # Проверка лимитов (упрощённо)
        users = load_users()
        user = users.get(uid, {})
        if not user.get("premium"):
            # Здесь можно добавить счётчик вопросов
            pass
        
        answer = generate_horary_answer(question)
        
        return web.json_response({
            "question": question,
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def serve_webapp(request):
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return web.FileResponse(index_path)
    return web.Response(text="COSMIRA WebApp not found", status=404)

async def start_web_server():
    app = web.Application()
    
    # API routes
    app.router.add_get("/api/user", api_get_user)
    app.router.add_post("/api/user", api_save_user)
    app.router.add_get("/api/natal", api_natal_chart)
    app.router.add_get("/api/horoscope", api_horoscope)
    app.router.add_get("/api/compatibility", api_compatibility)
    app.router.add_post("/api/horary", api_horary)
    
    # WebApp
    app.router.add_get("/", serve_webapp)
    app.router.add_static('/static/', path=str(STATIC_DIR), name='static')
    
    # CORS middleware
    @web.middleware
    async def cors_middleware(request, handler):
        response = await handler(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response
    
    app.middlewares.append(cors_middleware)
    
    runner = web.AppRunner(app)
    await runner.setup()
    
    port = int(os.environ.get("PORT", 10000))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    
    logging.info(f"🌐 Web server started on port {port}")

async def main():
    bot = Bot(token=TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    
    # Запускаем веб-сервер и бота параллельно
    web_task = asyncio.create_task(start_web_server())
    polling_task = asyncio.create_task(dp.start_polling(bot))
    
    await asyncio.gather(web_task, polling_task)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logging.info("🛑 Bot stopped by user")
    except Exception as e:
        logging.error(f"❌ Fatal error: {e}")