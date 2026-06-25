const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    const user = String(process.env.EMAIL_USER || '').trim();
    // Google muestra la app password con espacios en bloques de 4; los removemos.
    const pass = String(process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');
    const smtpHost = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpSecure = String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user,
        pass
      },
      tls: {
        minVersion: 'TLSv1.2'
      }
    });

    this.emailUser = user;
  }

  async enviarComprobanteCliente({ correo, pdfBase64, nombreArchivo, comprobante = {} }) {
    const pedidoCodigo = comprobante.pedidoCodigo || 'N/A';
    const tipo = comprobante.tipo || 'COMPROBANTE';
    const documento = comprobante.documento || 'N/A';
    const fechaEmision = comprobante.fechaEmision
      ? new Date(comprobante.fechaEmision).toLocaleString('es-PE')
      : new Date().toLocaleString('es-PE');

    const mailOptions = {
      from: `"Goldfish Sushi" <${this.emailUser}>`,
      to: correo,
      subject: `${tipo} electrónica - Pedido ${pedidoCodigo}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 24px; }
            .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 28px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
            .title { color: #FF6B35; margin: 0 0 8px; }
            .subtitle { margin: 0 0 20px; color: #444; }
            .box { background: #fff7f3; border-left: 4px solid #FF6B35; padding: 14px; margin: 18px 0; }
            .muted { color: #666; font-size: 14px; }
            .footer { margin-top: 24px; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="title">Comprobante electrónico de tu pedido</h2>
            <p class="subtitle">Adjuntamos el PDF del comprobante solicitado en Goldfish Sushi.</p>

            <div class="box">
              <div><strong>Pedido:</strong> ${pedidoCodigo}</div>
              <div><strong>Tipo:</strong> ${tipo}</div>
              <div><strong>Documento:</strong> ${documento}</div>
              <div><strong>Fecha de emisión:</strong> ${fechaEmision}</div>
            </div>

            <p class="muted">Si no reconoces esta solicitud, ignora este mensaje.</p>

            <div class="footer">
              Este es un correo automático de Goldfish Sushi.
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Comprobante electrónico\n\nPedido: ${pedidoCodigo}\nTipo: ${tipo}\nDocumento: ${documento}\nFecha de emisión: ${fechaEmision}\n\nAdjunto encontrarás tu comprobante en PDF.`,
      attachments: [
        {
          filename: nombreArchivo || `comprobante-${pedidoCodigo}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf'
        }
      ]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Comprobante enviado por email:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const mensaje = this.formatearErrorEmail(error);
      console.error('❌ Error enviando comprobante por email:', mensaje);
      return { success: false, error: mensaje };
    }
  }

  async enviarCodigoSeguridad(email, token, accion, datos = {}) {
    const accionTexto = this.obtenerTextoAccion(accion, datos);
    
    const mailOptions = {
      from: `"Sistema Goldfish" <${this.emailUser}>`,
      to: email,
      subject: '🔐 Código de Seguridad - Goldfish Admin',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
            .container { background-color: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; color: #FF6B35; margin-bottom: 30px; }
            .token-box { background-color: #f8f9fa; border: 2px dashed #FF6B35; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }
            .token { font-size: 32px; font-weight: bold; color: #FF6B35; letter-spacing: 5px; font-family: 'Courier New', monospace; }
            .info { color: #555; line-height: 1.6; margin: 15px 0; }
            .action { background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF6B35; margin: 20px 0; }
            .warning { color: #d32f2f; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍣 Goldfish Admin</h1>
              <h2>Código de Seguridad</h2>
            </div>
            
            <p class="info">Se ha solicitado un código de seguridad para realizar la siguiente acción:</p>
            
            <div class="action">
              <strong>Acción solicitada:</strong><br>
              ${accionTexto}
            </div>
            
            <p class="info">Tu código de seguridad es:</p>
            
            <div class="token-box">
              <div class="token">${token}</div>
            </div>
            
            <p class="info">
              ⏱️ Este código es válido por <strong>10 minutos</strong>.<br>
              🔒 No compartas este código con nadie.<br>
              📱 Ingresa este código en la aplicación admin para confirmar la operación.
            </p>
            
            <div class="warning">
              ⚠️ Si no solicitaste este código, ignora este mensaje. Tu cuenta permanece segura.
            </div>
            
            <div class="footer">
              <p>Este es un correo automático del Sistema Goldfish</p>
              <p>© ${new Date().getFullYear()} Goldfish Sushi Bar - Sistema de Gestión</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        GOLDFISH ADMIN - CÓDIGO DE SEGURIDAD
        
        Acción solicitada: ${accionTexto}
        
        Tu código de seguridad es: ${token}
        
        Este código es válido por 10 minutos.
        No compartas este código con nadie.
        
        Si no solicitaste este código, ignora este mensaje.
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const mensaje = this.formatearErrorEmail(error);
      console.error('❌ Error enviando email:', mensaje);
      return { success: false, error: mensaje };
    }
  }

  formatearErrorEmail(error) {
    const raw = String(error?.message || error || 'Error de email desconocido');
    if (/Invalid login|BadCredentials|Username and Password not accepted/i.test(raw)) {
      return 'Credenciales SMTP inválidas. Verifica EMAIL_USER y EMAIL_PASSWORD (App Password de Google) en .env.';
    }
    if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(raw)) {
      return 'No se pudo conectar al servidor SMTP. Verifica SMTP_HOST/SMTP_PORT y tu conexión.';
    }
    return raw;
  }

  obtenerTextoAccion(accion, datos) {
    switch (accion) {
      case 'modificar-stock':
        return `Modificación manual de stock${datos.insumoNombre ? ` para: ${datos.insumoNombre}` : ''}`;
      case 'eliminar-stock':
        return `Eliminación de registro de stock${datos.insumoNombre ? ` para: ${datos.insumoNombre}` : ''}`;
      case 'ajuste-masivo':
        return 'Ajuste masivo de inventario';
      default:
        return 'Operación administrativa sensible';
    }
  }

  async verificarConexion() {
    try {
      await this.transporter.verify();
      console.log('✅ Servidor de email listo para enviar mensajes');
      return true;
    } catch (error) {
      console.error('❌ Error en la configuración de email:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
