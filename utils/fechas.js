const ZONA_HORARIA = 'Europe/Madrid';

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleString('es-ES', {
    timeZone: ZONA_HORARIA,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatearFechaCorta(fecha) {
  return new Date(fecha).toLocaleString('es-ES', {
    timeZone: ZONA_HORARIA,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

module.exports = { ZONA_HORARIA, formatearFecha, formatearFechaCorta };
