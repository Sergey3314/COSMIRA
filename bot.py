import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

from aiogram.filters import CommandStart

from aiogram.types import (
    Message,
    CallbackQuery,
    InlineKeyboardMarkup,
    InlineKeyboardButton
)

# =========================================
# TOKEN
# =========================================

TOKEN = "8700927104:AAHQ32n-TtV1UmyMVlQqk0vdqjd-luOn1MQ"

# =========================================
# LOGGING
# =========================================

logging.basicConfig(level=logging.INFO)

# =========================================
# BOT
# =========================================

bot = Bot(
    token=TOKEN,
    default=DefaultBotProperties(
        parse_mode=ParseMode.HTML
    )
)

dp = Dispatcher()

print("COSMIRA STARTED")

# =========================================
# MAIN MENU
# =========================================

def main_menu():

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[

            [
                InlineKeyboardButton(
                    text="👤 Профиль",
                    callback_data="profile"
                ),

                InlineKeyboardButton(
                    text="💎 Premium",
                    callback_data="premium"
                )
            ],

            [
                InlineKeyboardButton(
                    text="🤖 AI Chat",
                    callback_data="ai"
                )
            ],

            [
                InlineKeyboardButton(
                    text="⚙️ Настройки",
                    callback_data="settings"
                )
            ]

        ]
    )

    return keyboard

# =========================================
# START
# =========================================

@dp.message(CommandStart())
async def start(message: Message):

    text = f"""
☁️ <b>COSMIRA AI</b>

Добро пожаловать,
<b>{message.from_user.first_name}</b>

━━━━━━━━━━━━━━━

🚀 AI платформа нового поколения

✨ Возможности:
• AI Chat
• Premium функции
• Умные инструменты
• Персональный AI

━━━━━━━━━━━━━━━

🔥 Статус:
ONLINE
"""

    await message.answer(
        text,
        reply_markup=main_menu()
    )

# =========================================
# PROFILE
# =========================================

@dp.callback_query(F.data == "profile")
async def profile(callback: CallbackQuery):

    text = f"""
👤 <b>ПРОФИЛЬ</b>

━━━━━━━━━━━━━━━

🆔 ID:
<code>{callback.from_user.id}</code>

👤 Имя:
<b>{callback.from_user.first_name}</b>

💎 Premium:
❌ Нет

💰 Баланс:
0$

━━━━━━━━━━━━━━━

📈 Уровень:
Новичок
"""

    await callback.message.edit_text(
        text,
        reply_markup=main_menu()
    )

# =========================================
# PREMIUM
# =========================================

@dp.callback_query(F.data == "premium")
async def premium(callback: CallbackQuery):

    text = """
💎 <b>COSMIRA PREMIUM</b>

━━━━━━━━━━━━━━━

🔥 Скоро здесь будет:

• GPT Premium
• AI генерация
• Быстрые ответы
• VIP возможности
• Безлимитный доступ

━━━━━━━━━━━━━━━

⚡ В разработке
"""

    await callback.message.edit_text(
        text,
        reply_markup=main_menu()
    )

# =========================================
# AI CHAT
# =========================================

@dp.callback_query(F.data == "ai")
async def ai_chat(callback: CallbackQuery):

    text = """
🤖 <b>COSMIRA AI CHAT</b>

━━━━━━━━━━━━━━━

✨ Скоро здесь появится:

• Умный AI чат
• Ответы как ChatGPT
• Генерация текста
• Помощник

━━━━━━━━━━━━━━━

🚀 AI CORE ACTIVE
"""

    await callback.message.edit_text(
        text,
        reply_markup=main_menu()
    )

# =========================================
# SETTINGS
# =========================================

@dp.callback_query(F.data == "settings")
async def settings(callback: CallbackQuery):

    text = """
⚙️ <b>НАСТРОЙКИ</b>

━━━━━━━━━━━━━━━

🌙 Тема:
Dark

🔔 Уведомления:
ON

🌐 Язык:
Русский

━━━━━━━━━━━━━━━
"""

    await callback.message.edit_text(
        text,
        reply_markup=main_menu()
    )

# =========================================
# MAIN
# =========================================

async def main():

    await dp.start_polling(bot)

# =========================================
# START
# =========================================

if __name__ == "__main__":
    asyncio.run(main())