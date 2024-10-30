document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    const startButton = document.getElementById('startButton');
    const gameContainer = document.getElementById('game-container');

    let puzzle = null; // Кроссворд
    let answers = {};  // Ответы пользователя

    startButton.addEventListener('click', function () {
        startGame();
    });

    function startGame() {
        // Генерируем кроссворд
        puzzle = generatePuzzle();
        // Отображаем кроссворд
        renderPuzzle(puzzle);
        // Прячем кнопку "Начать игру"
        startButton.style.display = 'none';
    }

  function generatePuzzle() {
    const operators = ['+', '-', '*', '/'];
    const gridSize = 5;
    const grid = [];

    for (let i = 0; i < gridSize; i++) {
        const row = [];
        for (let j = 0; j < gridSize; j++) {
            if (Math.random() < 0.2) { // 20% вероятность, что в клетке будет уравнение
                const operator = operators[Math.floor(Math.random() * operators.length)];
                let a, b, result;

                if (operator === '+') {
                    a = getRandomInt(1, 50);
                    b = getRandomInt(1, 50);
                    result = a + b;
                } else if (operator === '-') {
                    a = getRandomInt(1, 50);
                    b = getRandomInt(1, a); // чтобы результат был неотрицательным
                    result = a - b;
                } else if (operator === '*') {
                    a = getRandomInt(1, 10);
                    b = getRandomInt(1, 10);
                    result = a * b;
                } else if (operator === '/') {
                    b = getRandomInt(1, 10);
                    result = getRandomInt(1, 10);
                    a = b * result;
                }

                row.push({ clue: `${a} ${operator} ${b}`, answer: result.toString() });
            } else {
                row.push({});
            }
        }
        grid.push(row);
    }
    return grid;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

        // Пример простого кроссворда 5x5
        const grid = [
            [{ clue: '2 + 3', answer: '5' }, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}],
            [{}, {}, { clue: '4 * 2', answer: '8' }, {}, {}],
            [{}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}],
        ];
        return grid;
    }

    function renderPuzzle(puzzle) {
        gameContainer.innerHTML = '';
        const gridElement = document.createElement('div');
        gridElement.className = 'grid';

        for (let row of puzzle) {
            for (let cell of row) {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                if (cell.clue) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.dataset.answer = cell.answer;
                    cellElement.appendChild(input);
                }
                gridElement.appendChild(cellElement);
            }
        }

        // Добавляем кнопку для проверки ответов
        const checkButton = document.createElement('button');
        checkButton.textContent = 'Проверить ответы';
        checkButton.addEventListener('click', checkAnswers);

        gameContainer.appendChild(gridElement);
        gameContainer.appendChild(checkButton);
    }

    function checkAnswers() {
        const inputs = document.querySelectorAll('input[data-answer]');
        let allCorrect = true;
        for (let input of inputs) {
            if (input.value !== input.dataset.answer) {
                input.style.backgroundColor = '#fbb';
                allCorrect = false;
            } else {
                input.style.backgroundColor = '#bfb';
            }
        }

        if (allCorrect) {
            // Отправляем данные боту
            tg.sendData(JSON.stringify({ action: 'solved' }));
            alert('Поздравляем! Вы решили кроссворд.');
        } else {
            alert('Некоторые ответы неверны. Проверьте выделенные поля.');
        }
    }
});
