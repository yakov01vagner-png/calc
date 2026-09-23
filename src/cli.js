#!/usr/bin/env node
'use strict';

const readline = require('readline');
const { evaluate } = require('./calculator');

// Разовое вычисление: node src/cli.js "2+2*3"
const expr = process.argv.slice(2).join(' ');
if (expr) {
  try {
    console.log(evaluate(expr));
  } catch (err) {
    console.error(`Ошибка: ${err.message}`);
    process.exitCode = 1;
  }
} else {
  // Интерактивный режим
  console.log('Калькулятор. Введите выражение (например 2+2*3) или "exit" для выхода.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '> ' });
  rl.prompt();
  rl.on('line', (line) => {
    const input = line.trim();
    if (input === 'exit' || input === 'quit') return rl.close();
    if (input) {
      try {
        console.log(`= ${evaluate(input)}`);
      } catch (err) {
        console.log(`Ошибка: ${err.message}`);
      }
    }
    rl.prompt();
  });
}
