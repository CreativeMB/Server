// Archivo: servidor.js

// Importamos las librerías necesarias
import express from "express";
import dotenv from "dotenv";

// Importamos nuestras funciones de lógica de negocio desde sus módulos separados
import { enviarCorreoDePedido } from "./src/servicios/enviarCorreo.js";
 import eliminarUsuario from "./src/servicios/eliminarUsuario.js";

// Cargamos las variables de entorno al inicio de todo.
dotenv.config();

// Creamos la aplicación Express
const app = express();

// --- MIDDLEWARES ---
// Middleware para que Express pueda entender y parsear cuerpos de petición en formato JSON
app.use(express.json());

// --- RUTAS DE LA API (ENDPOINTS) ---

// Endpoint para notificar un nuevo pedido por correo electrónico
app.post("/correo", async (req, res) => {
  const { titulo } = req.body;

  // 1. Validación de la entrada
  if (!titulo) {
    return res.status(400).json({ status: "error", mensaje: "El campo 'titulo' es requerido en el cuerpo de la petición." });
  }

  // 2. Delegación a la lógica de negocio
  const resultado = await enviarCorreoDePedido(titulo);

  // 3. Envío de la respuesta al cliente
  if (resultado.status === 'ok') {
    res.status(200).json(resultado);
  } else {
    // Si el servicio de correo falló, es un error del servidor.
    res.status(500).json(resultado);
  }
});

// Endpoint para eliminar un usuario de todos los servicios de Firebase
app.post("/eliminar-usuario", async (req, res) => {
  const { uid } = req.body;
  console.log(`🟡 Petición recibida en el endpoint /eliminar-usuario para el UID: ${uid}`);

  // 1. Validación de la entrada
  if (!uid) {
    return res.status(400).json({ status: "error", mensaje: "El campo 'uid' del usuario es requerido." });
  }

  // 2. Delegación a la lógica de negocio
  const resultado = await eliminarUsuario(uid);
  
  // 3. Envío de la respuesta al cliente con el código HTTP apropiado
  if (resultado.status === 'ok') {
    return res.status(200).json(resultado);
  }
  
  // Si el error es que el usuario no fue encontrado, usamos el código 404
  if (resultado.mensaje.includes("no existe")) {
    return res.status(404).json(resultado); // 404 Not Found
  }

  // Para cualquier otro error, es un fallo interno del servidor
  return res.status(500).json(resultado);
});

// --- INICIO DEL SERVIDOR ---

// Usamos el puerto que nos asigne el entorno (como Fly.io) o el 3001 si no hay ninguno definido.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo y escuchando peticiones en el puerto ${PORT}`);
});
