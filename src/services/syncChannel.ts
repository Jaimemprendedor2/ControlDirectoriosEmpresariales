/**
 * Servicio de sincronización entre ventanas usando BroadcastChannel y fallbacks
 * Reemplaza Pusher con una solución más simple y confiable
 */

export interface SyncMessage {
  type: 'INIT' | 'TICK' | 'CONTROL' | 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'PING' | 'PONG';
  data?: any;
  timestamp: number;
  source: string;
  directoryId?: string;
}

export interface TimerState {
  currentTimeLeft: number;
  isRunning: boolean;
  currentStageIndex: number;
  stages: any[];
  timestamp: number;
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: number | null;
  latency: number;
}

export type MessageCallback = (message: SyncMessage) => void;
export type ConnectionCallback = (state: ConnectionState) => void;
export type ErrorCallback = (error: string) => void;

export class SyncChannelService {
  private broadcastChannel: BroadcastChannel | null = null;
  private fallbackWindow: Window | null = null;
  private state: ConnectionState;
  private messageCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private directoryId: string | null = null;
  private isMainWindow: boolean = false;

  constructor() {
    this.state = {
      connected: false,
      connecting: false,
      error: null,
      lastConnected: null,
      latency: 0
    };

    this.initializeChannel();
  }

  private initializeChannel(): void {
    try {
      // Intentar usar BroadcastChannel
      if (typeof BroadcastChannel !== 'undefined') {
        this.broadcastChannel = new BroadcastChannel('housenovo-directorios');
        this.broadcastChannel.onmessage = this.handleMessage.bind(this);
        this.setConnected(true);
        console.log('✅ BroadcastChannel inicializado');
        return;
      }
    } catch (error) {
      console.warn('⚠️ BroadcastChannel no disponible:', error);
    }

    // Fallback: usar postMessage entre ventanas
    this.setupPostMessageFallback();
  }

  private setupPostMessageFallback(): void {
    try {
      // Escuchar mensajes de otras ventanas
      window.addEventListener('message', this.handlePostMessage.bind(this));
      
      // Escuchar cambios en localStorage como fallback adicional
      window.addEventListener('storage', this.handleStorageMessage.bind(this));
      
      this.setConnected(true);
      console.log('✅ PostMessage fallback inicializado');
    } catch (error) {
      console.error('❌ Error inicializando fallback:', error);
      this.setError('Error inicializando comunicación entre ventanas');
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: SyncMessage = event.data;
      this.processMessage(message);
    } catch (error) {
      console.error('❌ Error procesando mensaje BroadcastChannel:', error);
    }
  }

  private handlePostMessage(event: MessageEvent): void {
    try {
      // Verificar que el mensaje es de nuestra aplicación
      if (event.data && event.data.type && event.data.source === 'housenovo-directorios') {
        this.processMessage(event.data);
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje postMessage:', error);
    }
  }

  private handleStorageMessage(event: StorageEvent): void {
    try {
      if (event.key === 'housenovo-sync-message' && event.newValue) {
        const message: SyncMessage = JSON.parse(event.newValue);
        this.processMessage(message);
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje storage:', error);
    }
  }

  private processMessage(message: SyncMessage): void {
    // Verificar directoryId si está especificado
    if (message.directoryId && this.directoryId && message.directoryId !== this.directoryId) {
      return; // Ignorar mensajes de otros directorios
    }

    // Actualizar latencia
    if (message.timestamp) {
      this.state.latency = Date.now() - message.timestamp;
    }

    // Procesar mensajes de heartbeat
    if (message.type === 'PING') {
      this.sendMessage({
        type: 'PONG',
        data: { pong: true },
        timestamp: Date.now(),
        source: 'housenovo-directorios',
        directoryId: this.directoryId
      });
      return;
    }

    // Notificar a los callbacks
    this.messageCallbacks.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('❌ Error en callback de mensaje:', error);
      }
    });
  }

  private setConnected(connected: boolean): void {
    this.state.connected = connected;
    this.state.connecting = false;
    this.state.error = null;
    if (connected) {
      this.state.lastConnected = Date.now();
    }

    this.connectionCallbacks.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('❌ Error en callback de conexión:', error);
      }
    });
  }

  private setError(error: string): void {
    this.state.error = error;
    this.state.connected = false;
    this.state.connecting = false;

    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (error) {
        console.error('❌ Error en callback de error:', error);
      }
    });
  }

  public setDirectoryId(directoryId: string): void {
    this.directoryId = directoryId;
  }

  public setIsMainWindow(isMain: boolean): void {
    this.isMainWindow = isMain;
  }

  public sendMessage(message: SyncMessage): void {
    try {
      const fullMessage: SyncMessage = {
        ...message,
        timestamp: Date.now(),
        source: 'housenovo-directorios',
        directoryId: this.directoryId
      };

      // Enviar por BroadcastChannel si está disponible
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage(fullMessage);
      }

      // Fallback: usar postMessage si hay ventana padre
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(fullMessage, '*');
      }

      // Fallback adicional: usar localStorage
      try {
        localStorage.setItem('housenovo-sync-message', JSON.stringify(fullMessage));
        // Limpiar después de un breve delay para evitar acumulación
        setTimeout(() => {
          localStorage.removeItem('housenovo-sync-message');
        }, 100);
      } catch (error) {
        console.warn('⚠️ No se pudo usar localStorage para sincronización:', error);
      }

    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      this.setError('Error enviando mensaje');
    }
  }

  public sendTimerState(state: TimerState): void {
    this.sendMessage({
      type: 'TICK',
      data: state,
      timestamp: Date.now(),
      source: 'housenovo-directorios',
      directoryId: this.directoryId
    });
  }

  public sendControlCommand(action: string, data?: any): void {
    this.sendMessage({
      type: 'CONTROL',
      data: { action, ...data },
      timestamp: Date.now(),
      source: 'housenovo-directorios',
      directoryId: this.directoryId
    });
  }

  public requestSync(): void {
    this.sendMessage({
      type: 'SYNC_REQUEST',
      data: { requestSync: true },
      timestamp: Date.now(),
      source: 'housenovo-directorios',
      directoryId: this.directoryId
    });
  }

  public respondToSync(state: TimerState): void {
    this.sendMessage({
      type: 'SYNC_RESPONSE',
      data: state,
      timestamp: Date.now(),
      source: 'housenovo-directorios',
      directoryId: this.directoryId
    });
  }

  public startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.state.connected) {
        this.sendMessage({
          type: 'PING',
          data: { ping: true },
          timestamp: Date.now(),
          source: 'housenovo-directorios',
          directoryId: this.directoryId
        });
      }
    }, 5000); // Cada 5 segundos
  }

  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public onMessage(callback: MessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  public onConnection(callback: ConnectionCallback): void {
    this.connectionCallbacks.push(callback);
  }

  public onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  public getState(): ConnectionState {
    return { ...this.state };
  }

  public isConnected(): boolean {
    return this.state.connected;
  }

  public disconnect(): void {
    this.stopHeartbeat();
    
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.setConnected(false);
    console.log('🔌 SyncChannel desconectado');
  }

  public destroy(): void {
    this.disconnect();
    this.messageCallbacks = [];
    this.connectionCallbacks = [];
    this.errorCallbacks = [];
  }
}

// Instancia global del servicio
let globalSyncService: SyncChannelService | null = null;

export const createSyncService = (): SyncChannelService => {
  if (!globalSyncService) {
    globalSyncService = new SyncChannelService();
  }
  return globalSyncService;
};

export const getSyncService = (): SyncChannelService | null => {
  return globalSyncService;
};

export const destroySyncService = (): void => {
  if (globalSyncService) {
    globalSyncService.destroy();
    globalSyncService = null;
  }
};

export default SyncChannelService;
