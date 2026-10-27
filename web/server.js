const express = require('express');
const { listarTareas } = require('../services/tareas.js');
const { validarToken } = require('../utils/firma.js');

function iniciarServidor() {
  const app = express();
  const puerto = process.env.PORT || 3000;

  app.use(express.static(__dirname + '/public'));

  app.get('/', (req, res) => {
    res.send('CALENDARIO: escribe /calendario al bot para obtener tu enlace');
  });

  app.get('/api/tareas', async (req, res) => {
    const { chatId, token, anio, mes } = req.query;

    if (!/^-?\d+$/.test(chatId || '')) {
      return res.status(400).json({ error: 'Falta un chatId válido' });
    }

    if (!validarToken(chatId, token)) {
      return res.status(403).json({ error: 'Enlace no válido' });
    }

    const tareas = await listarTareas({
      chatId,
      periodo: 'mes',
      anio: Number(anio),
      mes: Number(mes),
    });

    const tareasSerializables = tareas.map((tarea) => ({
      ...tarea,
      chatId: tarea.chatId.toString(),
      createdBy: tarea.createdBy.toString(),
    }));

    res.json(tareasSerializables);
  });

  app.listen(puerto, () => {
    console.log(`Servidor escuchando en el puerto ${puerto}`);
  });
}

module.exports = iniciarServidor;