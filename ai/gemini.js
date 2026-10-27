const { GoogleGenAI } = require('@google/genai');
const { ZONA_HORARIA } = require('../utils/fechas');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MAX_INTENTOS = 3;
const ESPERA_ENTRE_INTENTOS_MS = 2000;

const declaracionCrearTarea = {
    name: 'crearTarea',
    description: 'Crear una nueva tarea o evento con fecha y hora',
    parameters: {
        type: 'object',
        properties: {
            title: {type: 'string', description: 'Título breve de la tarea'},
            text: {type: 'string', description: 'Breve descripción de la tarea'},
            notifyAt: {type: 'string', description: 'Fecha y hora exacta en formato ISO 8601 en la que se debe enviar la notificación/recordatorio. Si el usuario pide antelación (ej: "avísame 1 hora antes"), calcula esta fecha restando ese tiempo a dateTime. Si no especifica antelación, por defecto debe ser exactamente 24 horas antes de dateTime.'},            
            dateTime: { type: 'string', description: 'Fecha y hora en formato ISO 8601. Si el usuario no indica ni fecha ni hora, usa la fecha y hora actuales; nunca inventes otro día.'},
            forWho: {type: 'string', description: 'Nombre o @usuario de la persona que debe realizar la tarea (ej: "Fran", "@fran", "me" si se refiere al propio usuario que escribe)'},
        },
        required: ['title', 'dateTime', 'forWho']
    },
}

const declaracionListarTareas = {
    name: 'listarTareas',
    description: 'Listar las tareas del chat, opcionalmente filtradas por estado y periodo',
    parameters: {
        type: 'object',
        properties: {
            estado: {type: 'string', description: 'Filtrar por estado. Omitir para mostrar todas', enum: ['completadas', 'pendientes']},
            periodo: {type: 'string', description: 'Filtrar por periodo: hoy, esta semana o este mes. Omitir para mostrar todas las fechas', enum: ['hoy', 'semana', 'mes']},
        },
    },
}

const declaracionCompletarTarea = {
    name: 'completarTarea',
    description: 'Marcar una tarea como completada, o volver a dejarla pendiente',
    parameters: {
        type: 'object',
        properties: {
            title: {type: 'string', description: 'Título (o parte del título) de la tarea'},
        },
        required: ['title'],
    },
}

const declaracionEliminarTarea = {
    name: 'eliminarTarea',
    description: 'Eliminar una tarea o evento',
    parameters: {
        type: 'object',
        properties: {
            title: {type: 'string', description: 'Título (o parte del título) de la tarea'},
        },
        required: ['title'],
    },
}

const tools = [
    {
        functionDeclarations: [declaracionCrearTarea, declaracionListarTareas, declaracionCompletarTarea, declaracionEliminarTarea]
    }
]

function construirInstrucciones() {
    const ahora = new Date();
    const fechaLocal = ahora.toLocaleString('es-ES', { timeZone: ZONA_HORARIA, dateStyle: 'full', timeStyle: 'short' });
    const desfase = new Intl.DateTimeFormat('en-US', { timeZone: ZONA_HORARIA, timeZoneName: 'longOffset' })
        .formatToParts(ahora)
        .find((parte) => parte.type === 'timeZoneName')
        .value
        .replace('GMT', '');

    return `Eres el asistente de organización de una familia que vive en España.
Ahora mismo es ${fechaLocal} en España (zona horaria ${ZONA_HORARIA}, desfase actual ${desfase}).
Interpreta todas las fechas y horas que diga el usuario como hora de España.
Devuelve siempre dateTime y notifyAt en formato ISO 8601 con el desfase incluido, por ejemplo 2026-10-18T10:00:00${desfase}.
Ten en cuenta el cambio de hora: España usa +02:00 desde el último domingo de marzo hasta el último domingo de octubre, y +01:00 el resto del año. Usa el desfase que corresponda a la fecha del evento, no el de hoy.`;
}

function esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function procesarMensaje(textoUsuario) {
    for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.5-flash-lite',
                contents: textoUsuario,
                config: {
                    systemInstruction: construirInstrucciones(),
                    tools: tools,
                },
            });
            return response.functionCalls;
        } catch (error) {
            const esSaturacion = error.status === 503;
            if (!esSaturacion || intento === MAX_INTENTOS) {
                throw error;
            }
            console.warn(`Gemini saturado (503), reintento ${intento + 1} de ${MAX_INTENTOS}...`);
            await esperar(ESPERA_ENTRE_INTENTOS_MS * intento);
        }
    }
}

module.exports = { procesarMensaje}