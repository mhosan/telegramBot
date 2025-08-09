require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('ERROR: TELEGRAM_BOT_TOKEN no está definido en .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
console.log('🤖 Bot iniciado en modo desarrollo...');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  console.log(`📱 Comando /start de ${userName} (${chatId})`);
  bot.sendMessage(chatId, `¡Hola ${userName}! 👋\n\nSoy tu bot en desarrollo local.`);
});

bot.onText(/\/test/, (msg) => {
  const chatId = msg.chat.id;
  console.log('🧪 Comando /test recibido');
  bot.sendMessage(chatId, '✅ Test exitoso! El bot funciona correctamente.');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (text && !text.startsWith('/')) {
    console.log(`💬 Mensaje: "${text}" de ${msg.from.first_name}`);
    bot.sendMessage(chatId, `Recibí tu mensaje: "${text}"`);
  }
});

bot.on('error', (err) => console.error('❌ Error del bot:', err));
bot.on('polling_error', (err) => console.error('❌ Error de polling:', err));

process.on('SIGINT', () => {
  console.log('\n👋 Cerrando bot...');
  bot.stopPolling();
  process.exit(0);
});
