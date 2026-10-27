# Bot de organización familiar

Bot de Telegram para organizar tareas a nivel individual o grupal. Se le habla en lenguaje natural ("recuérdame que mañana a las 10 tengo dentista", "¿qué tengo esta semana?") y un asistente de IA (Google Gemini) decide qué hacer. Incluye recordatorios automáticos y un calendario web que se actualiza solo.

## Funcionalidades

En lenguaje natural, podemos: 

- **Crear tareas.** Entiende fechas relativas ("mañana", "el viernes", "dentro de 2 horas") y para quién es la tarea ("para Fran", "para mí"). Se pueden pedir varias en un mismo mensaje.
- **Listar tareas** ordenadas por fecha, filtrando por estado (pendientes / completadas) y periodo (hoy / semana / mes), con botones para completarlas o borrarlas.
- **Completar y eliminar** por nombre. Si hay varias tareas parecidas, el bot pregunta cuál con botones.
- **Recordatorios automáticos** por Telegram: por defecto 24 h antes, o con la antelación que se pida ("avísame 1 hora antes"). Si la tarea es para dentro de menos de 24 h, avisa 1 h antes.
- **Calendario web** mensual de solo lectura, con navegación entre meses y actualización automática cada 15 segundos.

## Cómo funciona

```
Telegram ──► handlers/comandos.js ──► ai/gemini.js ──► Gemini (function calling)
                    │                                        │
                    │      ◄──── nombre de la función + argumentos
                    ▼
            services/tareas.js ──► Prisma ──► PostgreSQL
                    ▲
web/server.js (/api/tareas) ◄── calendario web (polling cada 15 s)
services/notificaciones.js (cada minuto) ──► recordatorios por Telegram
```

La decisión de diseño principal es que **Gemini solo decide qué función llamar y con qué argumentos; el código propio la ejecuta y la valida**. Así la IA nunca toca la base de datos directamente, y reglas como el cálculo del aviso o la normalización de datos quedan en el código, donde se pueden probar.

Otros detalles:

- Gemini no conoce los ids de la base de datos, así que completar y eliminar buscan la tarea por título. Con 0 coincidencias se avisa, con 1 se actúa y con varias se muestran botones para elegir.
- Gemini no sabe la fecha actual: se le pasa en las instrucciones del sistema junto con la zona horaria (`Europe/Madrid`), y devuelve las fechas en ISO 8601 con desfase horario.
- Los errores se capturan en cada handler, y ante errores 503 de Gemini (servicio saturado) se reintenta hasta 3 veces.
- El calendario está protegido con enlaces firmados: el bot genera un token HMAC-SHA256 del `chatId` con una clave secreta, y la API rechaza (403) cualquier petición cuyo token no coincida. Sin el enlace del bot no se pueden ver las tareas de un chat, aunque se conozca su `chatId`.

## Tecnologías

- **Node.js 20** (CommonJS)
- **Telegram:** `node-telegram-bot-api` v2
- **IA:** Google Gemini con `@google/genai` (function calling)
- **Base de datos:** PostgreSQL (Neon) con Prisma 5
- **Web:** Express + HTML, CSS y JavaScript sin frameworks

## Estructura del proyecto

```
index.js                     Arranque: bot, servidor web y recordatorios
ai/gemini.js                 Declaraciones de funciones e instrucciones para Gemini
handlers/comandos.js         Comandos y mensajes en lenguaje natural
handlers/callbacks.js        Botones inline (completar / eliminar)
handlers/teclado.js          Construcción de los botones de tareas
services/tareas.js           Lógica de negocio de las tareas
services/notificaciones.js   Envío periódico de recordatorios
utils/fechas.js              Zona horaria y formateo de fechas
utils/firma.js               Firma y validación de los enlaces del calendario
db/prisma.js                 Cliente de Prisma compartido
prisma/schema.prisma         Modelo de datos
web/server.js                Servidor Express y API del calendario
web/public/                  Calendario web (HTML, CSS, JS)
```

## Instalación

Necesitas Node.js 20, una base de datos PostgreSQL (por ejemplo, gratis en [Neon](https://neon.tech)), un bot de Telegram creado con [@BotFather](https://t.me/BotFather) y una clave de la [API de Gemini](https://aistudio.google.com/).

1. Clona el repositorio e instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env` en la raíz con estas variables:

   ```
   TELEGRAM_TOKEN=token_de_tu_bot
   GEMINI_API_KEY=tu_clave_de_gemini
   DATABASE_URL=url_de_conexion_a_postgresql
   WEB_URL=http://localhost:3000
   GEN_FIRMA=clave_secreta_aleatoria
   ```

   `WEB_URL` es la dirección pública del calendario; se usa para el enlace del comando `/calendario`. `GEN_FIRMA` es la clave con la que se firman los enlaces del calendario; genérala con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. `PORT` es opcional (por defecto, 3000).

3. Crea las tablas en la base de datos:

   ```bash
   npx prisma migrate deploy
   ```

4. Arranca el bot:

   ```bash
   npm start
   ```

## Uso

Escribe al bot en lenguaje natural, por ejemplo:

- "Dentista mañana a las 10"
- "Recoger a los niños el viernes a las 17:00, para Fran, avísame 1 hora antes"
- "¿Qué tareas tengo esta semana?"
- "Ya he hecho lo del dentista"
- "Borra la tarea de comprar leche"

Comandos:

- `/lista [pendientes|completadas] [hoy|semana|mes]`: lista las tareas con botones.
- `/calendario`: devuelve el enlace al calendario web de ese chat.

## Próximos pasos

- Despliegue en Railway o Render
- Editar tareas y tareas recurrentes
- Eliminar todas las tareas con confirmación
