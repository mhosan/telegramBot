// Cliente mínimo de IA para OpenRouter
// Proporciona una sola función: askAI(prompt, model?) -> Promise<string>

// const DEFAULT_MODEL = "mistralai/mistral-7b-instruct:free"; // Modelo anterior comentado
const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free"; // Nuevo modelo solicitado

async function askAI(prompt, model = DEFAULT_MODEL) {
  if (!prompt) return "Prompt vacío"; // Manejo mínimo
  const token = process.env.AUTHORIZATION_BEARER;
  if (!token) return "Falta AUTHORIZATION_BEARER"; // Sin validaciones extra

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        // Headers mínimos adicionales igual que en openrouter.js para habilitar respuesta
        "HTTP-Referer": "https://telegram-bot.vercel.app/",
        "X-Title": "Mhosan"
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        provider: { sort: 'latency' }
      })
    });
    const data = await resp.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (content) return content;
    if (data && data.error) {
      // Mensaje breve de error permitido (sin detalles extensos)
      return `Error IA: ${data.error.message || data.error}`.slice(0, 120);
    }
    return "Sin respuesta";
  } catch (e) {
    return "Error IA"; // Respuesta breve, sin detalles
  }
}

module.exports = { askAI };
