// Webhook serverless para Telegram en Vercel (CommonJS)
// Requisitos: TELEGRAM_BOT_TOKEN y WEBHOOK_SECRET (opcional) como variables de entorno.

// (Eliminado estado de solicitud de ubicación automática)

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.WEBHOOK_SECRET; // protección opcional
  if (!token) {
    return res.status(500).json({ ok: false, error: 'Missing TELEGRAM_BOT_TOKEN' });
  }

  if (secret && req.query.secret !== secret) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  const update = req.body || {};
  try {
    if (update.message) {
      await handleMessage(update.message, token);
    } else if (update.callback_query) {
      await answerCallback(update.callback_query, token);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    // Siempre responder 200 para evitar reintentos masivos
    return res.status(200).json({ ok: true });
  }
};

async function handleMessage(msg, token) {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // NUEVO: Si el mensaje contiene ubicación, generar respuesta IA contextual
  if (msg.location) {
    const { latitude, longitude } = msg.location;
  return sendMessage(token, chatId, `Lat: ${latitude}, Lon: ${longitude}`);
  }

  if (text.startsWith('/start')) {
    await callTelegram(token, 'sendMessage', {
      chat_id: chatId,
      text: '🤖 Bot desplegado en Vercel y reontraSuperListo.',
      reply_markup: {
        keyboard: [[ { text: 'Compartir ubicación', request_location: true } ]],
        resize_keyboard: true
      }
    });
    return sendMessage(token, chatId, 'Hola, soy un botito que responde tus preguntas');
  }
  if (text.startsWith('/info')) {
    const info = `Chat ID: ${chatId}\nUser: ${msg.from.username || msg.from.first_name}`;
    return sendMessage(token, chatId, info);
  }
  if (text.startsWith('/ping')) {
    return sendMessage(token, chatId, 'pong 🟢');
  }

  // --- Nuevo comando IA mínimo ---
  if (text.startsWith('/ai') || text.startsWith('/ia')) {
    const prompt = text.replace(/^\/(ai|ia)\s?/, '').trim();
    if (!prompt) {
      return sendMessage(token, chatId, 'Uso: /ai <pregunta>');
    }
    const { askAI } = require('../utils/aiClient');
    const reply = await askAI(prompt);
    return sendMessage(token, chatId, reply);
  }
  // --- Fin nuevo comando IA ---

  if (!text.startsWith('/')) {
    const { askAI } = require('../utils/aiClient');
    const reply = await askAI(text);
    return sendMessage(token, chatId, reply);
  }
}

async function answerCallback(cq, token) {
  const data = cq.data;
  const chatId = cq.message.chat.id;
  if (data === 'like') {
    await sendMessage(token, chatId, '👍 Gracias!');
  } else if (data === 'dislike') {
    await sendMessage(token, chatId, '👎 Entendido');
  }
  await callTelegram(token, 'answerCallbackQuery', { callback_query_id: cq.id });
}

async function sendMessage(token, chatId, text) {
  return callTelegram(token, 'sendMessage', { chat_id: chatId, text });
}

async function callTelegram(token, method, payload) {
  const url = `https://api.telegram.org/bot${token}/${method}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Telegram API error: ${resp.status} ${body}`);
  }
  return resp.json();
}
