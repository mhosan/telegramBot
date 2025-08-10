// Reemplazo de import ESM por función compatible con require/CommonJS
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// controllers/index.js

// GET /
exports.getWelcome = (req, res) => {
    res.send('Hola soy un get');
};

// GET /json
exports.getJson = (req, res) => {
    res.json({ mensaje: 'Hola soy un get en formato JSON', tipo: 'JSON' });
};

// POST /
exports.postText = (req, res) => {
    const { texto } = req.body;
    res.send(texto);
};


// POST /chat
const postChat = async (req, res) => {
  const body = req.body || {};
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.AUTHORIZATION_BEARER}`,
        "HTTP-Referer": "https://mhtest.alwaysdata.net/#/",
        "X-Title": "Mhosan",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": body.model || "mistralai/mistral-7b-instruct:free", //117M tokens baja latencia
        //"model": body.model || "mistralai/mistral-nemo:free", //1.59B tokens
        //"model": body.model || "microsoft/mai-ds-r1:free", //2.73B tokens
        //"model": body.model || "meta-llama/llama-4-maverick:free", //10.6B tokens
        //"model": body.model || "google/gemini-2.0-flash-exp:free", //27.7B tokens
        //"model": body.model || "microsoft/phi-4-reasoning-plus:free", //222M tokens
        //"model": body.model || "deepseek/deepseek-chat-v3-0324:free", //99B tokens
        "messages": body.messages || [
          { role: "user", content: "¿Cuantos términos tiene la serie de Fibonacci?" },
          //{ role: 'assistant', content: "No esto seguro, pero mi mejor suposición es" },
        ],
        'provider': body.provider || { 'sort': 'latency' },
        //max_tokens: 100 //maximo de tokens a devolver
        //temperature: 0.7, //controla la aleatoriedad de la respuesta
      })
    });
    //parametros de provider
    //throughput permite procesar mas solicit. x seg
    //price prioriza el costo mas bajo
    //latency prioriza la latencia mas baja: veloc. resp. mas rapida
    const data = await response.json();
    const usedModel = body.model || "mistralai/mistral-7b-instruct:free";
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      const pretty = JSON.stringify({
        message: data.choices[0].message.content,
        model: usedModel
      }, null, 2);
      res.setHeader('Content-Type', 'application/json');
      res.send(pretty);
    } else {
      res.status(500).json({ error: 'No message content found', data, model: usedModel });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.postChat = postChat;
// POST /chat


// Función auxiliar para enviar mensajes al LLM (OpenRouter)
async function sendToLLM(messages, model = "mistralai/mistral-7b-instruct:free", provider = { sort: 'latency' }) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.AUTHORIZATION_BEARER}`,
      "HTTP-Referer": "https://mhtest.alwaysdata.net/#/",
      "X-Title": "Mhosan",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      provider
    })
  });
  return response.json();
}

// POST /weather
const postWeather = async (req, res) => {
  
  const { city } = req.body;
  if (!city) {
    return res.status(400).json({ error: 'City is required in the request body.' });
  }
  try {
    // 1. Llamar al MCP
    const mcpResponse = await fetch('https://mcpserver-hazel.vercel.app/api', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/event-stream',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'pronostico',
          arguments: { city }
        },
        id: 1
      })
    });
    const text = await mcpResponse.text();
    // Parsear la respuesta y extraer el texto meteorológico
    let datosMeteorologicos = '';
    try {
      const dataLines = text.split('\n').filter(line => line.startsWith('data: '));
      if (dataLines.length > 0) {
        const lastData = dataLines[dataLines.length - 1].replace('data: ', '');
        const data = JSON.parse(lastData);
        // Buscar la propiedad text en la estructura result.content[0].text
        if (
          data.result &&
          data.result.content &&
          Array.isArray(data.result.content) &&
          data.result.content[0] &&
          data.result.content[0].text &&
          typeof data.result.content[0].text === 'object'
        ) {
          // Convertir el objeto text a string legible
          datosMeteorologicos = JSON.stringify(data.result.content[0].text, null, 2);
        } else {
          datosMeteorologicos = '[No se encontró la propiedad text en la respuesta del MCP]';
        }
      } else {
        datosMeteorologicos = '[No se encontró línea con data: en la respuesta del MCP]';
      }
    } catch (err) {
      datosMeteorologicos = '[Error al parsear la respuesta del MCP: ' + err.message + ']';
    }
    //console.log('Datos meteorológicos extraídos:', datosMeteorologicos);
    // Buscar todas las líneas con 'data:' y tomar la última
    let pronostico = '';
    try {
      const dataLines = text.split('\n').filter(line => line.startsWith('data: '));
      if (dataLines.length > 0) {
        const lastData = dataLines[dataLines.length - 1].replace('data: ', '');
        const data = JSON.parse(lastData);
        // Extraer el texto del pronóstico si está en data.result.content[0].text
        if (data.result && data.result.content && Array.isArray(data.result.content) && data.result.content[0].text) {
          pronostico = data.result.content[0].text;
        } else if (data.result && data.result.content && typeof data.result.content === 'string') {
          pronostico = data.result.content;
        } else if (data.content && typeof data.content === 'string') {
          pronostico = data.content;
        } else if (data.content && typeof data.content === 'object') {
          // Extraer campos meteorológicos relevantes si existen
          const campos = data.content;
          let frase = '';
          if (campos.ciudad) frase += `En ${campos.ciudad}, `;
          if (campos.temperatura) frase += `la temperatura es de ${campos.temperatura}, `;
          if (campos.humedad) frase += `la humedad es de ${campos.humedad}, `;
          if (campos.presion) frase += `la presión es de ${campos.presion}, `;
          if (campos.viento) frase += `el viento es de ${campos.viento}, `;
          if (campos.nubosidad) frase += `la nubosidad es de ${campos.nubosidad}, `;
          pronostico = frase.trim().replace(/, $/, '.');
          if (!pronostico) pronostico = Object.values(campos).join(', ');
        } else {
          pronostico = JSON.stringify(data);
        }
      } else {
        throw new Error('No se encontró línea con data: en la respuesta del MCP');
      }
    } catch (err) {
      return res.status(500).json({ error: 'Error al parsear la respuesta del MCP', details: err.message, raw: text });
    }
    // 3. Armar el mensaje para el LLM usando el string de datos meteorológicos extraídos
    const messages = [
      { role: "user", content: `Dame un resumen del pronóstico del tiempo de ${city} con estos datos: ${datosMeteorologicos}` }
    ];
    // 4. Usar el mismo modelo que postChat
    const model = req.body.model || "mistralai/mistral-7b-instruct:free";
    const provider = req.body.provider || { sort: 'latency' };
    
    // 5. Llamar al LLM
    const llmData = await sendToLLM(messages, model, provider);
    
    // 6. Responder al cliente
    let result = { model: model };
    if (llmData.choices && llmData.choices[0] && llmData.choices[0].message && llmData.choices[0].message.content) {
      result.content = llmData.choices[0].message.content;
    } else {
      result.data = llmData;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      jsonrpc: '2.0',
      result,
      id: 1
    }, null, 2));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.postWeather = postWeather;
// POST /weather


// PUT /
exports.putWelcome = (req, res) => {
    res.send('Hola, soy un put');
};

// DELETE /
exports.deleteWelcome = (req, res) => {
    res.send('Hola soy un delete');
};
