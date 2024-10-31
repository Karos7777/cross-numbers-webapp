document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    const startButton = document.getElementById('startButton');
    const gameContainer = document.getElementById('game-container');
    const numberPanel = document.getElementById('number-panel');
    const checkButton = document.getElementById('checkButton');

    const puzzles = [
        {
            {
    gridSize: 7,
    clues: [
        // Горизонтальные уравнения
        { row: 0, col: 0, orientation: 'across', equation: 'A+B=8' },
        { row: 2, col: 0, orientation: 'across', equation: 'C-D=2' },
        { row: 4, col: 0, orientation: 'across', equation: 'E+F=7' },
        // Вертикальные уравнения
        { row: 0, col: 0, orientation: 'down', equation: 'A*C=12' },
        { row: 0, col: 2, orientation: 'down', equation: 'B-D=3' },
        { row: 0, col: 4, orientation: 'down', equation: 'E-F=1' },
    ],
    answers: {
        A: { value: 3, prefilled: false },
        B: { value: 5, prefilled: false },
        C: { value: 4, prefilled: false },
        D: { value: 2, prefilled: false },
        E: { value: 4, prefilled: false },
        F: { value: 3, prefilled: false },
    },
},

        // Добавьте больше пазлов по такому же шаблону
    ];

    let currentPuzzle = null; // Текущий пазл
    let numbers = [];  // Доступные цифры
    let selectedNumber = null; // Выбранная цифра

    startButton.addEventListener('click', function () {
        startGame();
    });

    function startGame() {
        // Выбираем случайный пазл
        const randomIndex = Math.floor(Math.random() * puzzles.length);
        currentPuzzle = puzzles[randomIndex];

        // Отображаем кроссворд
        renderPuzzle(currentPuzzle);

        // Отображаем доступные цифры (только для непредзаполненных переменных)
        numbers = [];
        Object.keys(currentPuzzle.answers).forEach(key => {
            const answer = currentPuzzle.answers[key];
            if (!answer.prefilled) {
                numbers.push(answer.value);
            }
        });
        renderNumbers(numbers);

        // Прячем кнопку "Начать игру"
        startButton.style.display = 'none';
        // Показываем кнопку "Проверить решение"
        checkButton.style.display = 'block';
    }

    function renderPuzzle(puzzle) {
    gameContainer.innerHTML = '';
    const gridSize = puzzle.gridSize;
    const grid = [];

    // Устанавливаем количество колонок в CSS
    gameContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    // Инициализируем пустую сетку
    for (let i = 0; i < gridSize; i++) {
        const row = new Array(gridSize).fill(null);
        grid.push(row);
    }

    // Регулярное выражение для разбора уравнений
    const tokenRegex = /([A-Z]+|\d+|[^\s])/g;

    // Располагаем уравнения на сетке
    puzzle.clues.forEach(clue => {
        const { row, col, orientation, equation } = clue;
        let i = row;
        let j = col;

        // Разбиваем уравнение на токены
        const tokens = equation.match(tokenRegex);

        tokens.forEach(token => {
            // Проверяем, что i и j находятся в пределах сетки
            if (i >= 0 && i < gridSize && j >= 0 && j < gridSize) {
                if (token.match(/^[A-Z]+$/)) {
                    // Это переменная (клетка с буквой)
                    const answer = puzzle.answers[token];
                    if (answer.prefilled) {
                        // Предзаполненная клетка
                        grid[i][j] = { type: 'prefilled', value: answer.value };
                    } else {
                        // Пустая клетка для ввода
                        grid[i][j] = { type: 'input', variable: token };
                    }
                } else if (token.trim() !== '') {
                    // Это оператор или число
                    grid[i][j] = { type: 'text', value: token };
                }
            } else {
                console.error(`Выход за пределы сетки при размещении уравнения "${equation}" в позиции i=${i}, j=${j}`);
                return; // Прерываем обработку этого уравнения
            }

            if (orientation === 'across') {
                j++;
            } else {
                i++;
            }
        });
    });

    // Отображаем сетку
    grid.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';

            if (cell) {
                if (cell.type === 'input') {
                    cellElement.classList.add('input-cell');
                    cellElement.dataset.variable = cell.variable;
                    cellElement.addEventListener('click', selectCell);
                } else if (cell.type === 'prefilled') {
                    cellElement.textContent = cell.value;
                    cellElement.classList.add('prefilled-cell');
                } else if (cell.type === 'text') {
                    cellElement.textContent = cell.value;
                    cellElement.classList.add('operator');
                }
            } else {
                cellElement.classList.add('empty-cell');
            }

            gameContainer.appendChild(cellElement);
        });
    });
}


    function renderNumbers(numbers) {
        numberPanel.innerHTML = '';
        numbers.forEach((number, index) => {
            const numberElement = document.createElement('div');
            numberElement.className = 'number';
            numberElement.textContent = number;
            numberElement.dataset.number = number;
            numberElement.dataset.index = index;
            numberElement.addEventListener('click', selectNumber);
            numberPanel.appendChild(numberElement);
        });
    }

    function selectNumber(event) {
        // Убираем выделение с других цифр
        document.querySelectorAll('.number').forEach(elem => {
            elem.classList.remove('selected');
        });
        // Сохраняем выбранную цифру
        selectedNumber = event.target;
        // Выделяем выбранную цифру
        selectedNumber.classList.add('selected');
    }

    function selectCell(event) {
        if (selectedNumber) {
            const variable = event.target.dataset.variable;
            const numberValue = parseInt(selectedNumber.textContent);

            // Устанавливаем значение в клетку
            event.target.textContent = numberValue;
            event.target.dataset.value = numberValue;

            // Убираем цифру из панели
            const index = numbers.indexOf(numberValue);
            numbers.splice(index, 1);
            renderNumbers(numbers);

            // Снимаем выделение
            selectedNumber.classList.remove('selected');
            selectedNumber = null;
        }
    }

    checkButton.addEventListener('click', function () {
        if (checkSolution()) {
            // Отправляем данные боту
            tg.sendData(JSON.stringify({ action: 'solved' }));
            alert('Поздравляем! Вы решили кроссворд и получили 100 очков.');
            // Сброс игры для возможности сыграть снова
            resetGame();
        } else {
            alert('Есть ошибки в вашем решении. Попробуйте еще раз.');
        }
    });

    function checkSolution() {
        const userAnswers = {};
        const inputCells = document.querySelectorAll('.input-cell');

        // Получаем ответы пользователя
        inputCells.forEach(cell => {
            const variable = cell.dataset.variable;
            const value = cell.dataset.value;
            if (value) {
                userAnswers[variable] = parseInt(value);
            }
        });

        // Добавляем предзаполненные ответы
        Object.keys(currentPuzzle.answers).forEach(variable => {
            const answer = currentPuzzle.answers[variable];
            if (answer.prefilled) {
                userAnswers[variable] = answer.value;
            }
        });

        // Проверяем, все ли переменные заполнены
        if (Object.keys(userAnswers).length !== Object.keys(currentPuzzle.answers).length) {
            return false;
        }

        // Проверяем уравнения
        let isCorrect = true;
        currentPuzzle.clues.forEach(clue => {
            const { equation } = clue;
            let userEquation = equation;
            Object.keys(userAnswers).forEach(variable => {
                userEquation = userEquation.replace(new RegExp(variable, 'g'), userAnswers[variable]);
            });

            try {
                const [left, right] = userEquation.split('=');
                if (eval(left) !== eval(right)) {
                    isCorrect = false;
                }
            } catch (e) {
                isCorrect = false;
            }
        });

        return isCorrect;
    }

    function resetGame() {
        gameContainer.innerHTML = '';
        numberPanel.innerHTML = '';
        checkButton.style.display = 'none';
        startButton.style.display = 'block';
    }
});

