const parametrosUrl = new URLSearchParams(window.location.search);
const CHAT_ID = parametrosUrl.get('chatId');
const TOKEN = parametrosUrl.get('token');
const DIAS_SEMANA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const hoy = new Date();
let anio = hoy.getFullYear();
let mes = hoy.getMonth() + 1;

function mostrarAviso(texto) {
  const aviso = document.getElementById('aviso');
  aviso.textContent = texto;
  aviso.hidden = !texto;
}

function crearCelda(clase, texto) {
  const celda = document.createElement('div');
  celda.className = clase;
  if (texto !== undefined) {
    celda.textContent = texto;
  }
  return celda;
}

async function cargarCalendario() {
  if (!CHAT_ID || !TOKEN) {
    mostrarAviso('Enlace incompleto. Escribe /calendario al bot para obtener tu enlace.');
    return;
  }

  const nombreMes = new Date(anio, mes - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  document.getElementById('titulo-mes').textContent = nombreMes;

  let tareas;
  try {
    const respuesta = await fetch(`/api/tareas?chatId=${encodeURIComponent(CHAT_ID)}&token=${encodeURIComponent(TOKEN)}&anio=${anio}&mes=${mes}`);
    if (respuesta.status === 403) {
      mostrarAviso('Este enlace no es válido. Escribe /calendario al bot para obtener uno nuevo.');
      return;
    }
    if (!respuesta.ok) {
      throw new Error(`Respuesta ${respuesta.status}`);
    }
    tareas = await respuesta.json();
    mostrarAviso('');
  } catch (error) {
    console.error('Error al cargar las tareas:', error);
    mostrarAviso('No se han podido cargar las tareas. Se reintentará en unos segundos.');
    return;
  }

  const contenedor = document.getElementById('calendario');
  contenedor.innerHTML = '';

  DIAS_SEMANA.forEach((dia) => {
    contenedor.appendChild(crearCelda('dia-semana', dia));
  });

  const diaSemanaDelUno = new Date(anio, mes - 1, 1).getDay();
  const huecosAntesDelUno = diaSemanaDelUno === 0 ? 6 : diaSemanaDelUno - 1;
  for (let i = 0; i < huecosAntesDelUno; i++) {
    contenedor.appendChild(crearCelda('dia vacio'));
  }

  const diasEnMes = new Date(anio, mes, 0).getDate();
  const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const celda = crearCelda(esMesActual && dia === hoy.getDate() ? 'dia hoy' : 'dia');
    celda.appendChild(crearCelda('numero-dia', dia));

    const tareasDelDia = tareas.filter((tarea) => new Date(tarea.dateTime).getDate() === dia);

    tareasDelDia.forEach((tarea) => {
      celda.appendChild(crearCelda(tarea.done ? 'tarea hecha' : 'tarea', (tarea.done ? '✅ ' : '') + tarea.title));
    });

    contenedor.appendChild(celda);
  }
}

function cambiarMes(desplazamiento) {
  mes += desplazamiento;
  if (mes === 0) {
    mes = 12;
    anio--;
  } else if (mes === 13) {
    mes = 1;
    anio++;
  }
  cargarCalendario();
}

document.getElementById('mes-anterior').addEventListener('click', () => cambiarMes(-1));
document.getElementById('mes-siguiente').addEventListener('click', () => cambiarMes(1));

cargarCalendario();
setInterval(cargarCalendario, 15000);
