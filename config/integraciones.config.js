/**
 * CONFIGURACIÓN EDITABLE DE INTEGRACIONES EXTERNAS.
 * Pega el Client ID de Google Cloud si deseas activar "Continuar con Google".
 * También debes pegar el mismo valor en:
 * ISWOPPGS-FRONT/src/app/config/cliente-contenido.ts
 */
module.exports = {
  googleClientId: process.env.GOOGLE_CLIENT_ID || ''
};

