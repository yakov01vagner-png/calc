'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { evaluate } = require('./calculator');

const PORT = Number(process.env.PORT) || 3000;
const INDEX_HTML = path.join(__dirname, '..', 'public', 'index.html');

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e4) reject(new Error('Слишком большой запрос'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function calculate(res, expression) {
  try {
    sendJson(res, 200, { expression, result: evaluate(expression) });
  } catch (err) {
    sendJson(res, 400, { expression, error: err.message });
  }
}

// Роуты:
//   GET  /                         — страница калькулятора
//   GET  /calc?expr=2%2B2*3        — вычисление через строку запроса
//   POST /calc  {"expr": "2+2*3"}  — вычисление через JSON
//   GET  /health                   — проверка, что сервер жив
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(INDEX_HTML).pipe(res);
  } else if (req.method === 'GET' && url.pathname === '/calc') {
    calculate(res, url.searchParams.get('expr') || '');
  } else if (req.method === 'POST' && url.pathname === '/calc') {
    try {
      const { expr } = JSON.parse((await readBody(req)) || '{}');
      calculate(res, expr || '');
    } catch {
      sendJson(res, 400, { error: 'Ожидается JSON вида {"expr": "2+2"}' });
    }
  } else if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' });
  } else {
    sendJson(res, 404, { error: 'Маршрут не найден' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Калькулятор запущен: http://localhost:${PORT}`);
    console.log(`Пример роута:       http://localhost:${PORT}/calc?expr=2%2B2*3`);
    console.log('Остановить: Ctrl+C');
  });
}

module.exports = { server };
