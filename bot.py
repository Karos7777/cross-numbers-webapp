from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
import json
import os

TOKEN = '7211622201:AAFXjJYCoFbiDMTaOX5BZ_haXziiHxjOi7Y'

user_scores = {}  # Хранение очков пользователей

def load_data():
    global user_scores
    if os.path.exists('user_scores.json'):
        with open('user_scores.json', 'r') as f:
            user_scores = json.load(f)
    else:
        user_scores = {}

def save_data():
    with open('user_scores.json', 'w') as f:
        json.dump(user_scores, f)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("Начать игру", web_app=WebAppInfo(url="https://karos7777.github.io/cross-numbers-webapp/"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Привет! Нажмите кнопку ниже, чтобы начать игру.", reply_markup=reply_markup)

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    data = update.message.web_app_data.data  # Получаем данные от Web App
    load_data()

    try:
        # Парсим полученные данные
        received_data = json.loads(data)
        action = received_data.get('action')

        if action == 'solved':
            # Начисляем очки пользователю
            user_scores[user_id] = user_scores.get(user_id, 0) + 100
            save_data()
            await update.message.reply_text(f"Отличная работа! Вы получили 100 очков. Ваш общий счет: {user_scores[user_id]}")
    except json.JSONDecodeError:
        await update.message.reply_text("Ошибка при обработке данных от Web App.")

async def score(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    load_data()
    score = user_scores.get(user_id, 0)
    await update.message.reply_text(f"Ваш общий счет: {score}")

def main():
    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('score', score))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))

    application.run_polling()

if __name__ == '__main__':
    main()
