export interface TimerSettings {
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  showSeconds: boolean;
  autoStart: boolean;
  showProgress: boolean;
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

export interface TimerState {
  stages: any[];
  currentStageIndex: number;
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  totalTime: number;
  startTime: number | null;
  pausedTime: number;
  timestamp: number;
}

// WakeLockSentinel se usa el tipo nativo del navegador

export interface NavigationBarProps {
  onToggleSettings: () => void;
  onToggleAlwaysOnTop: () => void;
  onToggleBackgroundMode: () => void;
  onClose: () => void;
  isAlwaysOnTop: boolean;
  isBackgroundMode: boolean;
}

export interface TimerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: TimerSettings) => void;
}
