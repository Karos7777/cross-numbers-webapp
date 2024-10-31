document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    const startButton = document.getElementById('startButton');
    const gameContainer = document.getElementById('game-container');
    const numberPanel = document.getElementById('number-panel');
    const checkButton = document.getElementById('checkButton');

    const puzzles = [
        {
            gridSize: 5,
            clues: [
                // Горизонтальные уравнения
                { row: 0, col: 0, orientation: 'across', equation: 'A+B=9' },
                { row: 2, col: 0, orientation: 'across', equation: 'C-D=3' },
                // Вертикальные уравнения
                { row: 0, col: 0, orientation: 'down', equation: 'A*C=12' },
                { row: 0, col: 2, orientation: 'down', equation: 'B/D=2' },
            ],
            answers: {
                A: 3,
                B: 6,
                C: 4,
                D: 2,
            },
        },
        // Вы можете добавить больше пазлов по такому же шаблону
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

        // Отображаем доступные цифры
        numbers = Object.values(currentPuzzle.answers);
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

        // Инициализируем пустую сетку
        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                row.push(null);
            }
            grid.push(row);
        }

        // Располагаем уравнения на сетке
        puzzle.clues.forEach(clue => {
            const { row, col, orientation, equation } = clue;
            let i = row;
            let j = col;

            for (let k = 0; k < equation.length; k++) {
                const char = equation[k];
                if (char.match(/[A-Z]/)) {
                    // Это переменная (пустая клетка)
                    grid[i][j] = { type: 'input', variable: char };
                } else if (char.trim() !== '') {
                    // Это оператор или число
                    grid[i][j] = { type: 'text', value: char };
                }

                if (orientation === 'across') {
                    j++;
                } else {
                    i++;
                }
            }
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
        } else {
            alert('Есть ошибки в вашем решении. Попробуйте еще раз.');
        }
    });

    function checkSolution() {
        const userAnswers = {};
        const inputCells = document.querySelectorAll('.input-cell');

        inputCells.forEach(cell => {
            const variable = cell.dataset.variable;
            const value = cell.dataset.value;
            if (value) {
                userAnswers[variable] = parseInt(value);
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
});
