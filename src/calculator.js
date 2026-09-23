'use strict';

// Безопасный разбор арифметических выражений (без eval).
// Поддерживается: + - * / % ^, скобки, унарный минус, дробные числа.

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      i++;
    } else if (/[0-9.]/.test(ch)) {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i])) num += input[i++];
      if (!/^(\d+\.?\d*|\.\d+)$/.test(num)) throw new Error(`Некорректное число: ${num}`);
      tokens.push({ type: 'num', value: parseFloat(num) });
    } else if ('+-*/%^()'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
    } else {
      throw new Error(`Недопустимый символ: ${ch}`);
    }
  }
  return tokens;
}

function evaluate(expression) {
  if (typeof expression !== 'string' || expression.trim() === '') {
    throw new Error('Пустое выражение');
  }
  const tokens = tokenize(expression.replace(/,/g, '.').replace(/×/g, '*').replace(/÷/g, '/'));
  let pos = 0;

  const peek = () => tokens[pos];
  const isOp = (v) => peek() && peek().type === 'op' && peek().value === v;

  // expr := term (('+' | '-') term)*
  function parseExpr() {
    let left = parseTerm();
    while (isOp('+') || isOp('-')) {
      const op = tokens[pos++].value;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  // term := unary (('*' | '/' | '%') unary)*
  function parseTerm() {
    let left = parseUnary();
    while (isOp('*') || isOp('/') || isOp('%')) {
      const op = tokens[pos++].value;
      const right = parseUnary();
      if ((op === '/' || op === '%') && right === 0) throw new Error('Деление на ноль');
      if (op === '*') left *= right;
      else if (op === '/') left /= right;
      else left %= right;
    }
    return left;
  }

  // unary := ('-' | '+') unary | power
  function parseUnary() {
    if (isOp('-')) { pos++; return -parseUnary(); }
    if (isOp('+')) { pos++; return parseUnary(); }
    return parsePower();
  }

  // power := primary ('^' unary)?   (правоассоциативно)
  function parsePower() {
    const base = parsePrimary();
    if (isOp('^')) { pos++; return Math.pow(base, parseUnary()); }
    return base;
  }

  // primary := number | '(' expr ')'
  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error('Неожиданный конец выражения');
    if (tok.type === 'num') { pos++; return tok.value; }
    if (isOp('(')) {
      pos++;
      const value = parseExpr();
      if (!isOp(')')) throw new Error('Не хватает закрывающей скобки');
      pos++;
      return value;
    }
    throw new Error(`Неожиданный символ: ${tok.value}`);
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error(`Неожиданный символ: ${tokens[pos].value}`);
  if (!Number.isFinite(result)) throw new Error('Результат не является конечным числом');
  // Убираем артефакты плавающей точки: 0.1 + 0.2 -> 0.3
  return Number(result.toPrecision(12));
}

module.exports = { evaluate };
