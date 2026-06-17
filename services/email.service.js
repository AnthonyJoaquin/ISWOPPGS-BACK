const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configuración del transportador de email
    // Por ahora usaremos Gmail. Deberás configurar las credenciales en .env
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Usa una contraseña de aplicación de Google
      }
    });
  }

  async enviarCodigoSeguridad(email, token, accion, datos = {}) {
    const accionTexto = this.obtenerTextoAccion(accion, datos);
    
    const mailOptions = {
      from: `"Sistema Goldfish" <${process.env.EMAIL_USER}>`,
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
      console.error('❌ Error enviando email:', error);
      return { success: false, error: error.message };
    }
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
