// Cliente mínimo de IA para OpenRouter
// Proporciona una sola función: askAI(prompt, model?) -> Promise<string>

const DEFAULT_MODEL = "mistralai/mistral-7b-instruct:free"; // Modelo sencillo y gratuito

async function askAI(prompt, model = DEFAULT_MODEL) {
  if (!prompt) return "Prompt vacío"; // Manejo mínimo
  const token = process.env.AUTHORIZATION_BEARER;
  if (!token) return "Falta AUTHORIZATION_BEARER"; // Sin validaciones extra

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [ { role: "user", content: prompt } ]
      })
    });
    const data = await resp.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return content || "Sin respuesta";
  } catch (e) {
    return "Error IA"; // Respuesta breve, sin detalles
  }
}

module.exports = { askAI };
