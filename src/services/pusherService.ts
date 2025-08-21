import Pusher from 'pusher-js';

export interface PusherConfig {
  appKey: string;
  cluster: string;
  room: string;
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

export class PusherService {
  private pusher: Pusher;
  private channel: any;
  private config: PusherConfig;
  private state: ConnectionState;

  // Callbacks
  private connectionCallbacks: ConnectionCallback[] = [];
  private commandCallbacks: CommandCallback[] = [];
  private timerStateCallbacks: TimerStateCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];

  constructor(config: PusherConfig) {
    this.config = config;

    this.state = {
      connected: false,
      connecting: false,
      error: null,
      reconnectAttempts: 0,
      lastConnected: null,
      latency: 0
    };

    // Inicializar Pusher
    this.pusher = new Pusher(config.appKey, {
      cluster: config.cluster,
      forceTLS: true,
      enabledTransports: ['ws', 'wss']
    });

    // Suscribirse al canal
    this.channel = this.pusher.subscribe(`room-${config.room}`);

    // Configurar event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Evento de suscripción exitosa
    this.channel.bind('pusher:subscription_succeeded', () => {
      this.state.connected = true;
      this.state.connecting = false;
      this.state.lastConnected = Date.now();
      this.state.error = null;
      this.updateConnectionState();
      console.log('✅ Conectado a Pusher exitosamente');
    });

    // Evento de error de suscripción
    this.channel.bind('pusher:subscription_error', (error: any) => {
      this.state.error = error.message || 'Error de suscripción';
      this.state.connecting = false;
      this.state.connected = false;
      this.updateConnectionState();
      console.error('❌ Error de conexión Pusher:', error);
    });

    // Evento de desconexión
    this.pusher.connection.bind('disconnected', () => {
      this.state.connected = false;
      this.state.connecting = false;
      this.updateConnectionState();
      console.log('🔌 Desconectado de Pusher');
    });

    // Evento de reconexión
    this.pusher.connection.bind('connected', () => {
      this.state.connected = true;
      this.state.lastConnected = Date.now();
      this.state.reconnectAttempts++;
      this.updateConnectionState();
      console.log('🔄 Reconectado a Pusher');
    });

    // Evento de error de conexión
    this.pusher.connection.bind('error', (error: any) => {
      this.state.error = error.message || 'Error de conexión';
      this.updateConnectionState();
      console.error('❌ Error de conexión:', error);
    });

    // Eventos de comandos
    this.channel.bind('client-command', (command: CommandData) => {
      console.log('📡 Comando recibido via Pusher:', command);
      this.commandCallbacks.forEach(callback => callback(command));
    });

    // Eventos de estado del timer
    this.channel.bind('client-timer-state', (state: TimerState) => {
      console.log('📡 Estado del timer recibido via Pusher:', state);
      this.timerStateCallbacks.forEach(callback => callback(state));
    });
  }

  private updateConnectionState() {
    this.connectionCallbacks.forEach(callback => callback(this.state));
  }

  // Métodos públicos
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state.connected) {
        resolve();
        return;
      }

      this.state.connecting = true;
      this.state.error = null;
      this.updateConnectionState();

      // Pusher se conecta automáticamente, solo esperamos
      const checkConnection = () => {
        if (this.state.connected) {
          resolve();
        } else if (this.state.error) {
          reject(new Error(this.state.error));
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  disconnect(): void {
    this.pusher.disconnect();
    this.state.connected = false;
    this.state.connecting = false;
    this.updateConnectionState();
  }

  sendCommand(command: CommandData): void {
    if (this.state.connected) {
      this.channel.trigger('client-command', command);
      console.log('📤 Comando enviado via Pusher:', command);
    } else {
      console.warn('⚠️ No conectado a Pusher, comando no enviado');
    }
  }

  sendTimerState(state: TimerState): void {
    if (this.state.connected) {
      this.channel.trigger('client-timer-state', state);
      console.log('📤 Estado del timer enviado via Pusher:', state);
    } else {
      console.warn('⚠️ No conectado a Pusher, estado no enviado');
    }
  }

  // Callbacks
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

  // Getters
  getState(): ConnectionState {
    return { ...this.state };
  }

  isConnected(): boolean {
    return this.state.connected;
  }
}

// Funciones de utilidad (mantener compatibilidad con websocketService)
export const createPusherService = (config: PusherConfig): PusherService => {
  return new PusherService(config);
};

let globalPusherService: PusherService | null = null;

export const getPusherService = (): PusherService | null => {
  return globalPusherService;
};

export const setGlobalPusherService = (service: PusherService): void => {
  globalPusherService = service;
};

export const clearPusherService = (): void => {
  if (globalPusherService) {
    globalPusherService.disconnect();
    globalPusherService = null;
  }
};

export default PusherService;
