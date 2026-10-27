const prisma = require('../db/prisma');

const UNA_HORA = 60 * 60 * 1000;
const UN_DIA = 24 * UNA_HORA;

function calcularAviso({ dateTime, notifyAt }) {
  const ahora = new Date();
  const evento = new Date(dateTime);

  const avisoPedido = notifyAt ? new Date(notifyAt) : new Date(evento.getTime() - UN_DIA);
  if (avisoPedido > ahora) {
    return avisoPedido;
  }

  const avisoUnaHoraAntes = new Date(evento.getTime() - UNA_HORA);
  if (avisoUnaHoraAntes > ahora) {
    return avisoUnaHoraAntes;
  }

  return null;
}

const FORMAS_DE_DECIR_YO = ['me', 'yo', 'mi', 'mí', 'para mi', 'para mí'];

function normalizarDestinatario(forWho) {
  const texto = (forWho || '').trim().toLowerCase();
  return texto === '' || FORMAS_DE_DECIR_YO.includes(texto) ? 'me' : forWho.trim();
}

async function crearTarea({ chatId, title, text, dateTime, notifyAt, createdBy, forWho }) {
  return await prisma.tarea.create({
    data: {
      chatId: BigInt(chatId),
      title,
      text,
      dateTime,
      notifyAt: calcularAviso({ dateTime, notifyAt }),
      createdBy: BigInt(createdBy),
      forWho: normalizarDestinatario(forWho),
    },
  });
}

async function listarTareas({ chatId, estado, periodo, anio, mes }) {
  const ahora = new Date();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioManana = new Date(inicioHoy);
  inicioManana.setDate(inicioManana.getDate() + 1);
  const diaSemana = ahora.getDay();
  const diasDesdeElLunes = diaSemana === 0 ? 6 : diaSemana - 1;
  const inicioSemana = new Date(inicioHoy);
  inicioSemana.setDate(inicioSemana.getDate() - diasDesdeElLunes);
  const inicioSemanaSiguiente = new Date(inicioSemana);
  inicioSemanaSiguiente.setDate(inicioSemanaSiguiente.getDate() + 7);
  const inicioMes = (anio && mes) ? new Date(anio, mes - 1, 1) : new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesSiguiente = (anio && mes) ? new Date(anio, mes, 1) : new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);

  const filtroWhere = { chatId: BigInt(chatId) };

  if (estado === 'pendientes') {
    filtroWhere.done = false;
  } else if (estado === 'completadas') {
    filtroWhere.done = true;
  }

  if (periodo === 'hoy') {
    filtroWhere.dateTime = { gte: inicioHoy, lt: inicioManana };
  } else if (periodo === 'semana') {
    filtroWhere.dateTime = { gte: inicioSemana, lt: inicioSemanaSiguiente };
  } else if (periodo === 'mes') {
    filtroWhere.dateTime = { gte: inicioMes, lt: inicioMesSiguiente };
  }

  return await prisma.tarea.findMany({
    where: filtroWhere,
    orderBy: { dateTime: 'asc' },
  });
}

async function buscarTareaDelChat({ id, chatId }) {
  return await prisma.tarea.findFirst({ where: { id, chatId: BigInt(chatId) } });
}

async function completarTarea({ id, chatId }) {
  const tarea = await buscarTareaDelChat({ id, chatId });
  if (!tarea) {
    return null;
  }
  const nuevoEstado = !tarea.done;

  return await prisma.tarea.update({
    where: { id },
    data: { done: nuevoEstado },
  });
};

async function eliminarTarea({ id, chatId }) {
  const tarea = await buscarTareaDelChat({ id, chatId });
  if (!tarea) {
    return null;
  }

  return await prisma.tarea.delete({ where: { id } });
};

async function buscarTareaPorTitulo({ chatId, title }){
  return await prisma.tarea.findMany({
    where: {chatId: BigInt(chatId), title: {contains:title, mode:'insensitive'}}
  });
};

async function obtenerTareasSinNotificar() {
  const ahora = new Date();

  return await prisma.tarea.findMany({
    where: {
      done: false,
      notified: false,
      notifyAt: {
        lte: ahora,
      },
    },
  });
 }

async function marcarNotificado({id}) {
  return await prisma.tarea.update({
    where: { id },
    data: { notified: true },
  });
}


module.exports = {
  crearTarea,
  listarTareas,
  completarTarea,
  eliminarTarea,
  buscarTareaPorTitulo,
  obtenerTareasSinNotificar,
  marcarNotificado,
};