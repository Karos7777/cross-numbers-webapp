from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters, CallbackContext
import json
import os
import logging

# Настройка ведения журнала
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)

TOKEN = '7211622201:AAH6uicWDk-pyBRpXdHa1oPDjX0pu6pnLaw'

user_scores = {}  # Хранение очков пользователей

def load_data():
    global user_scores
    if os.path.exists('user_scores.json'):
        with open('user_scores.json', 'r') as f:
            user_scores = json.load(f)
            logging.debug("Data loaded from user_scores.json")
    else:
        user_scores = {}
        logging.debug("No existing data found, starting fresh")



def save_data():
    with open('user_scores.json', 'w') as f:
        json.dump(user_scores, f)
        logging.debug("Data saved to user_scores.json")



def update_score(user_id, points):
    user_id = str(user_id)
    logging.debug(f"Updating score for user {user_id} by {points} points")
    load_data()
    current_score = user_scores.get(user_id, 0)
    new_score = current_score + points
    user_scores[user_id] = new_score
    save_data()
    logging.debug(f"New score for user {user_id}: {new_score}")
    return new_score


def get_user_score(user_id):
    user_id = str(user_id)
    logging.debug(f"Getting score for user {user_id}")
    load_data()
    score = user_scores.get(user_id, 0)
    logging.debug(f"Current score for user {user_id}: {score}")
    return score


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("Начать игру", web_app=WebAppInfo(url="https://karos7777.github.io/cross-numbers-webapp/"))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("Привет! Нажмите кнопку ниже, чтобы начать игру.", reply_markup=reply_markup)

async def web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logging.debug("web_app_data called")
    user_id = update.effective_user.id
    data = update.message.web_app_data.data  # Получаем данные от Web App
    logging.debug(f"Received data: {data} from user: {user_id}")

    try:
        # Парсим полученные данные
        received_data = json.loads(data)
        action = received_data.get('action')
        logging.debug(f"Action: {action}")

        if action == 'solved':
            # Начисляем очки пользователю
            new_score = update_score(user_id, 100)
            logging.debug(f"New score for user {user_id}: {new_score}")
            await update.message.reply_text(f"Отличная работа! Вы получили 100 очков. Ваш общий счет: {new_score}")
    except json.JSONDecodeError as e:
        logging.error(f"JSON Decode Error: {e}")
        await update.message.reply_text("Ошибка при обработке данных от Web App.")


async def score(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    current_score = get_user_score(user_id)
    logging.debug(f"User {user_id} requested their score: {current_score}")
    await update.message.reply_text(f"Ваш общий счет: {current_score}")

def main():
    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler('start', start))
    application.add_handler(CommandHandler('score', score))
    application.add_handler(MessageHandler(filters.WEB_APP_DATA, web_app_data))

    application.run_polling()



if __name__ == '__main__':
    main()
