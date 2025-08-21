# Sistema WebSocket para Control de Reuniones

## Descripción General

Se ha implementado un sistema de comunicación en tiempo real basado en WebSocket (Socket.IO) para reemplazar el sistema anterior de `postMessage` entre ventanas. Este nuevo sistema proporciona:

- **Comunicación robusta**: Reconexión automática con backoff exponencial
- **Baja latencia**: Comunicación en tiempo real entre componentes
- **Escalabilidad**: Soporte para múltiples salas/rooms
- **Logging detallado**: Para debugging y monitoreo
- **Compatibilidad**: Mantiene el sistema anterior como fallback

## Arquitectura

### Componentes

1. **Servidor WebSocket** (`server.js`)
   - Node.js + Express + Socket.IO
   - Maneja conexiones, rooms, comandos y estado
   - Endpoints de salud y testing

2. **Cliente WebSocket** (`src/services/websocketService.ts`)
   - Servicio reutilizable para conexiones WebSocket
   - Manejo automático de reconexión
   - Callbacks para eventos

3. **Páginas Actualizadas**:
   - `Home.tsx`: Timer principal con WebSocket
   - `Control.tsx`: Control remoto con WebSocket
   - `MeetingView.tsx`: Vista de reflejo con WebSocket

## Configuración

### Dependencias

```json
{
  "dependencies": {
    "socket.io": "^4.7.4",
    "socket.io-client": "^4.7.4",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "concurrently": "^8.2.2"
  }
}
```

### Scripts

```json
{
  "scripts": {
    "dev:server": "node server.js",
    "dev:full": "concurrently \"npm run dev:server\" \"npm run dev\"",
    "start": "node server.js"
  }
}
```

## Uso

### Desarrollo

1. **Ejecutar servidor y cliente juntos**:
   ```bash
   npm run dev:full
   ```

2. **Ejecutar solo el servidor**:
   ```bash
   npm run dev:server
   ```

3. **Ejecutar solo el cliente**:
   ```bash
   npm run dev
   ```

### Producción

1. **Configurar variables de entorno**:
   ```bash
   NODE_ENV=production
   PORT=3001
   ```

2. **Ejecutar servidor**:
   ```bash
   npm start
   ```

## API del Servidor

### Endpoints HTTP

- `GET /health` - Estado del servidor
- `GET /test-command` - Probar comando
- `GET /server-status` - Información detallada del servidor

### Eventos WebSocket

#### Cliente → Servidor
- `join` - Unirse a una sala
- `command` - Enviar comando
- `timer-state` - Enviar estado del timer
- `ping` - Ping para medir latencia
- `force-reconnect` - Forzar reconexión

#### Servidor → Cliente
- `command` - Recibir comando
- `timer-state` - Recibir estado del timer
- `pong` - Respuesta a ping
- `error` - Error de conexión

## Tipos de Comandos

```typescript
interface CommandData {
  action: 'previousStage' | 'nextStage' | 'pauseResume' | 'setTime' | 'addTime' | 'subtractTime';
  data?: any;
  timestamp?: number;
  source?: string;
}
```

## Estados de Conexión

```typescript
interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastConnected: number | null;
  latency: number;
}
```

## Características del Sistema

### Reconexión Automática
- Backoff exponencial (1s, 2s, 4s, 8s...)
- Máximo 10 intentos de reconexión
- Limpieza automática de timers

### Medición de Latencia
- Ping/pong automático cada 5 segundos
- Cálculo de latencia en tiempo real
- Logging de métricas de conexión

### Manejo de Errores
- Captura de errores de conexión
- Logging detallado de errores
- UI feedback para el usuario

### Compatibilidad
- Mantiene sistema `postMessage` como fallback
- Migración gradual sin romper funcionalidad existente
- Logs de compatibilidad para debugging

## Debugging

### Logs del Servidor
```bash
# Ver logs del servidor
npm run dev:server

# Logs típicos:
# [INFO] Server running on port 3001
# [INFO] Client connected: socket-id
# [INFO] Client joined room: room-id
# [INFO] Command received: previousStage
```

### Logs del Cliente
```javascript
// En la consola del navegador
console.log('WebSocket connected');
console.log('Command sent:', command);
console.log('Latency:', latency + 'ms');
```

### UI de Debugging
- Botón "Ver Logs" en Home.tsx
- Indicador de estado de conexión
- Métricas de latencia y reconexiones

## Migración

### De postMessage a WebSocket

1. **Antes** (postMessage):
   ```javascript
   window.postMessage({ action: 'pauseResume' }, '*');
   ```

2. **Después** (WebSocket):
   ```javascript
   websocketService.sendCommand({
     action: 'pauseResume',
     timestamp: Date.now(),
     source: 'main-timer'
   });
   ```

### Compatibilidad
- El sistema mantiene ambos métodos
- WebSocket es el método principal
- postMessage funciona como fallback

## Seguridad

### Autenticación
- Sistema preparado para tokens de autenticación
- Variable `REQUIRE_AUTH` para habilitar/deshabilitar
- Validación de origen de comandos

### CORS
- Configurado para desarrollo y producción
- Soporte para múltiples orígenes
- Headers de seguridad apropiados

## Monitoreo

### Métricas Disponibles
- Número de conexiones activas
- Latencia promedio
- Tasa de reconexión
- Comandos por minuto

### Health Checks
- Endpoint `/health` para monitoreo
- Estado de conexiones WebSocket
- Uso de memoria y CPU

## Troubleshooting

### Problemas Comunes

1. **Servidor no inicia**:
   - Verificar puerto 3001 disponible
   - Revisar logs de error
   - Verificar dependencias instaladas

2. **Cliente no conecta**:
   - Verificar URL del servidor
   - Revisar CORS configuration
   - Verificar firewall/proxy

3. **Comandos no llegan**:
   - Verificar sala/room correcta
   - Revisar logs de conexión
   - Verificar formato de comandos

### Comandos de Debug

```bash
# Verificar servidor
curl http://localhost:3001/health

# Verificar estado
curl http://localhost:3001/server-status

# Probar comando
curl http://localhost:3001/test-command
```

## Próximos Pasos

1. **Autenticación completa**
2. **Métricas avanzadas**
3. **Persistencia de estado**
4. **Notificaciones push**
5. **Optimización de rendimiento**

## Contribución

Para contribuir al sistema WebSocket:

1. Seguir las convenciones de código existentes
2. Agregar tests para nuevas funcionalidades
3. Documentar cambios en este README
4. Mantener compatibilidad con sistema anterior
