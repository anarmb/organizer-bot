require('dotenv').config();

const VARIABLES_OBLIGATORIAS = ['TELEGRAM_TOKEN', 'GEMINI_API_KEY', 'DATABASE_URL', 'GEN_FIRMA'];
const variablesQueFaltan = VARIABLES_OBLIGATORIAS.filter((nombre) => !process.env[nombre]);
if (variablesQueFaltan.length > 0) {
  console.error(`Faltan variables de entorno: ${variablesQueFaltan.join(', ')}. Revisa el archivo .env`);
  process.exit(1);
}
if (!process.env.WEB_URL) {
  console.warn('WEB_URL no está definida: los enlaces del calendario usarán localhost');
}

const { ZONA_HORARIA } = require('./utils/fechas.js');
process.env.TZ = ZONA_HORARIA;

const { Bot } = require('node-telegram-bot-api');
const registrarComandos = require('./handlers/comandos');
const registrarCallbacks = require('./handlers/callbacks');
const iniciarServidor = require('./web/server.js');
const { cronNotificaciones } = require('./services/notificaciones.js')

iniciarServidor();

const bot = new Bot(process.env.TELEGRAM_TOKEN);

registrarComandos(bot);
registrarCallbacks(bot);
cronNotificaciones(bot);

console.log('Bot escuchando...');
bot.startPolling().catch((error) => {
  console.error('El bot ha dejado de escuchar a Telegram:', error);
  process.exit(1);
});
