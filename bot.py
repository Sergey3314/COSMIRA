import os
import asyncio
import logging

from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

from aiogram.types import (
    Message,
    ReplyKeyboardMarkup,
    KeyboardButton,
    WebAppInfo
)

# ============================================
# ЗАГРУЗКА TOKEN ИЗ RENDER
# ============================================

load_dotenv()

TOKEN = os.getenv("TOKEN")

# ============================================
# ЛОГИ
# ============================================

logging.basicConfig(level=logging.INFO)

# ============================================
# BOT
# ============================================

bot = Bot(
    token=TOKEN,
    default=DefaultBotProperties(
        parse_mode=ParseMode.HTML
    )
)

dp = Dispatcher()

print("COSMIRA STARTED")

# ============================================
# КНОПКИ
# ============================================

main_keyboard = ReplyKeyboardMarkup(
    keyboard=[
        [
            KeyboardButton(
                text="🚀 Открыть COSMIRA",
                web_app=WebAppInfo(
                    url="https://cosmira.netlify.app/"
                )
            )
        ],
        [
            KeyboardButton(text="👤 Профиль"),
            KeyboardButton(text="💎 Premium")
        ],
        [
            KeyboardButton(text="⚙️ Настройки")
        ]
    ],
    resize_keyboard=True
)

# ============================================
# START
# ============================================

@dp.message(F.text == "/start")
async def start_handler(message: Message):

    text = """
<b>🌌 COSMIRA AI</b>

Добро пожаловать в будущее.

✨ AI Платформа нового поколения
🚀 WebApp интерфейс
🧠 Умный AI помощник
💎 Premium система скоро появится
"""

    await message.answer(
        text,
        reply_markup=main_keyboard
    )

# ============================================
# ПРОФИЛЬ
# ============================================

@dp.message(F.text == "👤 Профиль")
async def profile_handler(message: Message):

    text = f"""
<b>👤 Ваш профиль</b>

🆔 ID: <code>{message.from_user.id}</code>

👑 Premium: Нет

🚀 Статус:
Пользователь COSMIRA
"""

    await message.answer(text)

# ============================================
# PREMIUM
# ============================================

@dp.message(F.text == "💎 Premium")
async def premium_handler(message: Message):

    text = """
<b>💎 COSMIRA PREMIUM</b>

Скоро здесь появится:

✨ AI без ограничений
⚡ Быстрые ответы
🧠 Мощные модели
🎨 Генерация изображений
🚀 Эксклюзивные функции

Система оплаты появится позже.
"""

    await message.answer(text)

# ============================================
# НАСТРОЙКИ
# ============================================

@dp.message(F.text == "⚙️ Настройки")
async def settings_handler(message: Message):

    text = """
<b>⚙️ Настройки</b>

🌙 Темная тема
🔔 Уведомления
🌍 Язык
🎨 Дизайн

Скоро здесь будет полноценная панель.
"""

    await message.answer(text)

# ============================================
# MAIN
# ============================================

async def main():

    await dp.start_polling(bot)

# ============================================
# START APP
# ============================================

if __name__ == "__main__":

    asyncio.run(main())