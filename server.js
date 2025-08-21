import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Configurar CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
  credentials: true
}));

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware para logging
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// Variables de estado del servidor
const connectedClients = new Map();
const rooms = new Map();
const commandHistory = [];

// Endpoint de health check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    connectedClients: connectedClients.size,
    activeRooms: rooms.size,
    uptime: process.uptime()
  });
});

// Endpoint para testear comandos
app.post('/test-command', (req, res) => {
  const { room, command, data } = req.body;
  
  if (!room || !command) {
    return res.status(400).json({ error: 'Room and command are required' });
  }
  
  console.log(`📡 Test command received: ${command} for room ${room}`, data);
  
  // Enviar comando a todos los clientes en la sala
  io.to(room).emit('command', { 
    action: command, 
    data: data || {},
    timestamp: Date.now(),
    source: 'test-endpoint'
  });
  
  // Guardar en historial
  commandHistory.push({
    room,
    command,
    data,
    timestamp: Date.now(),
    source: 'test-endpoint'
  });
  
  // Limpiar historial antiguo (mantener solo últimos 100)
  if (commandHistory.length > 100) {
    commandHistory.splice(0, commandHistory.length - 100);
  }
  
  res.json({ 
    ok: true, 
    message: `Command ${command} sent to room ${room}`,
    clientsInRoom: io.sockets.adapter.rooms.get(room)?.size || 0
  });
});

// Endpoint para obtener estado del servidor
app.get('/server-status', (req, res) => {
  res.json({
    connectedClients: Array.from(connectedClients.values()).map(client => ({
      id: client.id,
      type: client.type,
      room: client.room,
      connectedAt: client.connectedAt,
      lastActivity: client.lastActivity
    })),
    rooms: Array.from(rooms.entries()).map(([roomId, room]) => ({
      id: roomId,
      clients: room.clients.length,
      lastActivity: room.lastActivity
    })),
    recentCommands: commandHistory.slice(-10)
  });
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
  const clientId = socket.id;
  const query = socket.handshake.query;
  const room = query.room || 'default';
  const clientType = query.type || 'unknown'; // 'timer' o 'controller'
  const token = query.token;
  
  console.log(`🔌 Nueva conexión: ${clientId} (${clientType}) en sala ${room}`);
  
  // Verificar autenticación si está configurada
  if (process.env.REQUIRE_AUTH === 'true' && !token) {
    console.log(`❌ Conexión rechazada: ${clientId} - Sin token de autenticación`);
    socket.emit('error', { message: 'Authentication required' });
    socket.disconnect();
    return;
  }
  
  // Unirse a la sala
  socket.join(room);
  
  // Registrar cliente
  const clientInfo = {
    id: clientId,
    type: clientType,
    room: room,
    connectedAt: Date.now(),
    lastActivity: Date.now(),
    token: token
  };
  
  connectedClients.set(clientId, clientInfo);
  
  // Inicializar sala si no existe
  if (!rooms.has(room)) {
    rooms.set(room, {
      id: room,
      clients: [],
      lastActivity: Date.now(),
      timerState: null
    });
  }
  
  const roomInfo = rooms.get(room);
  roomInfo.clients.push(clientInfo);
  roomInfo.lastActivity = Date.now();
  
  // Notificar a otros clientes en la sala
  socket.to(room).emit('client-connected', {
    clientId,
    type: clientType,
    timestamp: Date.now()
  });
  
  // Enviar estado actual de la sala al nuevo cliente
  const roomClients = roomInfo.clients.filter(c => c.id !== clientId);
  socket.emit('room-state', {
    room,
    clients: roomClients,
    timerState: roomInfo.timerState,
    timestamp: Date.now()
  });
  
  console.log(`✅ Cliente ${clientId} (${clientType}) conectado a sala ${room}`);
  
  // Manejar comandos del control remoto
  socket.on('command', (data) => {
    const { action, commandData } = data;
    
    console.log(`📱 Comando recibido de ${clientId}: ${action}`, commandData);
    
    // Actualizar actividad del cliente
    clientInfo.lastActivity = Date.now();
    roomInfo.lastActivity = Date.now();
    
    // Guardar en historial
    commandHistory.push({
      room,
      command: action,
      data: commandData,
      timestamp: Date.now(),
      source: clientId,
      clientType
    });
    
    // Limpiar historial antiguo
    if (commandHistory.length > 100) {
      commandHistory.splice(0, commandHistory.length - 100);
    }
    
    // Reenviar comando a todos los clientes en la sala (excepto al emisor)
    socket.to(room).emit('command', {
      action,
      data: commandData,
      timestamp: Date.now(),
      source: clientId,
      clientType
    });
    
    // Confirmar recepción al emisor
    socket.emit('command-ack', {
      action,
      timestamp: Date.now(),
      delivered: true
    });
  });
  
  // Manejar actualizaciones de estado del timer
  socket.on('timer-state', (state) => {
    console.log(`⏱️ Estado del timer actualizado por ${clientId}:`, state);
    
    // Actualizar estado de la sala
    roomInfo.timerState = {
      ...state,
      updatedBy: clientId,
      timestamp: Date.now()
    };
    
    // Reenviar estado a otros clientes en la sala
    socket.to(room).emit('timer-state-update', {
      ...state,
      source: clientId,
      timestamp: Date.now()
    });
  });
  
  // Manejar heartbeat/ping
  socket.on('ping', (data) => {
    clientInfo.lastActivity = Date.now();
    socket.emit('pong', {
      timestamp: Date.now(),
      clientId: clientId
    });
  });
  
  // Manejar solicitud de reconexión
  socket.on('force-reconnect', (data) => {
    console.log(`🔄 Reconexión solicitada por ${clientId} en sala ${room}`);
    
    // Notificar a todos los clientes en la sala
    io.to(room).emit('force-reconnect', {
      requestedBy: clientId,
      timestamp: Date.now(),
      reason: data.reason || 'manual'
    });
  });
  
  // Manejar desconexión
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Cliente desconectado: ${clientId} - Razón: ${reason}`);
    
    // Remover cliente de la lista
    connectedClients.delete(clientId);
    
    // Remover de la sala
    if (roomInfo) {
      roomInfo.clients = roomInfo.clients.filter(c => c.id !== clientId);
      roomInfo.lastActivity = Date.now();
      
      // Si la sala está vacía, limpiarla
      if (roomInfo.clients.length === 0) {
        rooms.delete(room);
        console.log(`🗑️ Sala ${room} eliminada (sin clientes)`);
      }
    }
    
    // Notificar a otros clientes
    socket.to(room).emit('client-disconnected', {
      clientId,
      reason,
      timestamp: Date.now()
    });
  });
  
  // Manejar errores
  socket.on('error', (error) => {
    console.error(`❌ Error en socket ${clientId}:`, error);
  });
});

// Limpiar clientes inactivos cada 30 segundos
setInterval(() => {
  const now = Date.now();
  const timeout = 60000; // 1 minuto
  
  for (const [clientId, client] of connectedClients.entries()) {
    if (now - client.lastActivity > timeout) {
      console.log(`⏰ Cliente ${clientId} marcado como inactivo, desconectando...`);
      const socket = io.sockets.sockets.get(clientId);
      if (socket) {
        socket.disconnect();
      }
    }
  }
}, 30000);

// Puerto del servidor
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket iniciado en puerto ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Server status: http://localhost:${PORT}/server-status`);
  console.log(`🧪 Test commands: POST http://localhost:${PORT}/test-command`);
  console.log(`🌐 CORS origins: ${process.env.ALLOWED_ORIGINS || '*'}`);
  console.log(`🔐 Auth required: ${process.env.REQUIRE_AUTH || 'false'}`);
});

// Manejo de señales para cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});
