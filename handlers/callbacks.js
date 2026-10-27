const { completarTarea, eliminarTarea } = require('../services/tareas');
const { textoBotonTarea } = require('./teclado.js');

function registrarCallbacks(bot) {
  bot.on('callback_query', async (ctx) => {
    const dato = ctx.callbackQuery.data;
    const partes = dato.split(':');
    const accion = partes[0];
    const idNumerico = Number(partes[1]);
    const chatId = ctx.callbackQuery.message.chat.id;

    try {
      if (accion === 'completar') {
        const tareaActualizada = await completarTarea({ id: idNumerico, chatId });

        if (!tareaActualizada) {
          await ctx.answerCallbackQuery({ text: 'Esta tarea ya no existe' });
          return;
        }

        await ctx.answerCallbackQuery({
          text: `Tarea marcada como ${tareaActualizada.done ? 'completada' : 'pendiente'}`,
        });

        const tecladoActual = ctx.callbackQuery.message.reply_markup.inline_keyboard;
        const nuevoTeclado = tecladoActual.map((fila) =>
          fila.map((boton) => {
            if (boton.callback_data === dato) {
              return { ...boton, text: textoBotonTarea(tareaActualizada) };
            }
            return boton;
          })
        );

        await ctx.api.editMessageReplyMarkup({
          chat_id: chatId,
          message_id: ctx.callbackQuery.message.message_id,
          reply_markup: { inline_keyboard: nuevoTeclado },
        });

      } else if (accion === 'eliminar') {
        const tareaEliminada = await eliminarTarea({ id: idNumerico, chatId });

        if (!tareaEliminada) {
          await ctx.answerCallbackQuery({ text: 'Esta tarea ya no existe' });
          return;
        }

        await ctx.answerCallbackQuery({ text: 'Tarea eliminada' });

        const tecladoActual = ctx.callbackQuery.message.reply_markup.inline_keyboard;
        const nuevoTeclado = tecladoActual.filter((fila) =>
          !fila.some((boton) => Number(boton.callback_data.split(':')[1]) === idNumerico)
        );

        await ctx.api.editMessageReplyMarkup({
          chat_id: chatId,
          message_id: ctx.callbackQuery.message.message_id,
          reply_markup: { inline_keyboard: nuevoTeclado },
        });
      }
    } catch (error) {
      console.error('Error al procesar el botón:', error);
      await ctx.answerCallbackQuery({ text: 'Algo ha fallado, inténtalo otra vez' }).catch(() => {});
    }
  });
}

module.exports = registrarCallbacks;