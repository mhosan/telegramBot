# Bot en AlwaysData

Guía rápida para subir el proyecto y preparar el entorno en AlwaysData.

## 1. Subir archivos

### Opción A: SSH / SFTP

1. Conecta por **SSH**:
	```bash
	ssh usuario@ssh-usuario.alwaysdata.net
	```
2. O usa un cliente **SFTP** (FileZilla / WinSCP) con:
	- Host: `ssh-usuario.alwaysdata.net`
	- Usuario: `usuario`
	- Protocolo: SFTP
	- Puerto: 22
3. Sube los archivos al directorio deseado, por ejemplo: `/home/usuario/bot/`

### Opción B: Panel web

1. Entra al panel de AlwaysData.
2. Ve a: Files.
3. Sube tus archivos a: `/home/usuario/bot/`.

## 2. Instalar dependencias

Conéctate primero por SSH y luego ejecuta:

```bash
ssh usuario@ssh-usuario.alwaysdata.net
C:\Users\Usuario>ssh mhtest_mhosan@ssh-mhtest.alwaysdata.net
(mhtest_mhosan@ssh-mhtest.alwaysdata.net) Password: mi clave aqui
cd ~/bot
npm install
```

## 3. Ejecutar el bot (si aplica)

Ejemplo (ajusta el nombre del archivo principal si es distinto):

```bash
node mhBot01.js
```

Para ejecutarlo en segundo plano puedes usar **pm2** (si está permitido / instalado):

```bash
npm install -g pm2
pm2 start mhBot01.js --name geobot
pm2 save
```

## 4. Estructura mínima recomendada

```
bot/
├─ mhBot01.js
├─ package.json
└─ readme.md
```

## 5. Notas

- Asegúrate de que `package.json` tenga el campo `main` apuntando a tu archivo principal si lo necesitas.
- Si usas variables de entorno, configúralas en el panel de AlwaysData (Environment / Variables) o mediante un archivo `.env` (no lo subas si contiene secretos).
- Si necesitas Node.js en una versión específica, configúralo en el panel (Runtime > Node.js version).

### Variables de entorno (.env)
Crea un archivo `.env` en la raíz del proyecto con, por ejemplo:
```bash
TELEGRAM_BOT_TOKEN=tu_token_aqui
NODE_ENV=production
```
Luego en tu código puedes acceder con:
```js
const token = process.env.TELEGRAM_BOT_TOKEN;
```

#### Opción 2: Variables en AlwaysData (sin .env)
1. Ve al panel de AlwaysData.
2. Menú: Environment → Environment variables.
3. Añade:
	 - `TELEGRAM_BOT_TOKEN = tu_token`
	 - (Opcional) `NODE_ENV = production`
4. Guarda y reinicia el servicio.

---

## 6. Configurar el servicio (Daemon)

En el panel de AlwaysData:

1. Ve a: Services → Add a service
2. Tipo: User program
3. Configura:
	 - Command: `/usr/bin/node`
	 - Arguments: `/home/usuario/bot/start.js` (recomendado) ó `/home/usuario/bot/mhBot01.js`
	 - Working directory: `/home/usuario/bot`
	 - Name: `telegram-bot`
	 - Environment: tu cuenta / entorno por defecto
4. Guarda. El servicio arrancará automáticamente.

> Nota: En este repositorio el archivo principal es `mhBot01.js`. Si tu `package.json` dice `bot.js`, puedes renombrar el archivo o ajustar `package.json` a `mhBot01.js` para coherencia.

---

## 7. Script de inicio robusto (auto-reinicio)

Crea `start.js` (ya incluido si sigues esta guía):

```js
const { spawn } = require('child_process');
const path = require('path');

const ENTRY = 'mhBot01.js'; // Cambia si usas otro nombre

function startBot() {
	const bot = spawn('node', [ENTRY], {
		cwd: __dirname,
		stdio: 'inherit'
	});

	bot.on('close', (code) => {
		console.log(`[STARTER] Bot terminó con código ${code}. Reiniciando en 5s...`);
		setTimeout(startBot, 5000);
	});

	bot.on('error', (err) => {
		console.error('[STARTER] Error al iniciar bot:', err);
		setTimeout(startBot, 10000);
	});
}

startBot();
```

Actualiza el servicio para usar `start.js` en lugar del archivo directo.

---

## 8. Logs y monitoreo

### Ver logs (SSH)
```bash
# Ejemplo logs estándar (depende de tu config)
tail -f ~/admin/logs/uwsgi.log

# Si creas logs propios
tail -f ~/bot/logs/bot.log
```

### Añadir logging sencillo
```js
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function log(message) {
	const timestamp = new Date().toISOString();
	const line = `${timestamp} - ${message}\n`;
	console.log(message);
	fs.appendFile(path.join(logDir, 'bot.log'), line, (err) => {
		if (err) console.error('Error escribiendo log:', err);
	});
}

// Uso con node-telegram-bot-api
// bot.on('message', msg => log(`Mensaje de ${msg.from?.username}: ${msg.text}`));
```

---

## 9. Webhook (alternativa a polling)

Si prefieres usar webhook:

```js
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const app = express();
app.use(express.json());

const token = process.env.TELEGRAM_BOT_TOKEN;
const url = 'https://usuario.alwaysdata.net'; // Cambia por tu dominio
const port = process.env.PORT || 8443;

const bot = new TelegramBot(token, { webHook: true });
bot.setWebHook(`${url}/bot${token}`);

app.post(`/bot${token}`, (req, res) => {
	bot.processUpdate(req.body);
	res.sendStatus(200);
});

app.listen(port, () => {
	console.log(`Webhook activo en puerto ${port}`);
});
```

Recuerda abrir/permitir el puerto configurado si es necesario.

---

## 10. Comandos útiles (mantenimiento)

```bash
# Ver procesos node
ps aux | grep node

# Matar proceso específico
pkill -f "node mhBot01.js"

# Uso de memoria
free -h

# Espacio en disco
df -h
```

---

## 11. Solución de problemas

| Problema | Verificación / Acción |
|----------|-----------------------|
| Bot no responde | Revisa servicio activo en panel / logs |
| Error permisos | Ajusta permisos (chmod) o propietario (chown) si aplica |
| Dependencias faltantes | Ejecuta `npm install` en SSH en el directorio correcto |
| Token inválido | Revisa variable de entorno (sin espacios extra) |
| Reinicios constantes | Mira logs para stack trace, prueba correr manual `node mhBot01.js` |

---

## 6. Comandos útiles

## 6. Comandos útiles

| Tarea | Comando |
|-------|---------|
| Actualizar dependencias | `npm install` |
| Ver procesos pm2 | `pm2 ls` |
| Logs del bot | `pm2 logs geobot` |
| Reiniciar | `pm2 restart geobot` |

---

Si necesitas más pasos (deploy automático CI/CD, clustering, métricas) indícalo y los añadimos.

---

## 12. Código básico para pruebas (desarrollo local)

Archivo sugerido: `bot.js`

```js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
	console.error('ERROR: TELEGRAM_BOT_TOKEN no está definido en .env');
	process.exit(1);
}

// Bot en modo polling (ideal para desarrollo local)
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Bot iniciado en modo desarrollo...');

// /start
bot.onText(/\/start/, (msg) => {
	const chatId = msg.chat.id;
	const userName = msg.from.first_name || 'Usuario';
	console.log(`📱 Comando /start de ${userName} (${chatId})`);
	bot.sendMessage(chatId, `¡Hola ${userName}! 👋\n\nSoy tu bot en desarrollo local.`);
});

// /test
bot.onText(/\/test/, (msg) => {
	const chatId = msg.chat.id;
	console.log('🧪 Comando /test recibido');
	bot.sendMessage(chatId, '✅ Test exitoso! El bot funciona correctamente.');
});

// Eco de mensajes (excepto comandos)
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
```

### 12.1 Ejecutar en local
```bash
# Instalar dependencias (si no lo hiciste)
npm install

# Ejecutar
node bot.js
```
Salida esperada:
```
🤖 Bot iniciado en modo desarrollo...
```

### 12.2 Probar el bot
1. Abrir Telegram.
2. Buscar el bot (username configurado con BotFather).
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
```bash
npm install -D nodemon
```
Agregar (o ya incluido) en `package.json`:
```jsonc
"scripts": {
	"start": "node mhBot01.js",
	"start:daemon": "node start.js",
	"dev": "nodemon bot.js"
}
```
Ejecutar modo desarrollo:
```bash
npm run dev
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

### 12.6 Comandos útiles (desarrollo)
```bash
ps aux | grep node      # Ver procesos
pkill -f "node bot.js"  # Matar instancia
tail -f bot.log         # Ver logs (si guardas en archivo)
netstat -tulpn | grep :3000 # Verificar puerto
```

### 12.7 Errores comunes (desarrollo)
| Error | Causa | Solución |
|-------|-------|----------|
| 409 Conflict getUpdates | Otra instancia polling | Matar procesos previos, reiniciar |
| Token inválido | Valor incorrecto o vacío | Revisar `.env` / variables panel |
| Bot no responde | Código detenido o error silencioso | Ejecutar manual y revisar consola |
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
- Considera separar un bot de pruebas y uno de producción (tokens distintos).
- Automatiza auditoría simple: script que verifique que no existe el token literal en el código.

Ejemplo de verificación rápida (Linux):
```bash
grep -R "TELEGRAM_BOT_TOKEN" -n .
```

---
## 16. Script PowerShell para setWebhook

Incluido en `scripts/setWebhook.ps1` para automatizar el alta del webhook.

Uso básico (PowerShell en Windows):
```powershell
cd scripts
./setWebhook.ps1 -Token "NUEVO_TOKEN" -BaseUrl "https://tu-app.vercel.app"
```

Con secreto:
```powershell
./setWebhook.ps1 -Token "NUEVO_TOKEN" -BaseUrl "https://tu-app.vercel.app" -Secret "MI_SECRETO"
```

Salida esperada:
```
== Configurando webhook ==
Webhook URL: https://tu-app.vercel.app/webhook
Respuesta setWebhook: { "ok": true, ... }
WebhookInfo:
{ ... }
== Listo ==
```

Errores comunes:
| Mensaje | Causa | Solución |
|---------|-------|----------|
| Missing TELEGRAM_BOT_TOKEN | Token vacío / mal pasado | Verifica parámetro -Token |
| webhook url is invalid | URL mal escrita / sin https | Usa https y dominio válido |
| bad request: failed to resolve host | Dominio incorrecto / DNS propagando | Esperar o revisar dominio |

Puedes volver a ejecutar el script tras un redeploy sin problemas (Telegram sustituye la URL anterior).

---