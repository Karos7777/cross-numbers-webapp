import logging
import json
import aiosqlite
import nest_asyncio
import logging
import sqlite3
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
from fastapi import FastAPI, Request
from aiogram import Bot, Dispatcher, types
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application
import asyncio

# Применение nest_asyncio для предотвращения ошибок с циклом событий
nest_asyncio.apply()

# Замените на ваш токен
BOT_TOKEN = '7211622201:AAH6uicWDk-pyBRpXdHa1oPDjX0pu6pnLaw'
WEBHOOK_PATH = '/webhook'
WEBHOOK_URL = 'https://karos7777.github.io/cross-numbers-webapp/' + WEBHOOK_PATH

app = FastAPI()
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@app.on_event("startup")
async def on_startup():
    await bot.set_webhook(WEBHOOK_URL)

@app.on_event("shutdown")
async def on_shutdown():
    await bot.delete_webhook()

@app.post(WEBHOOK_PATH)
async def webhook_handler(request: Request):
    update = types.Update(**await request.json())
    await dp.process_update(update)
    return {"ok": True}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)


# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

logging.basicConfig(level=logging.INFO)

def add_points(user_id, points):
    logging.info(f"Начисление {points} баллов пользователю с ID {user_id}")
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    cursor.execute('SELECT points FROM users WHERE id = ?', (user_id,))
    result = cursor.fetchone()
    if result:
        new_points = result[0] + points
        cursor.execute('UPDATE users SET points = ? WHERE id = ?', (new_points, user_id))
    else:
        cursor.execute('INSERT INTO users (id, points) VALUES (?, ?)', (user_id, points))
    conn.commit()
    conn.close()

# Инициализация базы данных
async def init_db():
    async with aiosqlite.connect('database.db') as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                username TEXT,
                points INTEGER DEFAULT 0
            )
        ''')
        await db.commit()

# Функция для добавления очков пользователю
async def add_points(user_id, points):
    async with aiosqlite.connect('database.db') as db:
        async with db.execute('SELECT points FROM users WHERE id = ?', (user_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                new_points = row[0] + points
                await db.execute('UPDATE users SET points = ? WHERE id = ?', (new_points, user_id))
            else:
                new_points = points
                await db.execute('INSERT INTO users (id, points) VALUES (?, ?)', (user_id, new_points))
        await db.commit()
    return new_points

# Обработчик команды /start
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("Начать игру", web_app=WebAppInfo(url="https://karos7777.github.io/cross-numbers-webapp/"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Привет! Нажмите кнопку ниже, чтобы начать игру.", reply_markup=reply_markup)

# Обработчик данных из Web App
async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data = update.message.web_app_data.data
    user_id = update.effective_user.id
    try:
        received_data = json.loads(data)
        action = received_data.get('action')
        if action == 'solved':
            new_score = await add_points(user_id, 100)
            await update.message.reply_text(f"Поздравляем! Вам начислено 100 очков. Ваш общий счёт: {new_score}")
    except json.JSONDecodeError as e:
        logging.error(f"JSON Decode Error: {e}")
        await update.message.reply_text("Ошибка при обработке данных от Web App.")

# Обработчик команды /score
async def score(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    async with aiosqlite.connect('database.db') as db:
        async with db.execute('SELECT points FROM users WHERE id = ?', (user_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                current_score = row[0]
            else:
                current_score = 0
    await update.message.reply_text(f"Ваш общий счёт: {current_score}")

# Основная функция
async def main():
    await init_db()

    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('score', score))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))

    # Запуск бота
    await application.run_polling()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
