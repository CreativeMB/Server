// Archivo: enviarCorreo.js

import nodemailer from 'nodemailer';

// Función de utilidad para sanitizar la entrada de texto y prevenir ataques XSS.
// Si el string es nulo o indefinido, devuelve una cadena vacía.
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&',
      '<': '<',
      '>': '>',
      '"': '"'
    }[tag] || tag)
  );
}

// ---- CONFIGURACIÓN DEL TRANSPORTER DE NODEMAILER ----
// Se crea una sola vez y se reutiliza para todos los correos.
// Lee la configuración directamente de las variables de entorno (Secrets de Fly.io).
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: process.env.BREVO_PORT || 587, // Puerto 587 por defecto si no se especifica.
  secure: String(process.env.BREVO_PORT) === '465', // 'secure' es true solo si el puerto es 465.
  auth: {
    user: process.env.BREVO_USER, // Usuario de login de Brevo.
    pass: process.env.BREVO_PASS, // Clave API SMTP de Brevo.
  },
});

/**
 * Prepara y envía un correo electrónico de notificación para un nuevo pedido.
 *
 * @param {string} rawTitulo - El título del pedido tal como llega en la petición.
 * @returns {Promise<{status: string, mensaje: string}>} Un objeto indicando el resultado del envío.
 */
export async function enviarCorreoDePedido(rawTitulo) {
  // Sanitizamos el título para usarlo de forma segura en el correo.
  const titulo = escapeHTML(rawTitulo || 'Sin título');
console.log("📨 Enviando a:", process.env.MAIL_TO);
  // Opciones del correo electrónico.
  const mailOptions = {
    from: `"Pedidos FullTV" <${process.env.MAIL_FROM}>`, // Remitente verificado en Brevo.
    to: process.env.MAIL_TO,       
  
    subject: `🎬 Nuevo Pedido Registrado: ${titulo}`,       // Asunto del correo.
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #333; font-size: 24px;">🔔 Activación Pendiente</h1>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Hola,
          </p>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Se ha registrado un nuevo pedido en el sistema y requiere tu atención.
          </p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 18px;">
            <strong style="color: #333;">🎬 Título de la Película:</strong>
            <span style="color: #0056b3;">${titulo}</span>
          </div>
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Por favor, accede al panel de administración de <strong>FullTV</strong> para verificar y activar la película.
          </p>
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #999;">
          <p>Este es un correo generado automáticamente. No es necesario responder.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de notificación enviado exitosamente. Message ID: ${info.messageId}`);
    return { status: "ok", mensaje: `Notificación para el pedido '${titulo}' enviada correctamente.` };
  } catch (error) {
    console.error("❌ Error crítico al enviar el correo de notificación:", error);
    // Devolvemos un mensaje de error genérico para no exponer detalles.
    return { status: "error", mensaje: "El servicio de envío de correos no está disponible en este momento." };
  }
}
