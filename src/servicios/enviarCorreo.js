// Archivo: enviarCorreo.js
import nodemailer from 'nodemailer';

// Función de utilidad para sanitizar la entrada y prevenir XSS
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&',
      '<': '<',
      '>': '>',
      "'": ''',
      '"': '"'
    }[tag] || tag)
  );
}

// Creamos el transporter una sola vez y lo reutilizamos.
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: process.env.BREVO_PORT || 587,
  secure: process.env.BREVO_PORT === '465', // true para puerto 465, false para otros
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

/**
 * Envía un correo de notificación de nuevo pedido.
 * @param {string} rawTitulo - El título del pedido sin sanitizar.
 * @returns {Promise<{status: string, mensaje: string}>} Resultado del envío.
 */
export async function enviarCorreoDePedido(rawTitulo) {
  const titulo = escapeHTML(rawTitulo || 'Sin título');

  const mailOptions = {
    from: `"Pedidos FullTV" <${process.env.MAIL_FROM}>`,
    to: process.env.MAIL_TO,
    subject: `🎬 Nuevo Pedido: ${titulo}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
        <h2 style="color: #0056b3;">🔔 Activación Pendiente</h2>
        <p>Se ha registrado un nuevo pedido en el sistema.</p>
        <p style="font-size: 1.1em;"><strong>🎬 Título:</strong> ${titulo}</p>
        <hr style="border: 0; border-top: 1px solid #eee;">
        <p>Por favor, verifica y activa la película en el panel de administración de FullTV.</p>
        <p style="font-size: 0.9em; color: #777; text-align: center; margin-top: 20px;">Este es un correo automático. No responder.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Correo de notificación enviado:", info.response);
    return { status: "ok", mensaje: `Notificación para '${titulo}' enviada.` };
  } catch (error) {
    console.error("❌ Error al enviar el correo de notificación:", error);
    return { status: "error", mensaje: "Falló el servicio de envío de correos." };
  }
}
