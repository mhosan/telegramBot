require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '¡Hola! Bot funcionando en AlwaysData');
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    console.log('Mensaje recibido:', msg.text);
    bot.sendMessage(chatId, `Recibí: ${msg.text}`);
});

console.log('Bot iniciado...');