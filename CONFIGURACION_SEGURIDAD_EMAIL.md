# 🔐 Configuración de Seguridad por Email

Sistema de verificación de dos factores (2FA) mediante código de seguridad enviado por correo electrónico.

## 📋 Requisitos

1. **Cuenta de Gmail** para enviar los correos
2. **Contraseña de aplicación de Google** (no uses tu contraseña normal)

## ⚙️ Configuración

### 1. Obtener Contraseña de Aplicación de Google

1. Ve a tu [Cuenta de Google](https://myaccount.google.com/)
2. Selecciona **Seguridad** en el menú lateral
3. En "Acceso a Google", activa **Verificación en dos pasos** (si no está activada)
4. Busca **Contraseñas de aplicaciones**
5. Selecciona "Correo" y "Otro dispositivo personalizado"
6. Dale un nombre: "Goldfish Admin System"
7. Copia la contraseña de 16 caracteres que te genera

### 2. Configurar Variables de Entorno

Edita tu archivo `.env` y agrega:

```env
# Email para enviar códigos de seguridad
EMAIL_USER=tucorreo@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Contraseña de aplicación (16 caracteres)
ADMIN_SECURITY_EMAIL=galvananthony967@gmail.com
```

**Importante:** 
- `EMAIL_USER`: El correo desde donde se enviarán los códigos
- `EMAIL_PASSWORD`: La contraseña de aplicación de Google (16 caracteres)
- `ADMIN_SECURITY_EMAIL`: El correo donde se recibirán los códigos (galvananthony967@gmail.com)

## 🚀 Uso del Sistema

### Flujo de Trabajo

1. **Usuario intenta modificar stock** → Sistema requiere código de seguridad
2. **Usuario solicita código** → Sistema genera código y lo envía al email configurado
3. **Usuario recibe email** con código de 6 dígitos
4. **Usuario ingresa código** en la aplicación
5. **Sistema valida** y permite la operación

### API Endpoints

#### 1. Solicitar código de seguridad
```http
POST /api/security-token/solicitar
Content-Type: application/json

{
  "accion": "modificar-stock",
  "datos": {
    "insumoNombre": "Arroz Sushi Premium"
  }
}
```

**Respuesta:**
```json
{
  "message": "Código de seguridad enviado a gal***@gmail.com",
  "tokenId": "65abc123...",
  "expiraEn": "2024-01-15T10:20:00.000Z",
  "emailEnviado": true
}
```

#### 2. Verificar código (método alternativo)
```http
POST /api/security-token/verificar
Content-Type: application/json

{
  "token": "123456",
  "accion": "modificar-stock"
}
```

#### 3. Modificar stock (con token)
```http
PUT /api/stock/:id
Content-Type: application/json
X-Security-Token: 123456

{
  "stock": 150,
  "stockMinimo": 20,
  "motivo": "Ajuste por inventario físico"
}
```

O incluir el token en el body:
```json
{
  "stock": 150,
  "stockMinimo": 20,
  "motivo": "Ajuste por inventario físico",
  "securityToken": "123456"
}
```

### Acciones Protegidas

- `modificar-stock`: Modificación manual de stock
- `eliminar-stock`: Eliminación de registros de stock
- `ajuste-masivo`: Ajustes masivos de inventario

## 📧 Formato del Email

El usuario recibirá un email profesional con:

- 🎨 Diseño responsive y profesional
- 🔢 Código de 6 dígitos destacado
- ⏱️ Tiempo de expiración (10 minutos)
- ⚠️ Advertencias de seguridad
- 📱 Instrucciones claras

## 🔒 Características de Seguridad

1. **Expiración automática**: Los códigos expiran en 10 minutos
2. **Uso único**: Cada código solo puede usarse una vez
3. **Limpieza automática**: Los tokens expirados se eliminan automáticamente de la BD
4. **Registro de auditoría**: Todas las solicitudes quedan registradas
5. **Email enmascarado**: El email se muestra parcialmente ofuscado

## 🛠️ Testing

Para probar el sistema:

```bash
# 1. Solicitar código
curl -X POST http://localhost:3000/api/security-token/solicitar \
  -H "Content-Type: application/json" \
  -d '{
    "accion": "modificar-stock",
    "datos": {"insumoNombre": "Arroz Sushi"}
  }'

# 2. Verifica tu email y copia el código de 6 dígitos

# 3. Usa el código para modificar stock
curl -X PUT http://localhost:3000/api/stock/ID_DEL_STOCK \
  -H "Content-Type: application/json" \
  -H "X-Security-Token: 123456" \
  -d '{
    "stock": 100,
    "stockMinimo": 20,
    "motivo": "Prueba de seguridad"
  }'
```

## 📊 Endpoints Adicionales

### Ver historial de tokens
```http
GET /api/security-token/historial?limite=50&accion=modificar-stock
```

### Limpiar tokens expirados manualmente
```http
DELETE /api/security-token/limpiar
```

## ⚠️ Troubleshooting

### "Error al enviar el código de seguridad"
- Verifica que EMAIL_USER y EMAIL_PASSWORD estén configurados
- Asegúrate de usar una contraseña de aplicación, no tu contraseña normal
- Verifica que la verificación en dos pasos esté activa en tu cuenta de Google

### "Código inválido o ya fue utilizado"
- El código solo puede usarse una vez
- Solicita un nuevo código si es necesario

### "El código ha expirado"
- Los códigos expiran en 10 minutos
- Solicita un nuevo código

## 🔐 Recomendaciones de Seguridad

1. **Nunca compartas** tus contraseñas de aplicación
2. **Cambia la contraseña** periódicamente
3. **Usa email corporativo** en producción si es posible
4. **Monitorea el historial** regularmente para detectar uso no autorizado
5. **Configura alertas** en tu correo para emails inusuales

## 📝 Notas

- Los códigos son de **6 dígitos** (100000 - 999999)
- **Tiempo de expiración**: 10 minutos
- **Almacenamiento**: MongoDB con índice TTL para limpieza automática
- **Email masking**: Se oculta parcialmente el email en las respuestas de API
