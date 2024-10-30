document.addEventListener('DOMContentLoaded', function () {
    // Инициализация WebApp
    const tg = window.Telegram.WebApp;

    // Обработка кнопки фарма
    const farmButton = document.getElementById('farmButton');
    const tokenCount = document.getElementById('tokenCount');

    farmButton.addEventListener('click', function () {
        // Отправка данных боту
        tg.sendData('farm');
    });

    // Получение данных от бота
    tg.onEvent('mainButtonClicked', function () {
        // Обработка события (если нужно)
    });

    // Функция для обновления количества токенов
    function updateTokens(count) {
        tokenCount.textContent = count;
    }

    // Получение начального количества токенов (опционально)
    // Это можно реализовать через отправку запроса к вашему серверу
});
