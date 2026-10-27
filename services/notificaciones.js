const { obtenerTareasSinNotificar, marcarNotificado } = require('./tareas.js');
const { formatearFecha } = require('../utils/fechas.js');

async function comprobarYEnviarRecordatorios(bot) {
    let tareasSinNotificar;

    try {
        tareasSinNotificar = await obtenerTareasSinNotificar();
    } catch (error) {
        console.error('Error al buscar tareas sin notificar:', error);
        return;
    }

    for (const tarea of tareasSinNotificar) {
        try {
            const mencion = tarea.forWho && tarea.forWho !== 'me' ? ` para ${tarea.forWho}` : '';
            const mensaje = `⏰ RECORDATORIO${mencion}:\n📌 ${tarea.title}\n🕐 ${formatearFecha(tarea.dateTime)}`;

            await bot.api.sendMessage({
                chat_id: Number(tarea.chatId),
                text: mensaje,
            });
            await marcarNotificado({ id: tarea.id });
        } catch (error) {
            console.error(`Error al notificar la tarea ${tarea.id}:`, error);
        }
    }
}

function cronNotificaciones(bot) {
    setInterval(() => {
        comprobarYEnviarRecordatorios(bot)
    }, 60000);
}

module.exports = { cronNotificaciones };