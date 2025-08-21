# 🔧 Configuración de Pusher - Instrucciones Detalladas

## 🚨 **Problema Actual**
La aplicación está funcionando en **modo fallback** porque las credenciales de Pusher no están configuradas correctamente.

## ✅ **Solución Paso a Paso**

### **Paso 1: Crear cuenta en Pusher**

1. Ve a [pusher.com](https://pusher.com)
2. Haz clic en **"Get Started"** o **"Sign Up"**
3. Completa el registro con tu email y contraseña
4. Verifica tu email

### **Paso 2: Crear una nueva aplicación**

1. En el dashboard de Pusher, haz clic en **"Create app"**
2. Completa la información:
   - **App name**: `Control Reunion Timer`
   - **Cluster**: Selecciona el más cercano a tu ubicación (ej: `us2`, `eu`, `ap1`)
   - **Frontend**: `React`
   - **Backend**: `None` (no necesitamos backend)

3. Haz clic en **"Create app"**

### **Paso 3: Obtener credenciales**

1. En tu aplicación, ve a la pestaña **"Keys"**
2. Copia los siguientes valores:
   - **App Key** (ej: `abc123def456`)
   - **Cluster** (ej: `us2`)

### **Paso 4: Configurar variables de entorno**

**Opción A: Archivo .env local**
```bash
# Editar el archivo .env en la raíz del proyecto
VITE_PUSHER_KEY=tu_app_key_real_aqui
VITE_PUSHER_CLUSTER=tu_cluster_real_aqui
```

**Opción B: Variables de entorno en Netlify**
1. Ve a tu proyecto en Netlify
2. **Site settings** > **Environment variables**
3. Agrega:
   - `VITE_PUSHER_KEY` = `tu_app_key_real_aqui`
   - `VITE_PUSHER_CLUSTER` = `tu_cluster_real_aqui`

### **Paso 5: Configurar Pusher Dashboard**

1. En tu aplicación de Pusher, ve a **"App Settings"**
2. En la sección **"Domains"**, agrega:
   - `localhost` (para desarrollo)
   - `tu-dominio.netlify.app` (para producción)

3. En la sección **"Client Events"**, habilita:
   - ✅ **Enable client events**

### **Paso 6: Verificar la configuración**

1. **Reinicia la aplicación**:
   ```bash
   npm run dev
   ```

2. **Abre las herramientas de desarrollador** (F12)
3. **Ve a la pestaña Console**
4. **Busca estos mensajes**:
   - ✅ `"Conectado a Pusher exitosamente"`
   - ❌ `"Credenciales de Pusher no configuradas"`

## 🔍 **Verificación de Funcionamiento**

### **Indicadores de Éxito:**
- ✅ Mensaje: `"Conectado a Pusher exitosamente"`
- ✅ Estado: `"Conectado"` en la interfaz
- ✅ Logs sin errores de conexión

### **Indicadores de Problema:**
- ❌ Mensaje: `"Credenciales de Pusher no configuradas"`
- ❌ Estado: `"Desconectado"` o `"Error"`
- ❌ Logs con errores de conexión

## 🛠️ **Solución de Problemas**

### **Error: "Invalid key"**
- Verifica que el App Key sea correcto
- Asegúrate de no incluir espacios extra

### **Error: "Invalid cluster"**
- Verifica que el cluster sea correcto
- Los clusters válidos son: `us2`, `eu`, `ap1`, `ap2`, `ap3`, `sa1`

### **Error: "CORS"**
- Agrega tu dominio en la configuración de Pusher
- Para desarrollo: `localhost`
- Para producción: tu dominio de Netlify

### **Error: "Client events not enabled"**
- Ve a **App Settings** > **Client Events**
- Habilita **"Enable client events"**

## 📋 **Checklist de Configuración**

- [ ] Cuenta de Pusher creada
- [ ] Aplicación creada en Pusher
- [ ] App Key copiado correctamente
- [ ] Cluster copiado correctamente
- [ ] Variables de entorno configuradas
- [ ] Dominios agregados en Pusher
- [ ] Client events habilitados
- [ ] Aplicación reiniciada
- [ ] Conexión verificada en consola

## 🎯 **Resultado Esperado**

Una vez configurado correctamente, deberías ver:
- ✅ Conexión exitosa a Pusher
- ✅ Comunicación en tiempo real entre control y timer
- ✅ Sincronización automática de estado
- ✅ Sin errores en la consola

---

**¿Necesitas ayuda?** Si sigues teniendo problemas, verifica cada paso del checklist y revisa los logs en la consola del navegador.
