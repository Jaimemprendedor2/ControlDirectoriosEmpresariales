/**
 * Tipos compartidos para el sistema de sincronización del cronómetro
 */

export interface TimerState {
  currentTimeLeft: number;
  isRunning: boolean;
  currentStageIndex: number;
  stages: Stage[];
  timestamp: number;
}

export interface Stage {
  id?: string;
  title: string;
  description?: string;
  duration: number;
  order_index?: number;
  is_completed?: boolean;
  colors?: Array<{
    timeInSeconds: number;
    backgroundColor: string;
  }>;
  alertColor?: string;
  alertSeconds?: number;
}

export type MessageType = 'INIT' | 'TICK' | 'CONTROL' | 'SYNC_REQUEST' | 'SYNC_RESPONSE' | 'PING' | 'PONG';

export interface SyncMessage<T = any> {
  type: MessageType;
  data?: T;
  timestamp: number;
  source: string;
  directoryId?: string;
}

export interface ControlCommand {
  action: string;
  [key: string]: any;
}

export interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: number | null;
  latency: number;
}

export interface SyncChannelConfig {
  directoryId?: string;
  isMainWindow?: boolean;
  heartbeatInterval?: number;
}

export type MessageCallback<T = any> = (message: SyncMessage<T>) => void;
export type ConnectionCallback = (state: ConnectionState) => void;
export type ErrorCallback = (error: string) => void;
