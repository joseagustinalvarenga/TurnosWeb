import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Crear transportador de email con Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Verificar que las credenciales estén configuradas
if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.warn('⚠️  SMTP_USER o SMTP_PASSWORD no están configurados en .env');
}

// Enviar email de confirmación de cita
export async function sendAppointmentConfirmation({
  to,
  patientName,
  doctorName,
  doctorSpecialty,
  appointmentDate,
  appointmentTime,
  reason,
  confirmUrl
}) {
  try {
    // Si no hay email del paciente, omitir sin error
    if (!to) {
      console.log('⚠️  Paciente sin email, se omite envío');
      return { sent: false, reason: 'No email' };
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            color: #2563eb;
            font-size: 24px;
          }
          .content {
            margin: 20px 0;
          }
          .appointment-details {
            background-color: #f9fafb;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .detail-row {
            display: flex;
            margin: 10px 0;
          }
          .detail-label {
            font-weight: 600;
            width: 120px;
            color: #555;
          }
          .detail-value {
            flex: 1;
            color: #333;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
            font-weight: 600;
            text-align: center;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .footer {
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Tu Cita ha sido Programada</h1>
          </div>

          <div class="content">
            <p>Hola <strong>${patientName}</strong>,</p>
            <p>Tu cita médica ha sido programada exitosamente. Aquí están los detalles:</p>

            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">👨‍⚕️ Doctor:</span>
                <span class="detail-value">${doctorName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🏥 Especialidad:</span>
                <span class="detail-value">${doctorSpecialty || 'General'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Fecha:</span>
                <span class="detail-value">${new Date(appointmentDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Hora:</span>
                <span class="detail-value">${appointmentTime}</span>
              </div>
              ${reason ? `
              <div class="detail-row">
                <span class="detail-label">📝 Motivo:</span>
                <span class="detail-value">${reason}</span>
              </div>
              ` : ''}
            </div>

            <p>Para ver más detalles de tu cita, haz clic en el botón de abajo:</p>
            <a href="${confirmUrl}" class="button">Ver Mi Cita</a>

            <p style="margin-top: 30px;">Si tienes preguntas o necesitas reprogramar tu cita, por favor contacta con la clínica.</p>
          </div>

          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este correo.</p>
            <p>&copy; 2026 Sistema de Gestión de Citas Médicas. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('📧 Enviando email a:', to);

    const info = await transporter.sendMail({
      from: `"MediHub - Sistema de Citas" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `Cita Confirmada - ${doctorName}`,
      html: htmlContent
    });

    console.log('✓ Email enviado:', info.messageId);
    return { sent: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    // No lanzar error para no romper el flujo de creación de cita
    return { sent: false, error: error.message };
  }
}
