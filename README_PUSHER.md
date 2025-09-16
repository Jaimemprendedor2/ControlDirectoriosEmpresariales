# Configuración de Pusher para Control de Reunión

## 🚀 Migración Completa a Pusher

Esta aplicación utiliza **Pusher** como sistema de comunicación en tiempo real para permitir el despliegue en Netlify y otras plataformas de hosting estático.

## 📋 Requisitos Previos

1. **Cuenta de Pusher**: Crear una cuenta en [pusher.com](https://pusher.com)
2. **Aplicación Pusher**: Crear una nueva aplicación en el dashboard de Pusher

## 🔧 Configuración de Pusher

### Paso 1: Crear Aplicación en Pusher

1. Ve a [pusher.com](https://pusher.com) y crea una cuenta
2. Crea una nueva aplicación
3. Selecciona el cluster más cercano a tu ubicación
4. Anota tu **App Key** y **Cluster**

### Paso 2: Configurar Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# Pusher Configuration
VITE_PUSHER_KEY=tu_pusher_key_aqui
VITE_PUSHER_CLUSTER=tu_cluster_aqui
```

**Reemplaza:**
- `tu_pusher_key_aqui` con tu App Key de Pusher
- `tu_cluster_aqui` con tu cluster (ej: us2, eu, ap1, etc.)

### Paso 3: Configurar Pusher Dashboard

En el dashboard de Pusher, asegúrate de:

1. **Habilitar client events** en la pestaña "App Settings"
2. **Configurar CORS** si es necesario (para desarrollo local)

## 🏃‍♂️ Ejecutar la Aplicación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## 🌐 Despliegue en Netlify

### Paso 1: Configurar Variables de Entorno en Netlify

1. Ve a tu proyecto en Netlify
2. Ve a **Site settings** > **Environment variables**
3. Agrega las siguientes variables:
   - `VITE_PUSHER_KEY`: Tu App Key de Pusher
   - `VITE_PUSHER_CLUSTER`: Tu cluster de Pusher

### Paso 2: Desplegar

```bash
# Construir para producción
npm run build

# Desplegar (si usas Netlify CLI)
netlify deploy --prod
```

## 🔄 Funcionalidades Implementadas

### ✅ Comunicación en Tiempo Real
- **Control Remoto**: Envía comandos desde `Control.tsx` al timer principal
- **Sincronización de Estado**: El timer principal envía su estado a todas las vistas
- **Reconexión Automática**: Manejo automático de desconexiones y reconexiones

### ✅ Comandos Soportados
- `previous-stage`: Ir a la etapa anterior
- `next-stage`: Ir a la siguiente etapa
- `pause-resume`: Pausar/reanudar el timer
- `reset-to-zero`: Reiniciar el timer a 0
- `add-time`: Agregar tiempo (30 segundos)
- `subtract-time`: Restar tiempo (30 segundos)

### ✅ Estados Sincronizados
- Tiempo actual del timer
- Estado de ejecución (pausado/ejecutando)
- Índice de la etapa actual
- Lista de etapas

## 🏗️ Arquitectura

### Servicios
- **`pusherService.ts`**: Cliente de Pusher con manejo de conexiones y eventos
- **Canal**: `room-{roomId}` para comunicación entre componentes

### Componentes
- **`Home.tsx`**: Timer principal que envía comandos y estado
- **`Control.tsx`**: Control remoto que envía comandos
- **`MeetingView.tsx`**: Vista de presentación que recibe estado

## 🔍 Debugging

### Logs de Consola
La aplicación incluye logs detallados:
- ✅ Conexión exitosa
- ❌ Errores de conexión
- 📡 Comandos enviados/recibidos
- 🔄 Reconexiones automáticas

### Verificar Conexión
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Busca mensajes de Pusher

## 🚨 Solución de Problemas

### Error: "No conectado a Pusher"
- Verifica que las variables de entorno estén configuradas correctamente
- Asegúrate de que la App Key y Cluster sean correctos
- Verifica que client events esté habilitado en Pusher

### Error: "Error de suscripción"
- Verifica la configuración de CORS en Pusher
- Asegúrate de que el cluster sea correcto

### Comandos no llegan
- Verifica que client events esté habilitado en Pusher
- Revisa los logs de consola para errores
- Verifica que ambos componentes estén en la misma sala

## 📊 Monitoreo

### Pusher Dashboard
- Ve a tu aplicación en el dashboard de Pusher
- Monitorea conexiones activas
- Revisa eventos enviados/recibidos

### Métricas de Conexión
La aplicación muestra:
- Estado de conexión (conectado/desconectado)
- Intentos de reconexión
- Latencia de conexión
- Última conexión exitosa

## 🔒 Seguridad

### Autenticación (Opcional)
Para mayor seguridad, puedes implementar autenticación de canales:

1. Configurar un servidor de autenticación
2. Habilitar autenticación de canales en Pusher
3. Modificar `pusherService.ts` para incluir autenticación

### Rate Limiting
Pusher incluye rate limiting automático para prevenir spam.

## 📝 Notas de Migración

### Arquitectura Actual
- ✅ Sistema de comunicación unificado con Pusher
- ✅ Servicio `pusherService.ts` implementado
- ✅ Todos los componentes actualizados para usar Pusher
- ✅ Dependencias de Pusher configuradas
- ✅ Modo fallback con localStorage cuando Pusher no está disponible

### Compatibilidad
- ✅ Netlify (hosting estático)
- ✅ Vercel (hosting estático)
- ✅ GitHub Pages
- ✅ Cualquier hosting estático

## 🎯 Próximos Pasos

1. **Configurar Pusher**: Obtener credenciales y configurar `.env`
2. **Probar Localmente**: Ejecutar `npm run dev` y verificar conexión
3. **Desplegar**: Configurar variables en Netlify y desplegar
4. **Monitorear**: Usar el dashboard de Pusher para monitorear uso

---

¡La migración a Pusher está completa! La aplicación ahora es compatible con cualquier plataforma de hosting estático. 🎉
