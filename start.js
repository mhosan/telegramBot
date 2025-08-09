const { spawn } = require('child_process');

// Archivo principal configurable vía variable BOT_ENTRY (fallback a mhBot01.js)
const ENTRY = process.env.BOT_ENTRY || 'mhBot01.js';

function startBot() {
  const bot = spawn('node', [ENTRY], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  bot.on('close', (code) => {
    console.log(`[STARTER] Proceso finalizó con código ${code}. Reinicio en 5s...`);
    setTimeout(startBot, 5000);
  });

  bot.on('error', (err) => {
    console.error('[STARTER] Error al lanzar el bot:', err);
    setTimeout(startBot, 10000);
  });
}

startBot();
