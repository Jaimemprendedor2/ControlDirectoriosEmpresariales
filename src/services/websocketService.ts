import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url: string;
  room: string;
  type: 'timer' | 'controller';
  token?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastConnected: number | null;
  latency: number;
}

export interface CommandData {
  action: string;
  data?: any;
  timestamp?: number;
  source?: string;
}

export interface TimerState {
  currentTimeLeft: number;
  isRunning: boolean;
  currentStageIndex: number;
  stages: any[];
  timestamp: number;
}

export type ConnectionCallback = (state: ConnectionState) => void;
export type CommandCallback = (command: CommandData) => void;
export type TimerStateCallback = (state: TimerState) => void;
export type ErrorCallback = (error: string) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private state: ConnectionState;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private latencyTimer: NodeJS.Timeout | null = null;
  
  // Callbacks
  private connectionCallbacks: ConnectionCallback[] = [];
  private commandCallbacks: CommandCallback[] = [];
  private timerStateCallbacks: TimerStateCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];

  constructor(config: WebSocketConfig) {
    this.config = {
      autoReconnect: true,
      maxReconnectAttempts: 10,
      reconnectDelay: 1000,
      ...config
    };
    
    this.state = {
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0,
      lastConnected: null,
      latency: 0
    };
  }

  // Conectar al servidor
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.state.connecting = true;
      this.state.error = null;
      this.updateConnectionState();

      try {
        // Crear conexión Socket.IO
        this.socket = io(this.config.url, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
          query: {
            room: this.config.room,
            type: this.config.type,
            token: this.config.token
          }
        });

        // Configurar event listeners
        this.setupEventListeners();

        // Timeout para la conexión
        const connectionTimeout = setTimeout(() => {
          if (!this.state.connected) {
            this.state.error = 'Timeout de conexión';
            this.state.connecting = false;
            this.updateConnectionState();
            reject(new Error('Connection timeout'));
          }
        }, 10000);

        // Resolver cuando se conecte
        this.socket.once('connect', () => {
          clearTimeout(connectionTimeout);
          this.state.connected = true;
          this.state.connecting = false;
          this.state.reconnectAttempts = 0;
          this.state.lastConnected = Date.now();
          this.state.error = null;
          this.updateConnectionState();
          
          // Iniciar ping para medir latencia
          this.startPing();
          
          resolve();
        });

        // Rechazar si hay error de conexión
        this.socket.once('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          this.state.error = error.message;
          this.state.connecting = false;
          this.updateConnectionState();
          reject(error);
        });

      } catch (error) {
        this.state.error = error instanceof Error ? error.message : 'Error desconocido';
        this.state.connecting = false;
        this.updateConnectionState();
        reject(error);
      }
    });
  }

  // Desconectar del servidor
  disconnect(): void {
    this.stopPing();
    this.clearReconnectTimer();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.state.connected = false;
    this.state.connecting = false;
    this.state.error = null;
    this.updateConnectionState();
  }

  // Enviar comando
  sendCommand(action: string, data?: any): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        console.warn('⚠️ Socket no conectado, comando no enviado:', action);
        resolve(false);
        return;
      }

      const commandData: CommandData = {
        action,
        data,
        timestamp: Date.now()
      };

      this.socket.emit('command', commandData, (ack: any) => {
        if (ack?.delivered) {
          console.log('✅ Comando enviado exitosamente:', action, data);
          resolve(true);
        } else {
          console.warn('⚠️ Comando no confirmado:', action);
          resolve(false);
        }
      });

      // Timeout para confirmación
      setTimeout(() => {
        console.warn('⚠️ Timeout de confirmación para comando:', action);
        resolve(false);
      }, 5000);
    });
  }

  // Enviar estado del timer
  sendTimerState(state: TimerState): void {
    if (!this.socket?.connected) {
      console.warn('⚠️ Socket no conectado, estado no enviado');
      return;
    }

    this.socket.emit('timer-state', state);
  }

  // Enviar ping para medir latencia
  sendPing(): void {
    if (!this.socket?.connected) return;

    const startTime = Date.now();
    this.socket.emit('ping', { timestamp: startTime });
  }

  // Forzar reconexión
  forceReconnect(reason?: string): void {
    console.log('🔄 Reconexión forzada solicitada:', reason);
    this.disconnect();
    
    if (this.config.autoReconnect) {
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('❌ Error en reconexión forzada:', error);
        });
      }, 1000);
    }
  }

  // Configurar event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Conexión establecida
    this.socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
      this.state.connected = true;
      this.state.connecting = false;
      this.state.reconnectAttempts = 0;
      this.state.lastConnected = Date.now();
      this.state.error = null;
      this.updateConnectionState();
      this.startPing();
    });

    // Error de conexión
    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error);
      this.state.error = error.message;
      this.state.connecting = false;
      this.updateConnectionState();
      this.handleConnectionError();
    });

    // Desconexión
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado del servidor:', reason);
      this.state.connected = false;
      this.state.connecting = false;
      this.stopPing();
      this.updateConnectionState();
      
      if (this.config.autoReconnect && reason !== 'io client disconnect') {
        this.handleConnectionError();
      }
    });

    // Comandos recibidos
    this.socket.on('command', (command: CommandData) => {
      console.log('📱 Comando recibido:', command);
      this.commandCallbacks.forEach(callback => callback(command));
    });

    // Actualizaciones de estado del timer
    this.socket.on('timer-state-update', (state: TimerState) => {
      console.log('⏱️ Estado del timer actualizado:', state);
      this.timerStateCallbacks.forEach(callback => callback(state));
    });

    // Respuesta a ping
    this.socket.on('pong', (data) => {
      const latency = Date.now() - data.timestamp;
      this.state.latency = latency;
      console.log(`📡 Latencia: ${latency}ms`);
    });

    // Reconexión forzada
    this.socket.on('force-reconnect', (data) => {
      console.log('🔄 Reconexión forzada solicitada por servidor:', data);
      this.forceReconnect(data.reason);
    });

    // Cliente conectado a la sala
    this.socket.on('client-connected', (data) => {
      console.log('👤 Cliente conectado a la sala:', data);
    });

    // Cliente desconectado de la sala
    this.socket.on('client-disconnected', (data) => {
      console.log('👤 Cliente desconectado de la sala:', data);
    });

    // Estado de la sala
    this.socket.on('room-state', (data) => {
      console.log('🏠 Estado de la sala recibido:', data);
    });

    // Errores del servidor
    this.socket.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
      this.errorCallbacks.forEach(callback => callback(error.message));
    });
  }

  // Manejar errores de conexión
  private handleConnectionError(): void {
    if (!this.config.autoReconnect) return;

    if (this.state.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      this.state.error = `Máximo de intentos de reconexión alcanzado (${this.config.maxReconnectAttempts})`;
      this.updateConnectionState();
      return;
    }

    this.state.reconnectAttempts++;
    const delay = this.config.reconnectDelay! * Math.pow(2, this.state.reconnectAttempts - 1);
    
    console.log(`🔄 Intentando reconexión ${this.state.reconnectAttempts}/${this.config.maxReconnectAttempts} en ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('❌ Error en reconexión:', error);
      });
    }, delay);
  }

  // Iniciar ping periódico
  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.sendPing();
    }, 10000); // Ping cada 10 segundos
  }

  // Detener ping
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // Limpiar timer de reconexión
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Actualizar estado de conexión
  private updateConnectionState(): void {
    this.connectionCallbacks.forEach(callback => callback(this.state));
  }

  // Métodos para registrar callbacks
  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  onCommand(callback: CommandCallback): void {
    this.commandCallbacks.push(callback);
  }

  onTimerState(callback: TimerStateCallback): void {
    this.timerStateCallbacks.push(callback);
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  // Obtener estado actual
  getConnectionState(): ConnectionState {
    return { ...this.state };
  }

  // Verificar si está conectado
  isConnected(): boolean {
    return this.state.connected && this.socket?.connected === true;
  }

  // Obtener latencia
  getLatency(): number {
    return this.state.latency;
  }
}

// Instancia singleton
let websocketService: WebSocketService | null = null;

// Factory para crear o obtener la instancia
export const createWebSocketService = (config: WebSocketConfig): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService(config);
  }
  return websocketService;
};

// Obtener la instancia existente
export const getWebSocketService = (): WebSocketService | null => {
  return websocketService;
};

// Limpiar la instancia
export const clearWebSocketService = (): void => {
  if (websocketService) {
    websocketService.disconnect();
    websocketService = null;
  }
};

export default WebSocketService;
