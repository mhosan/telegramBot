// Webhook serverless para Telegram en Vercel
// Requisitos: TELEGRAM_BOT_TOKEN y WEBHOOK_SECRET (opcional) como variables de entorno.

export default async function handler(req, res) {
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

  const update = req.body;
  try {
    if (update.message) {
      await handleMessage(update.message, token);
    } else if (update.callback_query) {
      await answerCallback(update.callback_query, token);
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ ok: true });
  }
}

async function handleMessage(msg, token) {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  if (text.startsWith('/start')) {
    return sendMessage(token, chatId, '🤖 Bot desplegado en Vercel y listo.');
  }
  if (text.startsWith('/info')) {
    const info = `Chat ID: ${chatId}\nUser: ${msg.from.username || msg.from.first_name}`;
    return sendMessage(token, chatId, info);
  }
  if (text.startsWith('/ping')) {
    return sendMessage(token, chatId, 'pong 🟢');
  }

  if (!text.startsWith('/')) {
    return sendMessage(token, chatId, `Eco: ${text}`);
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
