// Archivo: servidor.js
import express from "express";
import dotenv from "dotenv";

// Importamos la lógica de negocio desde nuestros módulos
import { enviarCorreoDePedido } from "./enviarCorreo.js";
import eliminarUsuario from "./eliminarUsuario.js";

// Cargar variables de entorno. Es importante que esté al principio.
dotenv.config();

const app = express();

// Middlewares
app.use(express.json()); // Para parsear cuerpos de petición en formato JSON
app.use(express.urlencoded({ extended: true })); // Para parsear cuerpos de formularios

// --- ENDPOINTS DE LA API ---

// Endpoint para notificar un nuevo pedido por correo
app.post("/correo", async (req, res) => {
  const { titulo } = req.body;

  if (!titulo) {
    return res.status(400).json({ status: "error", mensaje: "El campo 'titulo' es requerido." });
  }

  const resultado = await enviarCorreoDePedido(titulo);

  if (resultado.status === 'ok') {
    res.status(200).json(resultado);
  } else {
    // Si el servicio de correo falló, es un error del servidor.
    res.status(502).json(resultado); // 502 Bad Gateway es apropiado si un servicio externo falla.
  }
});

// Endpoint para eliminar un usuario de todos los servicios
app.post("/eliminar-usuario", async (req, res) => {
  const { uid } = req.body;
  console.log(`🟡 Petición recibida para eliminar usuario: ${uid}`);

  if (!uid) {
    return res.status(400).json({ status: "error", mensaje: "El UID del usuario es requerido." });
  }

  const resultado = await eliminarUsuario(uid);
  
  if (resultado.status === 'ok') {
    return res.status(200).json(resultado);
  }
  
  // Determinar el código de estado HTTP correcto basado en el error
  if (resultado.mensaje.includes("no existe")) {
    return res.status(404).json(resultado); // 404 Not Found
  }

  // Para cualquier otro error, es un error interno del servidor
  return res.status(500).json(resultado);
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
