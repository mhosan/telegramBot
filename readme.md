# Telegram Bot en Vercel

Bot de Telegram desplegado como función serverless en Vercel con webhook y auto-deploy desde GitHub.

## 1. Arquitectura del proyecto

### 🏗️ **Estructura serverless optimizada:**
```
├── api/
│   └── telegram.js          # 🤖 Handler webhook principal
├── scripts/
│   └── setWebhook.ps1       # 🔧 Script configuración webhook
├── .env                     # 🔒 Variables locales (no se sube)
├── .gitignore              # 🛡️ Protección archivos sensibles
├── package.json            # 📦 Dependencias del proyecto
├── vercel.json             # ⚙️ Configuración deployment
└── readme.md               # 📖 Esta documentación
```

### 🚀 **Flujo de funcionamiento:**
1. **Usuario** envía mensaje → **@MhPrimerBot**
2. **Telegram** POST → `https://tu-proyecto.vercel.app/webhook`
3. **Vercel** ejecuta → `api/telegram.js` (función serverless)
4. **Handler** procesa → comando/mensaje y responde

---

## 2. Despliegue inicial en Vercel

### 2.1 Conectar repositorio a Vercel
1. **GitHub:** Push tu proyecto a un repositorio
2. **Vercel:** Importar desde [vercel.com/new](https://vercel.com/new)
3. **Configuración:**
   - Framework: **Other**
   - Build Command: *(vacío)*
   - Output Directory: *(vacío)*
   - Install Command: `npm install`

### 2.2 Configurar variables de entorno
En **Project Settings → Environment Variables (Production)**:
```
TELEGRAM_BOT_TOKEN = tu_token_de_botfather
WEBHOOK_SECRET = algo_seguro_opcional
```

### 2.3 Primer deployment
- **Automático** al importar el proyecto
- **URL generada:** `https://tu-proyecto.vercel.app`
- **Auto-deploy:** Cada push a main

---

## 3. Configurar webhook de Telegram

### 3.1 Script automático (recomendado)
```powershell
cd scripts
./setWebhook.ps1 -Token "TU_TOKEN" -BaseUrl "https://tu-proyecto.vercel.app"
```

### 3.2 Manual con PowerShell
```powershell
$env:TELEGRAM_BOT_TOKEN="TU_TOKEN"
curl "https://api.telegram.org/bot$($env:TELEGRAM_BOT_TOKEN)/setWebhook?url=https://tu-proyecto.vercel.app/webhook"
```

### 3.3 Con secreto de seguridad
```powershell
curl "https://api.telegram.org/bot$($env:TELEGRAM_BOT_TOKEN)/setWebhook?url=https://tu-proyecto.vercel.app/webhook?secret=algo_seguro"
```

### 3.4 Verificar configuración
```powershell
curl "https://api.telegram.org/bot$($env:TELEGRAM_BOT_TOKEN)/getWebhookInfo"
```

---

## 4. Comandos disponibles del bot

| Comando | Respuesta | Descripción |
|---------|-----------|-------------|
| `/start` | 🤖 Bot desplegado en Vercel y listo. | Mensaje de bienvenida |
| `/ping` | pong 🟢 | Test de conectividad |
| `/info` | Chat ID: 123...<br>User: username | Información del chat |
| *texto libre* | Eco: tu mensaje | Repite el mensaje enviado |

---

## 5. Flujo de desarrollo (CI/CD)

### 5.1 Desarrollo local
```powershell
# Clonar y probar localmente
git clone tu-repo
cd tu-proyecto
npm install
vercel dev  # Simula entorno Vercel
```

### 5.2 Despliegue automático
```powershell
# Hacer cambios al código
git add .
git commit -m "descripción del cambio"
git push origin main
# ✅ Auto-deploy disparado en Vercel
```

### 5.3 Monitoreo y logs
- **Runtime Logs:** Vercel Dashboard → tu proyecto → Functions
- **Build Logs:** Para errores de deployment
- **Instant Rollback:** Si algo falla

### 5.4 Variables de entorno
- **Locales (.env):** Solo para desarrollo, no subir al repo
- **Producción:** Project Settings → Environment Variables en Vercel

---

## 7. Configuración del webhook

### 7.1 Usar el script PowerShell
```powershell
# Ejecutar desde la carpeta scripts/
.\setWebhook.ps1
```

### 7.2 Verificación manual
```powershell
# Ver webhook actual
$uri = "https://api.telegram.org/bot$token/getWebhookInfo"
$response = Invoke-RestMethod -Uri $uri -Method Get
$response
```

### 7.3 Configuración desde código
```javascript
const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = `https://tu-app.vercel.app/webhook`;

// Configurar webhook
fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl })
});
```

---

### 8.1 Variables de entorno locales
Crear `.env` (NO subir al repositorio):
```
TELEGRAM_BOT_TOKEN=tu_token_real_aquí
NODE_ENV=development
```

### 8.2 Testing con Vercel dev
```powershell
# Simular entorno Vercel
vercel dev
# Bot disponible en http://localhost:3000
```

### 8.3 Debugging de webhook
```javascript
// En api/telegram.js - agregar logs temporales
console.log('[DEBUG] Update recibido:', JSON.stringify(update, null, 2));
console.log('[DEBUG] Respuesta enviada:', response);
```

### 8.4 Comandos de prueba
Probar en Telegram:
- `/start` - Mensaje de bienvenida
- `/ping` - Verificar conectividad  
- `/info` - Información del chat
- Texto cualquiera - Echo del mensaje

---

### 9.1 Configurar en Vercel Dashboard
1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agregar:
   - `TELEGRAM_BOT_TOKEN` = `tu_token_del_bot`
   - `NODE_ENV` = `production`
4. **Redeploy:** Project → Deployments → Redeploy

### 9.2 Variables desde CLI
```powershell
# Configurar token
vercel env add TELEGRAM_BOT_TOKEN production
# Ingresar el valor cuando se solicite

# Ver variables configuradas
vercel env ls
```

### 9.3 Validación de variables
En `api/telegram.js`:
```javascript
if (!process.env.TELEGRAM_BOT_TOKEN) {
    return {
        statusCode: 500,
        body: 'TELEGRAM_BOT_TOKEN no configurado'
    };
}
```

---

### 10.1 Runtime Logs en Vercel
1. Dashboard → tu proyecto → Functions
2. Click en `api/telegram.js`
3. Ver logs en tiempo real
4. Filtrar por errores o warnings

### 10.2 Build Logs
- Dashboard → Deployments → click deployment → Build Logs
- Útil para errores de instalación de dependencias

### 10.3 Logging personalizado
```javascript
// En api/telegram.js
function logInfo(message, data = {}) {
    console.log(`[INFO] ${message}`, JSON.stringify(data, null, 2));
}

function logError(message, error) {
    console.error(`[ERROR] ${message}`, error);
}

// Usar en el código
logInfo('Mensaje recibido', { from: update.message?.from?.username });
```

### 10.4 Alertas por webhook
```javascript
// Notificar errores críticos
async function notifyError(error) {
    const adminChatId = 'TU_CHAT_ID_ADMIN';
    await callTelegram('sendMessage', {
        chat_id: adminChatId,
        text: `🚨 Error en bot: ${error.message}`
    });
}
```

---

| Problema | Causa probable | Solución |
|----------|---------------|-----------|
| **Bot no responde** | Token incorrecto | Verificar variable `TELEGRAM_BOT_TOKEN` en Vercel Dashboard |
| **Error 403 Forbidden** | Webhook no configurado | Ejecutar `scripts/setWebhook.ps1` |
| **Error en deploy** | Dependencia faltante | Revisar `package.json` y Build Logs |
| **Function timeout** | Proceso muy lento | Optimizar código, usar async/await |
| **Variables no disponibles** | Falta redeploy | Redeploy después de cambiar environment variables |
| **Webhook duplicado** | Múltiples configuraciones | Limpiar webhook: `deleteWebhook` y reconfigurar |

### 11.1 Debugging paso a paso
```powershell
# 1. Verificar webhook
$token = "tu_token"
$uri = "https://api.telegram.org/bot$token/getWebhookInfo"
Invoke-RestMethod -Uri $uri -Method Get

# 2. Probar función directamente  
curl https://tu-app.vercel.app/webhook -X POST -d '{"test": true}'

# 3. Ver logs en tiempo real
# Vercel Dashboard → Functions → Runtime Logs
```

### 11.2 Reset completo
```powershell
# Borrar webhook actual
$deleteUri = "https://api.telegram.org/bot$token/deleteWebhook"
Invoke-RestMethod -Uri $deleteUri -Method POST

# Reconfigurar desde cero
.\scripts\setWebhook.ps1
```

---

### 12.1 Performance en serverless
```javascript
// ✅ Bueno - respuesta rápida
async function handleMessage(message) {
    // Procesar inmediatamente
    await sendMessage(message.chat.id, 'Respuesta rápida');
}

// ❌ Evitar - operaciones lentas
async function slowOperation() {
    // Evitar consultas DB complejas
    // Evitar procesamiento de imágenes pesado
    // Evitar llamadas API múltiples secuenciales
}
```

### 12.2 Manejo de errores robusto
```javascript
module.exports = async (req, res) => {
    try {
        const update = req.body;
        await processUpdate(update);
        
        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('[ERROR]', error);
        // No fallar la función por errores del bot
        res.status(200).json({ ok: true, error: error.message });
    }
};
```

### 12.3 Validaciones de seguridad
```javascript
// Verificar origen del webhook (opcional)
function verifyWebhook(req) {
    const secretToken = process.env.WEBHOOK_SECRET;
    if (secretToken) {
        const providedToken = req.headers['x-telegram-bot-api-secret-token'];
        return providedToken === secretToken;
    }
    return true; // Sin verificación si no hay secret
}
```

### 12.4 Límites de rate
```javascript
// Control básico de flood
const userLastMessage = new Map();

function checkRateLimit(userId) {
    const now = Date.now();
    const lastTime = userLastMessage.get(userId) || 0;
    const diff = now - lastTime;
    
    if (diff < 1000) { // 1 segundo mínimo entre mensajes
        return false;
    }
    
    userLastMessage.set(userId, now);
    return true;
}
```

---

### 13.1 Integración con base de datos
```javascript
// Ejemplo con Supabase (recomendado para serverless)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function saveUser(userId, username) {
    const { data, error } = await supabase
        .from('users')
        .upsert({ id: userId, username });
    
    return { data, error };
}
```

### 13.2 Inline keyboards
```javascript
async function sendWithKeyboard(chatId, text) {
    const keyboard = {
        inline_keyboard: [
            [
                { text: '✅ Sí', callback_data: 'yes' },
                { text: '❌ No', callback_data: 'no' }
            ],
            [
                { text: '📊 Estadísticas', callback_data: 'stats' }
            ]
        ]
    };
    
    await callTelegram('sendMessage', {
        chat_id: chatId,
        text,
        reply_markup: keyboard
    });
}
```

### 13.3 Comandos con parámetros
```javascript
function handleCommand(message) {
    const [command, ...args] = message.text.split(' ');
    
    switch (command) {
        case '/weather':
            const city = args.join(' ') || 'Madrid';
            return handleWeatherCommand(message.chat.id, city);
            
        case '/remind':
            const reminderText = args.join(' ');
            return handleReminderCommand(message.chat.id, reminderText);
            
        default:
            return handleUnknownCommand(message.chat.id);
    }
}
```

### 13.4 Manejo de archivos
```javascript
async function handleDocument(message) {
    const fileId = message.document.file_id;
    
    // Obtener info del archivo
    const fileInfo = await callTelegram('getFile', { file_id: fileId });
    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
    
    // Procesar archivo (ej: subir a cloud storage)
    await processFile(fileUrl, message.document.file_name);
    
    await sendMessage(message.chat.id, '✅ Archivo procesado correctamente');
}
```

---

### 14.1 API de clima (ejemplo)
```javascript
async function getWeather(city) {
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=es`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.cod === 200) {
            return `🌤️ **${data.name}**\n` +
                   `Temperatura: ${data.main.temp}°C\n` +
                   `Descripción: ${data.weather[0].description}\n` +
                   `Humedad: ${data.main.humidity}%`;
        } else {
            return '❌ Ciudad no encontrada';
        }
    } catch (error) {
        console.error('Error API clima:', error);
        return '⚠️ Error al consultar el clima';
    }
}
```

### 14.2 Integración con ChatGPT/OpenAI
```javascript
async function askAI(question) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: question }],
            max_tokens: 150
        })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
}
```

### 14.3 Webhook notifications
```javascript
// Recibir webhooks de otros servicios
module.exports = async (req, res) => {
    const { pathname } = new URL(req.url, 'https://example.com');
    
    if (pathname === '/webhook') {
        // Telegram webhook
        await handleTelegramUpdate(req.body);
    } else if (pathname === '/github-webhook') {
        // GitHub webhook para CI/CD
        await handleGitHubWebhook(req.body);
    } else if (pathname === '/payment-webhook') {
        // Webhook de pagos
        await handlePaymentWebhook(req.body);
    }
    
    res.status(200).json({ ok: true });
};
```

---

### 15.1 Checklist de seguridad
- ✅ `.env` en `.gitignore` (no subir tokens al repo)
- ✅ Variables de entorno en Vercel Dashboard (no en código)
- ✅ Webhook con HTTPS (automático en Vercel)
- ✅ Validación de input del usuario
- ✅ Rate limiting para evitar spam
- ✅ Logs sin información sensible

### 15.2 Pipeline de deployment
```yaml
# .github/workflows/deploy.yml (opcional)
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 15.3 Backups y recuperación
```javascript
// Backup automático de datos importantes
async function backupUserData() {
    const timestamp = new Date().toISOString();
    const backupData = {
        timestamp,
        users: await getAllUsers(),
        stats: await getStats()
    };
    
    // Subir a cloud storage (S3, Google Drive, etc.)
    await uploadBackup(backupData);
}
```

### 15.4 Configuración de dominios (opcional)
En Vercel Dashboard:
1. Settings → Domains
2. Agregar dominio personalizado
3. Configurar DNS según instrucciones
4. Actualizar webhook URL en BotFather

---

## 16. Comandos de referencia rápida

---

## 12. Desarrollo local con Vercel

### 12.1 Simular entorno serverless
```powershell
# Instalar Vercel CLI (si no lo tienes)
npm install -g vercel

# Desarrollo local que simula Vercel
vercel dev
```

Salida esperada:
```
> Ready! Available at http://localhost:3000
> Your webhook endpoint: http://localhost:3000/webhook
```

### 12.2 Probar el webhook localmente
```powershell
# Test básico del endpoint
curl -X POST http://localhost:3000/webhook -H "Content-Type: application/json" -d '{"test": true}'

# Respuesta esperada: {"ok":true}
```

### 12.3 Configurar webhook para desarrollo
```powershell
# Usar ngrok o similar para exponer localhost
ngrok http 3000

# Configurar webhook temporal (usar URL de ngrok)
.\scripts\setWebhook.ps1 -Token "tu_token" -BaseUrl "https://abc123.ngrok.io"
```

### 12.4 Variables de entorno locales
Archivo `.env` (NO subir al repo):
```
TELEGRAM_BOT_TOKEN=tu_token_aquí
NODE_ENV=development
WEBHOOK_SECRET=opcional_para_testing
```

### 12.5 Debugging
En `api/telegram.js` agregar logs temporales:
```javascript
console.log('[DEBUG] Update recibido:', JSON.stringify(update, null, 2));
console.log('[DEBUG] Mensaje procesado:', message?.text);
```

Ver logs en tiempo real:
```powershell
# Logs aparecen en la terminal donde corre vercel dev
vercel dev
```

---

## 13. Testing del bot
3. Enviar `/start`, luego `/test`, luego texto libre.
4. Ver logs en consola.

Ejemplo logs:
```
📱 Comando /start de Juan (123456789)
💬 Mensaje: "hola bot" de Juan
🧪 Comando /test recibido
```

### 12.3 Script de desarrollo con reinicio automático
Instalar nodemon:
### 13.1 Configurar Nodemon para desarrollo
```powershell
npm install -D nodemon
```

Actualizar `package.json`:
```json
"scripts": {
	"start": "node api/telegram.js",  
	"dev": "vercel dev"
}
```

Ejecutar modo desarrollo:
```powershell
npm run dev
# O directamente:
vercel dev
```

### 12.4 Ejemplo avanzado (bot con botones / parámetros)
```js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('Falta TELEGRAM_BOT_TOKEN');
const bot = new TelegramBot(token, { polling: true });

console.log('🚀 Bot de pruebas avanzado iniciado...');

// /saludar <nombre>
bot.onText(/\/saludar (.+)/, (msg, match) => {
	bot.sendMessage(msg.chat.id, `¡Hola ${match[1]}! 😊`);
});

// /botones
bot.onText(/\/botones/, (msg) => {
	bot.sendMessage(msg.chat.id, 'Elige una opción:', {
		reply_markup: {
			inline_keyboard: [
				[ { text: '👍 Me gusta', callback_data: 'like' }, { text: '👎 No me gusta', callback_data: 'dislike' } ],
				[ { text: '🔄 Reiniciar', callback_data: 'restart' } ]
			]
		}
	});
});

bot.on('callback_query', (cq) => {
	const data = cq.data;
	let respuesta = '';
	switch (data) {
		case 'like': respuesta = '👍 ¡Genial!'; break;
		case 'dislike': respuesta = '👎 Ok, entendido'; break;
		case 'restart': respuesta = '🔄 Reiniciando...'; break;
	}
	bot.answerCallbackQuery(cq.id, { text: respuesta });
});

bot.onText(/\/info/, (msg) => {
	const info = `📊 Información\n- Chat ID: ${msg.chat.id}\n- Tipo: ${msg.chat.type}\n- Usuario: ${msg.from.first_name} ${msg.from.last_name || ''}\n- Username: @${msg.from.username || 'sin username'}\n- ID Usuario: ${msg.from.id}`;
	bot.sendMessage(msg.chat.id, info);
});
```

### 12.5 Debugging y logs detallados
```js
function log(type, message, data) {
	const ts = new Date().toISOString();
	console.log(`[${ts}] ${type}: ${message}`);
	if (data) console.log('DATA:', JSON.stringify(data, null, 2));
}

bot.on('message', (msg) => {
	log('MESSAGE', `De ${msg.from.first_name}`, { text: msg.text, chatId: msg.chat.id, userId: msg.from.id });
});
```

### 13.2 Comandos útiles (desarrollo con Vercel)
```powershell
# Ver procesos de Vercel
vercel ls                        # Proyectos
vercel logs                      # Logs recientes

# Testing local
curl -X POST localhost:3000/webhook -H "Content-Type: application/json" -d '{"test":true}'

# Variables de entorno
vercel env ls                    # Ver variables
vercel env add                   # Agregar variable
```

### 13.3 Errores comunes (desarrollo serverless)
| Error | Causa | Solución |
|-------|-------|----------|
| Port 3000 ocupado | Vercel dev ya corriendo | `vercel dev --listen 3001` |
| Token inválido | Variable no configurada | Revisar `.env` local |
| Webhook 404 | Endpoint incorrecto | Verificar `/webhook` en URL |
| Function timeout | Código muy lento | Optimizar, usar async/await |
| polling_error | Intermitencia red | Se auto-recupera, reinicia si persiste |

---
## 13. Comandos útiles de BotFather

Una vez creado tu bot con BotFather, estos comandos ayudan a gestionarlo:

| Comando | Descripción |
|---------|-------------|
| `/mybots` | Lista todos tus bots y accesos rápidos a configuración |
| `/token` | Muestra el token actual del bot seleccionado |
| `/revoke` | Revoca el token actual y genera uno nuevo (el anterior deja de funcionar) |
| `/setname` | Cambia el nombre visible del bot |
| `/setdescription` | Define la descripción que se ve en el perfil del bot |
| `/setabouttext` | Texto corto “sobre el bot” (aparece al compartir) |
| `/setuserpic` | Cambia la foto / avatar del bot |
| `/setcommands` | Configura la lista de comandos sugeridos (menú) |
| `/deletebot` | Elimina el bot (acción irreversible) |

Sugerencia: después de `/setcommands` define cada comando en formato:
```
start - Mensaje de bienvenida
test - Probar que el bot responde
info - Información del chat
saludar - Saluda a un usuario (usa /saludar Nombre)
```

Al actualizar comandos puede tardar unos segundos en propagarse al cliente de Telegram.

---
## 14. Crear un bot nuevo con BotFather (paso a paso)

1. En Telegram abre chat con @BotFather.
2. Envía `/start` si es la primera vez.
3. Envía `/newbot`.
4. BotFather pedirá un nombre (visible) → Ej: `Mi Bot Demo`.
5. Pedirá un username único que debe terminar en `bot` → Ej: `MiBotDemo_bot`.
6. Recibirás el token (copiar y guardar en lugar seguro).
7. Opcional: configura meta-datos:
	- `/setdescription` → Texto descriptivo (máx ~512 chars).
	- `/setabouttext` → Texto corto (máx 120 chars) que aparece al compartir.
	- `/setuserpic` → Sube un avatar cuadrado (512x512 recomendado).
	- `/setcommands` → Define comandos sugeridos (ver sección 13).
8. Guarda el token en:
	- `.env` local (`TELEGRAM_BOT_TOKEN=...`), y/o
	- Variables de entorno en AlwaysData.
9. (Opcional) Revocar token si se filtró: `/revoke`.

Checklist rápido antes de desplegar:
- [ ] Token cargado en entorno
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servicio configurado (o pm2 / start.js)
- [ ] Logs verificados tras primer arranque
- [ ] Comandos de BotFather configurados

---
## 15. Buenas prácticas de seguridad (token y entorno)

| Riesgo | Prevención | Acción si ocurre |
|--------|------------|------------------|
| Token expuesto en repositorio | Añadir `.env` a `.gitignore` | Revocar token en BotFather y actualizar variable |
| Token pegado en logs o pantallas | Usar variables de entorno, no hardcode | Rotar token y limpiar logs públicos |
| Acceso no autorizado al servidor | Usar contraseña/clave SSH fuerte | Revocar credenciales, revisar procesos |
| Múltiples instancias conflictivas | Controlar procesos (pm2 o daemon único) | Matar instancias, reiniciar servicio |
| Fuga de datos en errores | Sanitizar logs, no loggear datos sensibles | Parchar código y purgar logs |

Recomendaciones adicionales:
- Nunca subas `.env` a un repositorio público.
- Usa `/revoke` si sospechas de filtración inmediata.
- Limita permisos de carpeta: solo tu usuario debe modificar el código.
### 16.4 Troubleshooting rápido
```powershell
# Verificar deployment
curl https://tu-app.vercel.app/webhook

# Ver logs en tiempo real
# Dashboard → Functions → Runtime Logs

# Reset webhook completo
Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/deleteWebhook" -Method POST
.\scripts\setWebhook.ps1

# Verificar variables de entorno
vercel env ls
```

---

## 🎉 ¡Bot completamente funcional!

Tu bot de Telegram está ahora desplegado en Vercel con:

- ✅ **Arquitectura serverless** escalable y confiable
- ✅ **Auto-deploy** desde GitHub en cada push
- ✅ **Webhook configurado** para respuestas instantáneas  
- ✅ **Variables de entorno** seguras y gestionadas
- ✅ **Monitoreo integrado** con logs en tiempo real
- ✅ **Comandos funcionales** (/start, /ping, /info, echo)

**Próximos pasos sugeridos:**
1. Personalizar comandos según tus necesidades
2. Agregar integración con bases de datos
3. Implementar funcionalidades específicas de tu bot
4. Configurar alertas de monitoreo
5. Añadir dominio personalizado (opcional)

Para soporte o nuevas funcionalidades, consulta la [documentación de Telegram Bot API](https://core.telegram.org/bots/api) y [Vercel Docs](https://vercel.com/docs).

---

## 📚 Enlaces útiles

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Vercel Documentation](https://vercel.com/docs)
- [Node.js Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)
- [BotFather en Telegram](https://t.me/botfather)

---

**¿Necesitas ayuda?** Revisa la sección de [solución de problemas](#11-solución-de-problemas-comunes) o consulta los logs en Vercel Dashboard.