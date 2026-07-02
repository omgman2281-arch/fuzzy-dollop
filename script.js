const expressionElement = document.querySelector('#expression');
const resultElement = document.querySelector('#result');
const keys = document.querySelector('.keys');

let expression = '';
let shouldReset = false;

const operators = ['+', '-', '*', '/', '%'];

function formatExpression(value) {
  return value
    .replaceAll('*', '×')
    .replaceAll('/', '÷')
    .replaceAll('-', '−');
}

function updateDisplay(result = null) {
  expressionElement.textContent = expression ? formatExpression(expression) : '0';
  resultElement.textContent = result ?? (expression ? formatExpression(expression) : '0');
}

function appendValue(value) {
  if (shouldReset && !operators.includes(value)) {
    expression = '';
    shouldReset = false;
  }

  const lastCharacter = expression.at(-1);

  if (value === '.' && /(^|[+\-*/%])\d*\.$/.test(expression)) {
    return;
  }

  if (operators.includes(value) && operators.includes(lastCharacter)) {
    expression = expression.slice(0, -1) + value;
  } else {
    expression += value;
  }

  shouldReset = false;
  updateDisplay();
}

function calculate() {
  if (!expression || operators.includes(expression.at(-1))) {
    return;
  }

  try {
    const calculatedValue = Function(`"use strict"; return (${expression})`)();

    if (!Number.isFinite(calculatedValue)) {
      throw new Error('Invalid result');
    }

    const roundedValue = Number.parseFloat(calculatedValue.toFixed(10)).toString();
    updateDisplay(roundedValue);
    expression = roundedValue;
    shouldReset = true;
  } catch {
    updateDisplay('Ошибка');
    expression = '';
    shouldReset = true;
  }
}

function clearCalculator() {
  expression = '';
  shouldReset = false;
  updateDisplay();
}

function deleteLastCharacter() {
  expression = expression.slice(0, -1);
  updateDisplay();
}

keys.addEventListener('click', (event) => {
  const button = event.target.closest('button');

  if (!button) {
    return;
  }

  if (button.dataset.value) {
    appendValue(button.dataset.value);
    return;
  }

  if (button.dataset.action === 'calculate') {
    calculate();
  }

  if (button.dataset.action === 'clear') {
    clearCalculator();
  }

  if (button.dataset.action === 'delete') {
    deleteLastCharacter();
  }
});

window.addEventListener('keydown', (event) => {
  if (/^[0-9.]$/.test(event.key) || operators.includes(event.key)) {
    appendValue(event.key);
  }

  if (event.key === 'Enter' || event.key === '=') {
    calculate();
  }

  if (event.key === 'Backspace') {
    deleteLastCharacter();
  }

  if (event.key === 'Escape') {
    clearCalculator();
  }
});

updateDisplay();
