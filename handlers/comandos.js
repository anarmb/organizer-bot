const { crearTarea, listarTareas, completarTarea, buscarTareaPorTitulo, eliminarTarea } = require('../services/tareas.js');
const { procesarMensaje } = require('../ai/gemini.js');
const { formatearFecha } = require('../utils/fechas.js');
const { firmarChatId } = require('../utils/firma.js');
const { construirTecladoDeTareas } = require('./teclado.js');

const URL_WEB = process.env.WEB_URL || `http://localhost:${process.env.PORT || 3000}`;
const MENSAJE_NO_ENTENDI = 'No entendí eso, ¿puedes decirme algo para lo que esté programado? \nPuedo crear tareas, listar, marcar como completadas o pendientes y eliminar';

async function responderConLista(ctx, tareas) {
  if (tareas.length === 0) {
    await ctx.reply('No hay tareas que coincidan 🎉');
    return;
  }

  await ctx.reply(`Listado de tareas:\n`, {
    reply_markup: construirTecladoDeTareas(tareas),
  });
}

async function manejarCoincidencias(ctx, coincidencias, accion) {
  if (coincidencias.length === 0) {
    await ctx.reply('Esta tarea no está apuntada');
    return;
  }

  if (coincidencias.length === 1) {
    const tarea = coincidencias[0];

    if (accion === 'completar') {
      const tareaActualizada = await completarTarea({ id: tarea.id, chatId: ctx.chat.id });
      await ctx.reply(`${tareaActualizada.title} marcada como ${tareaActualizada.done ? 'completada ✅' : 'pendiente'}`);
    } else if (accion === 'eliminar') {
      const tareaEliminada = await eliminarTarea({ id: tarea.id, chatId: ctx.chat.id });
      await ctx.reply(`${tareaEliminada.title} eliminada 🗑️`);
    }
    return;
  }

  await ctx.reply(`Elige la tarea correcta:\n`, {
    reply_markup: construirTecladoDeTareas(coincidencias),
  });
}

async function procesarLlamada(ctx, llamada) {
  switch (llamada.name) {
    case 'crearTarea': {
      const nuevaTarea = await crearTarea({
        ...llamada.args,
        chatId: ctx.chat.id,
        createdBy: ctx.message.from.id,
      });

      await ctx.reply(`He añadido ${nuevaTarea.title} para el ${formatearFecha(nuevaTarea.dateTime)}`);
      break;
    }

    case 'listarTareas': {
      const nuevaLista = await listarTareas({
        ...llamada.args,
        chatId: ctx.chat.id,
      });

      await responderConLista(ctx, nuevaLista);
      break;
    }

    case 'completarTarea':
    case 'eliminarTarea': {
      const coincidencias = await buscarTareaPorTitulo({
        chatId: ctx.chat.id, title: llamada.args.title
      });
      const accion = llamada.name === 'completarTarea' ? 'completar' : 'eliminar';

      await manejarCoincidencias(ctx, coincidencias, accion);
      break;
    }

    default:
      await ctx.reply(MENSAJE_NO_ENTENDI);
  }
}

function registrarComandos(bot) {
  bot.command('lista', async (ctx) => {
    const partes = ctx.message.text.split(' ');
    const estado = partes[1];
    const periodo = partes[2];

    try {
      const tareas = await listarTareas({
        chatId: ctx.chat.id,
        estado,
        periodo,
      });

      await responderConLista(ctx, tareas);
    } catch (error) {
      console.error('Error en /lista:', error);
      await ctx.reply('Algo ha fallado al listar las tareas, inténtalo otra vez').catch(() => {});
    }
  });

  bot.command('calendario', async (ctx) => {
    try {
      const enlace = `${URL_WEB}/calendario.html?chatId=${ctx.chat.id}&token=${firmarChatId(ctx.chat.id)}`;
      await ctx.reply(`📅 Calendario de este chat:\n${enlace}`);
    } catch (error) {
      console.error('Error en /calendario:', error);
      await ctx.reply('No he podido generar el enlace del calendario, inténtalo otra vez').catch(() => {});
    }
  });

  bot.on('message', async (ctx) => {
    if (!ctx.message.text) {
      await ctx.reply('De momento solo entiendo mensajes de texto 🙂').catch(() => {});
      return;
    }

    let llamadas;
    try {
      llamadas = await procesarMensaje(ctx.message.text);
    } catch (error) {
      console.error('Error al consultar a Gemini:', error);
      await ctx.reply('Ups, algo ha fallado. Inténtalo otra vez en un momento').catch(() => {});
      return;
    }

    if (!llamadas || llamadas.length === 0) {
      await ctx.reply(MENSAJE_NO_ENTENDI).catch(() => {});
      return;
    }

    for (const llamada of llamadas) {
      try {
        await procesarLlamada(ctx, llamada);
      } catch (error) {
        console.error(`Error al procesar ${llamada.name}:`, error);
        await ctx.reply('Ups, algo ha fallado con una de las acciones. Inténtalo otra vez').catch(() => {});
      }
    }
  });
}

module.exports = registrarComandos;
