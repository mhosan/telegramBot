require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('ERROR: Falta TELEGRAM_BOT_TOKEN en variables de entorno.');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const adminChatId = process.env.ADMIN_CHAT_ID; // Opcional: define un chat para recibir notificación de arranque

// Notificación de arranque
bot.getMe()
    .then(me => {
        const startMsg = `✅ Bot @${me.username} iniciado (${new Date().toLocaleString()}).`;
        console.log(startMsg);
        if (adminChatId) {
            bot.sendMessage(adminChatId, startMsg).catch(err => console.error('No se pudo enviar mensaje de inicio:', err.message));
        } else {
            console.log('Define ADMIN_CHAT_ID para recibir mensaje de inicio en Telegram.');
        }
    })
    .catch(err => console.error('No se pudo obtener info del bot:', err));

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, '¡Hola! Bot funcionando en AlwaysData');
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!msg.text) return; // Ignorar mensajes sin texto
    console.log('Mensaje recibido:', msg.text);
    // Evitar eco doble de comandos
    if (msg.text.startsWith('/')) return;
    bot.sendMessage(chatId, `Recibí: ${msg.text}`);
});

bot.on('polling_error', (err) => {
    console.error('Polling error:', err.message);
});

bot.on('error', (err) => {
    console.error('Bot error:', err);
});

console.log('Inicializando bot...');