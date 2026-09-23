# Калькулятор

Калькулятор на Node.js без внешних зависимостей. Вычисление идёт через HTTP-роуты
сервера, есть веб-интерфейс и консольный режим. Запускается из **Git CMD**.

Поддерживается: `+ - * / % ^`, скобки, унарный минус, дробные числа (`1.5` или `1,5`).
Выражения разбираются собственным парсером, `eval` не используется.

## Требования

- [Git for Windows](https://git-scm.com/download/win) (в нём есть Git CMD)
- [Node.js](https://nodejs.org/) 18 или новее

## Запуск из Git CMD

```cmd
git clone https://github.com/yakov01vagner-png/calc.git
cd calc
start.cmd
```

Откройте в браузере http://localhost:3000. Остановить сервер: `Ctrl+C`.

Вместо `start.cmd` можно использовать `npm start`. Другой порт: `set PORT=8080 && start.cmd`.

### Роуты

| Метод | Роут | Описание |
|-------|------|----------|
| GET  | `/` | Страница калькулятора |
| GET  | `/calc?expr=<выражение>` | Вычислить выражение |
| POST | `/calc` с телом `{"expr": "2+2*3"}` | Вычислить выражение (JSON) |
| GET  | `/health` | Проверка работы сервера |

Прямо из Git CMD (в другом окне, пока сервер запущен):

```cmd
curl "http://localhost:3000/calc?expr=(2%2B3)*4"
curl -X POST http://localhost:3000/calc -H "Content-Type: application/json" -d "{\"expr\": \"2^10\"}"
```

Ответ: `{"expression":"(2+3)*4","result":20}`, при ошибке — код 400 и `{"error": "..."}`.
В строке запроса `+` нужно писать как `%2B`.

### Консольный режим

```cmd
calc.cmd "2+2*3"
calc.cmd
```

Без аргументов открывается интерактивный режим, выход — `exit`.

В Git Bash, Linux или macOS: `./start.sh` или `node src/cli.js "2+2*3"`.

## Тесты

```cmd
npm test
```
