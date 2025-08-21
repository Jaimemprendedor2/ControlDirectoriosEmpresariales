import React, { useState, useEffect } from 'react';
import { createWebSocketService, getWebSocketService, clearWebSocketService, ConnectionState, CommandData, TimerState } from '../services/websocketService';

interface Stage {
  id?: string;
  title: string;
  duration: number;
  order_index?: number;
  is_completed?: boolean;
  colors?: Array<{
    timeInSeconds: number;
    backgroundColor: string;
  }>;
  alertColor?: string;
}

export const MeetingView: React.FC = () => {
  // Estados para reflejar el cronómetro principal
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isAlertBlinking, setIsAlertBlinking] = useState(false);
  
  // Estado de conexión WebSocket
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
    latency: 0
  });

  const currentStage = stages[currentStageIndex];

  // Función para obtener URL del servidor WebSocket
  const getWebSocketUrl = (): string => {
    // En desarrollo, usar localhost:3001
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // En producción, usar el mismo dominio con puerto 3001
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  };

  // Función para formatear tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para enviar estado del timer
  const sendTimerState = () => {
    const wsService = getWebSocketService();
    if (!wsService || !wsService.isConnected()) return;

    const timerState: TimerState = {
      currentTimeLeft: timeLeft,
      isRunning: isRunning,
      currentStageIndex: currentStageIndex,
      stages: stages,
      timestamp: Date.now()
    };

    wsService.sendTimerState(timerState);
  };

  // Inicializar WebSocket
  useEffect(() => {
    // Obtener ID de la sala desde localStorage o generar uno
    const meetingStages = localStorage.getItem('meetingStages');
    const currentStageIndex = localStorage.getItem('currentStageIndex');
    const currentTimeLeft = localStorage.getItem('currentTimeLeft');
    const isTimerRunning = localStorage.getItem('isTimerRunning');
    
    if (meetingStages) {
      try {
        const parsedStages = JSON.parse(meetingStages);
        setStages(parsedStages);
      } catch (error) {
        console.error('Error parsing stages:', error);
      }
    }
    
    if (currentStageIndex) {
      setCurrentStageIndex(parseInt(currentStageIndex));
    }
    
    if (currentTimeLeft) {
      setTimeLeft(parseInt(currentTimeLeft));
    }
    
    if (isTimerRunning) {
      setIsRunning(isTimerRunning === 'true');
    }

    // Crear servicio WebSocket
    const wsService = createWebSocketService({
      url: getWebSocketUrl(),
      room: 'meeting-reflection', // Sala para reflejo del timer
      type: 'timer',
      autoReconnect: true,
      maxReconnectAttempts: 10,
      reconnectDelay: 1000
    });

    // Configurar callbacks
    wsService.onConnectionChange((state) => {
      setConnectionState(state);
      console.log('Estado de conexión WebSocket:', state);
    });

    wsService.onCommand((command: CommandData) => {
      console.log('Comando recibido en MeetingView:', command);
      
      switch (command.action) {
        case 'setTime':
          if (command.data?.seconds !== undefined) {
            setTimeLeft(command.data.seconds);
            localStorage.setItem('currentTimeLeft', command.data.seconds.toString());
          }
          break;
        case 'setRunning':
          if (command.data?.isRunning !== undefined) {
            setIsRunning(command.data.isRunning);
            localStorage.setItem('isTimerRunning', command.data.isRunning.toString());
          }
          break;
        case 'nextStage':
          if (command.data?.stageIndex !== undefined) {
            setCurrentStageIndex(command.data.stageIndex);
            localStorage.setItem('currentStageIndex', command.data.stageIndex.toString());
            if (stages[command.data.stageIndex]) {
              const newTime = stages[command.data.stageIndex].duration;
              setTimeLeft(newTime);
              localStorage.setItem('currentTimeLeft', newTime.toString());
              localStorage.setItem('initialTime', newTime.toString());
            }
          }
          break;
        case 'previousStage':
          if (command.data?.stageIndex !== undefined) {
            setCurrentStageIndex(command.data.stageIndex);
            localStorage.setItem('currentStageIndex', command.data.stageIndex.toString());
            if (stages[command.data.stageIndex]) {
              const newTime = stages[command.data.stageIndex].duration;
              setTimeLeft(newTime);
              localStorage.setItem('currentTimeLeft', newTime.toString());
              localStorage.setItem('initialTime', newTime.toString());
            }
          }
          break;
        case 'addTime':
          const addSeconds = command.data?.seconds || 30;
          const newTimeAdd = timeLeft + addSeconds;
          setTimeLeft(newTimeAdd);
          localStorage.setItem('currentTimeLeft', newTimeAdd.toString());
          break;
        case 'subtractTime':
          const subSeconds = command.data?.seconds || 30;
          const newTimeSub = Math.max(0, timeLeft - subSeconds);
          setTimeLeft(newTimeSub);
          localStorage.setItem('currentTimeLeft', newTimeSub.toString());
          break;
        case 'pauseResume':
          const newRunningState = !isRunning;
          setIsRunning(newRunningState);
          localStorage.setItem('isTimerRunning', newRunningState.toString());
          break;
      }
    });

    wsService.onTimerState((state: TimerState) => {
      console.log('Estado del timer recibido:', state);
      // Sincronizar con el estado recibido
      if (state.currentTimeLeft !== undefined) {
        setTimeLeft(state.currentTimeLeft);
        localStorage.setItem('currentTimeLeft', state.currentTimeLeft.toString());
      }
      if (state.isRunning !== undefined) {
        setIsRunning(state.isRunning);
        localStorage.setItem('isTimerRunning', state.isRunning.toString());
      }
      if (state.currentStageIndex !== undefined) {
        setCurrentStageIndex(state.currentStageIndex);
        localStorage.setItem('currentStageIndex', state.currentStageIndex.toString());
      }
      if (state.stages && state.stages.length > 0) {
        setStages(state.stages);
        localStorage.setItem('meetingStages', JSON.stringify(state.stages));
      }
    });

    wsService.onError((error) => {
      console.error('Error WebSocket en MeetingView:', error);
    });

    // Conectar al servidor
    console.log('Conectando MeetingView al servidor WebSocket...');
    wsService.connect()
      .then(() => {
        console.log('MeetingView conectado exitosamente al servidor');
      })
      .catch((error) => {
        console.error('Error de conexión en MeetingView:', error);
      });

    // Cleanup al desmontar
    return () => {
      console.log('Desconectando MeetingView del servidor...');
      clearWebSocketService();
    };
  }, []);

  // Sincronizar con localStorage
  useEffect(() => {
    const syncWithLocalStorage = () => {
      const timeLeft = localStorage.getItem('currentTimeLeft');
      const isRunning = localStorage.getItem('isTimerRunning');
      const currentStage = localStorage.getItem('currentStageIndex');
      const stages = localStorage.getItem('meetingStages');
      
      if (timeLeft) {
        const seconds = parseInt(timeLeft);
        if (!isNaN(seconds)) {
          setTimeLeft(seconds);
        }
      }
      
      if (isRunning) {
        setIsRunning(isRunning === 'true');
      }
      
      if (currentStage) {
        const stageIndex = parseInt(currentStage);
        if (!isNaN(stageIndex)) {
          setCurrentStageIndex(stageIndex);
        }
      }
      
      if (stages) {
        try {
          const parsedStages = JSON.parse(stages);
          setStages(parsedStages);
        } catch (error) {
          console.log('Error parsing stages from localStorage:', error);
        }
      }
    };

    // Sincronizar cada 500ms
    const syncInterval = setInterval(syncWithLocalStorage, 500);
    
    // Verificación inicial
    syncWithLocalStorage();
    
    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  // Timer para contar regresivamente
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = Math.max(0, prev - 1);
          localStorage.setItem('currentTimeLeft', newTime.toString());
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft]);

  // Enviar estado del timer periódicamente
  useEffect(() => {
    const stateInterval = setInterval(() => {
      sendTimerState();
    }, 2000); // Enviar estado cada 2 segundos

    return () => {
      clearInterval(stateInterval);
    };
  }, [timeLeft, isRunning, currentStageIndex, stages]);

  // Efecto de alerta cuando queda poco tiempo
  useEffect(() => {
    if (timeLeft <= 15 && timeLeft > 0) {
      setIsAlertBlinking(true);
    } else {
      setIsAlertBlinking(false);
    }
  }, [timeLeft]);

  // Obtener color de fondo basado en el tiempo restante
  const getBackgroundColor = () => {
    if (!currentStage) return 'bg-gray-900';
    
    const timePercentage = (timeLeft / currentStage.duration) * 100;
    
    if (timePercentage <= 10) return 'bg-red-900';
    if (timePercentage <= 25) return 'bg-orange-900';
    if (timePercentage <= 50) return 'bg-yellow-900';
    return 'bg-gray-900';
  };

  return (
    <div className={`min-h-screen ${getBackgroundColor()} text-white flex items-center justify-center p-4 transition-colors duration-500`}>
      <div className="text-center">
        {/* Indicador de conexión */}
        <div className={`mb-4 px-3 py-1 rounded-full text-xs font-medium inline-block ${
          connectionState.connected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
            connectionState.connected ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          {connectionState.connected ? 'Conectado' : 'Desconectado'}
        </div>

        {/* Cronómetro principal */}
        <div className={`text-8xl font-mono font-bold mb-4 ${isAlertBlinking ? 'animate-pulse' : ''}`}>
          {formatTime(timeLeft)}
        </div>

        {/* Información de la etapa */}
        <div className="text-2xl mb-2">
          {currentStage?.title || 'Etapa'}
        </div>

        {/* Progreso */}
        <div className="text-lg text-gray-300">
          Etapa {currentStageIndex + 1} de {stages.length}
        </div>

        {/* Estado del timer */}
        <div className="mt-4 text-sm text-gray-400">
          {isRunning ? '▶️ Ejecutando' : '⏸️ Pausado'}
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-xs text-gray-500">
          <p>Reflejo del Cronómetro Principal</p>
          <p>Sincronizado en tiempo real</p>
        </div>
      </div>
    </div>
  );
};
