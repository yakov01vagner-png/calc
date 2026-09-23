'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { URL } = require('url');
const { evaluate } = require('./calculator');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Файлы, которые отдаются телефону: страница, манифест приложения,
// service worker, иконки и сам калькулятор для работы без сети.
const STATIC_FILES = {
  '/': path.join(PUBLIC_DIR, 'index.html'),
  '/index.html': path.join(PUBLIC_DIR, 'index.html'),
  '/manifest.webmanifest': path.join(PUBLIC_DIR, 'manifest.webmanifest'),
  '/sw.js': path.join(PUBLIC_DIR, 'sw.js'),
  '/icon.svg': path.join(PUBLIC_DIR, 'icon.svg'),
  '/icon-192.png': path.join(PUBLIC_DIR, 'icon-192.png'),
  '/icon-512.png': path.join(PUBLIC_DIR, 'icon-512.png'),
  '/calculator.js': path.join(__dirname, 'calculator.js'),
};

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function sendFile(res, file) {
  res.writeHead(200, {
    'Content-Type': CONTENT_TYPES[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
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

// Адреса компьютера в локальной сети — их нужно открыть на телефоне.
function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);
}

// Роуты:
//   GET  /                         — приложение-калькулятор
//   GET  /calc?expr=2%2B2*3        — вычисление через строку запроса
//   POST /calc  {"expr": "2+2*3"}  — вычисление через JSON
//   GET  /health                   — проверка, что сервер жив
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/calc') {
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
  } else if (req.method === 'GET' && STATIC_FILES[url.pathname]) {
    sendFile(res, STATIC_FILES[url.pathname]);
  } else {
    sendJson(res, 404, { error: 'Маршрут не найден' });
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Калькулятор запущен: http://localhost:${PORT}`);
    const lan = lanAddresses();
    if (lan.length) {
      console.log('Откройте на телефоне (он должен быть в той же Wi-Fi сети):');
      lan.forEach((ip) => console.log(`  http://${ip}:${PORT}`));
    }
    console.log(`Пример роута: http://localhost:${PORT}/calc?expr=2%2B2*3`);
    console.log('Остановить: Ctrl+C');
  });
}

module.exports = { server };
