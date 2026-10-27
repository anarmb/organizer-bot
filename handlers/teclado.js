const { InlineKeyboardBuilder } = require('node-telegram-bot-api');
const { formatearFechaCorta } = require('../utils/fechas.js');

function textoBotonTarea(tarea) {
  const emoji = tarea.done ? '✅' : ' ';
  return `${emoji} ${tarea.title} · ${formatearFechaCorta(tarea.dateTime)}`;
}

function construirTecladoDeTareas(tareas) {
  const teclado = new InlineKeyboardBuilder();

  tareas.forEach((tarea) => {
    teclado.text(textoBotonTarea(tarea), `completar:${tarea.id}`);
    teclado.text('🗑️', `eliminar:${tarea.id}`);
    teclado.row();
  });

  return teclado.build();
}

module.exports = { textoBotonTarea, construirTecladoDeTareas };
