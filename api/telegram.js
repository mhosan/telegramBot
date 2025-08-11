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
    let address = '';
    try {
      // Primero intentar con Mapbox (por defecto); si falla o no hay token, fallback a Nominatim
      address = await reverseGeocodeMapbox(latitude, longitude);
      if (!address) {
        address = await reverseGeocode(latitude, longitude);
      }
    } catch (_) {}
    let pois = '';
    try {
      pois = await fetchNearbyPOI(latitude, longitude);
    } catch (_) {}
    const base = `Lat: ${latitude}, Lon: ${longitude}`;
    let textOut = address ? `${base}\nDirección: ${address}` : base;
    if (pois) textOut += `\n${pois}`;
    // Persistir geolocalización (silencioso si falta config)
    try {
      const origin = (msg.from && (msg.from.username || (msg.from.first_name || '') + '_' + msg.from.id)) || 'desconocido';
      const { saveGeolocation } = require('../utils/geoStore');
      await saveGeolocation(latitude, longitude, address || '', origin);
    } catch (_) {}
    return sendMessage(token, chatId, textOut);
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

// Geocodificación inversa mínima usando Nominatim (OpenStreetMap)
// Nota: Uso ligero recomendado; para producción intensiva emplear proveedor con clave (OpenCage, Google, etc.)
async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=0`;
  const resp = await fetch(url, {
    headers: {
      // Incluir User-Agent descriptivo según política de Nominatim
      'User-Agent': 'telegram-bot-vercel/1.0 (contact: example@example.com)'
    }
  });
  if (!resp.ok) return '';
  const data = await resp.json();
  return (data && data.display_name) ? data.display_name : '';
}

// Geocodificación inversa con Mapbox (por defecto si hay token)
// Requiere variable de entorno MAPBOX_TOKEN o MAPBOX_API_KEY
async function reverseGeocodeMapbox(lat, lon) {
  const token = process.env.MAPBOX_TOKEN || process.env.MAPBOX_API_KEY;
  if (!token) return '';
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(lon)},${encodeURIComponent(lat)}.json?limit=1&language=es&access_token=${token}`;
    const resp = await fetch(url);
    if (!resp.ok) return '';
    const data = await resp.json();
    if (data && Array.isArray(data.features) && data.features[0]) {
      return data.features[0].place_name || '';
    }
    return '';
  } catch (_) {
    return '';
  }
}

// POIs cercanos vía Overpass (amenities comunes) - uso mínimo
async function fetchNearbyPOI(lat, lon) {
  const query = `\n[out:json][timeout:10];\n(\n  node(around:300,${lat},${lon})[amenity~"^(restaurant|cafe|bank|atm|pharmacy|hospital|fuel)$"];\n  way(around:300,${lat},${lon})[amenity~"^(restaurant|cafe|bank|atm|pharmacy|hospital|fuel)$"];\n);\nout center tags limit 5;`;
  const resp = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'telegram-bot-vercel/1.0 (contact: example@example.com)',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({ data: query })
  });
  if (!resp.ok) {
    if (process.env.DEBUG_POI) console.error('Overpass status', resp.status);
    return '';
  }
  const data = await resp.json();
  if (!data.elements || !data.elements.length) {
    if (process.env.DEBUG_POI) console.error('Overpass sin elementos');
    return '';
  }
  const list = data.elements
    .map((e, i) => {
      const tags = e.tags || {};
      const n = tags.name || tags.brand || tags.operator || tags.amenity || 'POI';
      return `${i + 1}) ${n}`.slice(0, 40);
    })
    .slice(0, 5);
  if (!list.length) return '';
  return `POI cercanos: ${list.join('; ')}`;
}
