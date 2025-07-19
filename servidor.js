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
  const { email } = req.body;
  console.log(`🟡 Petición recibida en el endpoint /eliminar-usuario para el correo: ${email}`);

  // 1. Validación de la entrada
  if (!email) {
    return res.status(400).json({
      status: "error",
      mensaje: "El campo 'email' del usuario es requerido."
    });
  }

  try {
    // 2. Delegación a la lógica de negocio
    const resultado = await eliminarUsuario(email);

    // 3. Envío de la respuesta al cliente con el código HTTP apropiado
    if (resultado.status === "ok") {
      return res.status(200).json(resultado); // 200 OK
    }

    if (resultado.mensaje.includes("no existe")) {
      return res.status(404).json(resultado); // 404 Not Found
    }

    return res.status(500).json(resultado); // 500 Internal Server Error
  } catch (error) {
    console.error("❌ Error inesperado en el endpoint /eliminar-usuario:", error);
    return res.status(500).json({
      status: "error",
      mensaje: "❌ Error interno del servidor."
    });
  }
});

// --- INICIO DEL SERVIDOR ---

// Usamos el puerto que nos asigne el entorno (como Fly.io) o el 3001 si no hay ninguno definido.
const PORT = process.env.PORT || 8080;

// FORMA CORRECTA Y ROBUSTA (para Fly.io, Docker, etc.)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor listo y escuchando en el puerto ${PORT}.`);
  console.log(`✅ Aceptando conexiones desde todas las interfaces.`);
});
