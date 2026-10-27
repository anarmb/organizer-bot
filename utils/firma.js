const crypto = require('crypto');

function firmarChatId(chatId) {
  return crypto
    .createHmac('sha256', process.env.GEN_FIRMA)
    .update(String(chatId))
    .digest('hex');
}

function validarToken(chatId, token) {
  const esperado = Buffer.from(firmarChatId(chatId));
  const recibido = Buffer.from(token || '');
  return esperado.length === recibido.length && crypto.timingSafeEqual(esperado, recibido);
}


module.exports = { firmarChatId, validarToken }