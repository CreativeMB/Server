// Archivo: servidor.js
import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Importamos nuestra función de lógica de negocio
import eliminarUsuario from "./eliminarUsuario.js";

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const app = express();
app.use(express.json()); // Middleware para parsear JSON

// Función para escapar caracteres HTML y prevenir ataques XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&',
      '<': '<',
      '>': '>',
      "'": ''',
      '"': '"'
    }[tag] || tag)
  );
}

// ------------------ TRANSPORTER DE NODEMAILER ------------------
const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com", // o el host de Brevo que uses
  port: 587,
  secure: false, // true para puerto 465, false para otros
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

// ------------------ ENDPOINT PARA NOTIFICAR PEDIDO ------------------
app.post("/correo", async (req, res) => {
  // Validamos que el título venga en el body
  if (!req.body.titulo) {
    return res.status(400).json({ status: "error", mensaje: "El campo 'titulo' es requerido." });
  }

  const titulo = escapeHTML(req.body.titulo);

  const mailOptions = {
    from: '"Pedidos FullTV" <fulltvurl@gmail.com>',
    to: "fulltvurl@gmail.com",
    subject: `🎬 Nuevo Pedido: ${titulo}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2>🔔 Activación Pendiente</h2>
        <p>Se ha registrado un nuevo pedido en el sistema.</p>
        <p><strong>🎬 Título:</strong> ${titulo}</p>
        <hr>
        <p>Por favor, verifica y activa la película en el panel de FullTV.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Correo de notificación enviado:", info.response);
    res.status(200).json({ status: "ok", mensaje: `Correo enviado con el título: ${titulo}` });
  } catch (err) {
    console.error("❌ Error al enviar el correo:", err);
    res.status(500).json({ status: "error", mensaje: "Falló el envío del correo de notificación." });
  }
});

// ------------------ ENDPOINT PARA ELIMINAR USUARIO ------------------
app.post("/eliminar-usuario", async (req, res) => {
  const { uid } = req.body;
  console.log(`🟡 Petición recibida para eliminar usuario: ${uid}`);

  if (!uid) {
    console.error("🔴 UID faltante en la petición.");
    return res.status(400).json({ status: "error", mensaje: "El UID del usuario es requerido." });
  }

  try {
    // Llamamos a nuestra función de lógica de negocio
    const resultado = await eliminarUsuario(uid);
    
    if (resultado.status === 'ok') {
      console.log(`✅ Usuario ${uid} eliminado exitosamente.`);
      res.status(200).json(resultado);
    } else {
      console.error(`🟠 Fallo controlado al eliminar ${uid}: ${resultado.mensaje}`);
      // Si el error fue que no se encontró, es un 404. Si no, un 500.
      const statusCode = resultado.mensaje.includes("no existe") ? 404 : 500;
      res.status(statusCode).json(resultado);
    }
  } catch (e) {
    console.error(`🔥 Error crítico eliminando usuario ${uid}:`, e);
    res.status(500).json({ status: "error", mensaje: "Ocurrió un error inesperado en el servidor." });
  }
});

// ------------------ INICIAR SERVIDOR ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
