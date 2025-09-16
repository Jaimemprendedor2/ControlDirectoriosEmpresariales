import React, { useState, useEffect } from 'react';
import { MeetingService } from '../services/meetingService';
import { Meeting } from '../lib/supabase';
import { createPusherService, getPusherService, ConnectionState, CommandData } from '../services/pusherService';

interface Stage {
  id?: string;
  title: string;
  description?: string;
  duration: number;
  order_index?: number;
  is_completed?: boolean;
}

export const Control: React.FC = () => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimeLeft, setCurrentTimeLeft] = useState(0);
  const [isLongPress, setIsLongPress] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Estado de conexión Pusher
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
    latency: 0
  });
  
  const [showConnectionLogs, setShowConnectionLogs] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

  // Función para agregar logs de conexión
  const addConnectionLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setConnectionLogs(prev => [...prev.slice(-50), logEntry]); // Mantener solo últimos 50 logs
  };

  // Función para formatear tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para obtener configuración de Pusher
  const getPusherConfig = () => {
    return {
      appKey: import.meta.env.VITE_PUSHER_KEY || 'tu_pusher_key_aqui',
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'tu_cluster_aqui'
    };
  };

  // Inicializar Pusher
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    
    if (!meetingId) {
      addConnectionLog('❌ No se encontró ID de directorio en la URL');
      return;
    }

    // Crear servicio Pusher
    const pusherConfig = getPusherConfig();
    const pusherService = createPusherService({
      appKey: pusherConfig.appKey,
      cluster: pusherConfig.cluster,
      room: meetingId
    });

    // Configurar callbacks
    pusherService.onConnectionChange((state) => {
      setConnectionState(state);
      addConnectionLog(`Estado de conexión: ${state.connected ? 'Conectado' : 'Desconectado'}`);
      if (state.error) {
        addConnectionLog(`Error: ${state.error}`);
      }
    });

    pusherService.onCommand((command: CommandData) => {
      addConnectionLog(`Comando recibido: ${command.action}`);
      // Los comandos se manejan en el timer, no en el control
    });

    pusherService.onError((error) => {
      addConnectionLog(`Error Pusher: ${error}`);
    });

    // Conectar al servidor
    addConnectionLog('🔄 Conectando a Pusher...');
    pusherService.connect()
      .then(() => {
        addConnectionLog('✅ Conectado exitosamente a Pusher');
      })
      .catch((error) => {
        addConnectionLog(`❌ Error de conexión: ${error.message}`);
      });

    // Cleanup al desmontar
    return () => {
      addConnectionLog('🔌 Desconectando de Pusher...');
      pusherService.disconnect();
    };
  }, []);

  // Cargar datos del directorio
  const loadMeetingData = async (meetingId: string) => {
    try {
      const { meeting: meetingData, stages: meetingStages } = await MeetingService.getMeetingWithStages(meetingId);
      
      const convertedStages: Stage[] = meetingStages.map(stage => ({
        id: stage.id,
        title: stage.title,
        description: '',
        duration: stage.duration,
        order_index: stage.order_index,
        is_completed: stage.is_completed
      }));

      setMeeting(meetingData);
      setStages(convertedStages);
      
      // Inicializar con la primera etapa
      if (convertedStages.length > 0) {
        setCurrentTimeLeft(convertedStages[0].duration);
      }
    } catch (error) {
      console.error('Error cargando directorio:', error);
      addConnectionLog(`❌ Error cargando directorio: ${error}`);
    }
  };

  // Función para enviar comandos
  const sendCommand = async (action: string, data?: any) => {
    const pusherService = getPusherService();
    if (!pusherService) {
      addConnectionLog('❌ Servicio Pusher no disponible');
      return false;
    }

    if (!pusherService.isConnected()) {
      addConnectionLog('⚠️ No conectado a Pusher, comando no enviado');
      return false;
    }

    addConnectionLog(`📤 Enviando comando: ${action}`);
    try {
      pusherService.sendCommand({
        action,
        data,
        timestamp: Date.now(),
        source: 'control'
      });
      addConnectionLog(`✅ Comando enviado exitosamente: ${action}`);
      return true;
    } catch (error) {
      addConnectionLog(`❌ Error enviando comando: ${action}`);
      return false;
    }
  };

  // Control de etapas
  const handlePreviousStage = async () => {
    if (currentStageIndex > 0) {
      const newIndex = currentStageIndex - 1;
      setCurrentStageIndex(newIndex);
      const newStageTime = stages[newIndex].duration;
      setCurrentTimeLeft(newStageTime);
      setIsTimerRunning(false);
      
      const success = await sendCommand('previousStage', { stageIndex: newIndex });
      if (!success) {
        // Fallback a localStorage
        localStorage.setItem('currentStageIndex', newIndex.toString());
        localStorage.setItem('currentTimeLeft', newStageTime.toString());
        localStorage.setItem('initialTime', newStageTime.toString());
        localStorage.setItem('isTimerRunning', 'false');
      }
    }
  };

  const handleNextStage = async () => {
    if (currentStageIndex < stages.length - 1) {
      const newIndex = currentStageIndex + 1;
      setCurrentStageIndex(newIndex);
      const newStageTime = stages[newIndex].duration;
      setCurrentTimeLeft(newStageTime);
      setIsTimerRunning(false);
      
      const success = await sendCommand('nextStage', { stageIndex: newIndex });
      if (!success) {
        // Fallback a localStorage
        localStorage.setItem('currentStageIndex', newIndex.toString());
        localStorage.setItem('currentTimeLeft', newStageTime.toString());
        localStorage.setItem('initialTime', newStageTime.toString());
        localStorage.setItem('isTimerRunning', 'false');
      }
    }
  };

  // Control del cronómetro
  const handlePauseResume = async () => {
    const newRunningState = !isTimerRunning;
    setIsTimerRunning(newRunningState);
    
    const success = await sendCommand('pauseResume', { isRunning: newRunningState });
    if (!success) {
      // Fallback a localStorage
      localStorage.setItem('isTimerRunning', newRunningState.toString());
    }
  };

  const handleResetToZero = async () => {
    setCurrentTimeLeft(0);
    setIsTimerRunning(false);
    
    const success = await sendCommand('setTime', { seconds: 0 });
    if (!success) {
      // Fallback a localStorage
      localStorage.setItem('currentTimeLeft', '0');
      localStorage.setItem('isTimerRunning', 'false');
    }
  };

  // Función para parar el cronómetro completamente
  const handleStopTimer = async () => {
    setCurrentTimeLeft(0);
    setIsTimerRunning(false);
    setCurrentStageIndex(0);
    
    const success = await sendCommand('stopTimer', {});
    if (!success) {
      // Fallback a localStorage
      localStorage.removeItem('currentTimeLeft');
      localStorage.removeItem('initialTime');
      localStorage.removeItem('isTimerRunning');
      localStorage.removeItem('currentStageIndex');
      localStorage.removeItem('meetingStages');
    }
  };

  // Manejo de presión prolongada
  const handlePauseButtonTouchStart = () => {
    setIsLongPress(false);
    const timer = setTimeout(() => {
      setIsLongPress(true);
      handleResetToZero();
    }, 1000);
    setLongPressTimer(timer);
  };

  const handlePauseButtonTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (!isLongPress) {
      handlePauseResume();
    }
    
    setTimeout(() => setIsLongPress(false), 200);
  };

  // Control de tiempo
  const handleAddTime = async () => {
    if (!isTimerRunning) {
      let newTime: number;
      if (currentTimeLeft === 0) {
        newTime = 30;
      } else {
        newTime = Math.ceil(currentTimeLeft / 30) * 30;
      }
      setCurrentTimeLeft(newTime);
      
      const success = await sendCommand('setTime', { seconds: newTime });
      if (!success) {
        // Fallback a localStorage
        localStorage.setItem('currentTimeLeft', newTime.toString());
      }
    } else {
      const newTime = currentTimeLeft + 30;
      setCurrentTimeLeft(newTime);
      
      const success = await sendCommand('addTime', { seconds: 30 });
      if (!success) {
        // Fallback a localStorage
        localStorage.setItem('currentTimeLeft', newTime.toString());
      }
    }
  };

  const handleSubtractTime = async () => {
    if (!isTimerRunning) {
      const newTime = Math.max(0, Math.floor(currentTimeLeft / 30) * 30);
      setCurrentTimeLeft(newTime);
      
      const success = await sendCommand('setTime', { seconds: newTime });
      if (!success) {
        // Fallback a localStorage
        localStorage.setItem('currentTimeLeft', newTime.toString());
      }
    } else {
      const newTime = Math.max(0, currentTimeLeft - 30);
      setCurrentTimeLeft(newTime);
      
      const success = await sendCommand('subtractTime', { seconds: 30 });
      if (!success) {
        // Fallback a localStorage
        localStorage.setItem('currentTimeLeft', newTime.toString());
      }
    }
  };

  // Función para forzar reconexión
  const forceReconnection = () => {
    const pusherService = getPusherService();
    if (pusherService) {
      addConnectionLog('🔄 Reconexión manual solicitada');
      pusherService.disconnect();
      pusherService.connect();
    }
  };

  // Sincronización con localStorage como fallback
  useEffect(() => {
    const syncWithLocalStorage = () => {
      const timeLeft = localStorage.getItem('currentTimeLeft');
      const isRunning = localStorage.getItem('isTimerRunning');
      const currentStage = localStorage.getItem('currentStageIndex');
      const stages = localStorage.getItem('meetingStages');
      
      if (timeLeft) {
        const seconds = parseInt(timeLeft);
        if (!isNaN(seconds)) {
          setCurrentTimeLeft(seconds);
        }
      }
      
      if (isRunning) {
        setIsTimerRunning(isRunning === 'true');
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

    // Sincronizar cada 500ms para mayor responsividad
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
    
    if (isTimerRunning && currentTimeLeft > 0) {
      interval = setInterval(() => {
        setCurrentTimeLeft(prev => {
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
  }, [isTimerRunning, currentTimeLeft]);

  // Cargar datos al iniciar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    
    if (meetingId) {
      loadMeetingData(meetingId);
    }
  }, []);

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-xl font-semibold text-gray-700">Cargando directorio...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{meeting.title}</h1>
          <p className="text-gray-400 text-sm">Control Remoto</p>
          
          {/* Indicador de estado de conexión unificado */}
          <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
            connectionState.connected 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : connectionState.connecting
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              connectionState.connected ? 'bg-green-500' : 
              connectionState.connecting ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            {connectionState.connected ? 'Conectado' : 
             connectionState.connecting ? `Conectando... (${connectionState.reconnectAttempts}/10)` : 
             connectionState.error ? 'Error' : 'Desconectado'}
          </div>
          
          {/* Indicador de latencia solo cuando está conectado */}
          {connectionState.connected && connectionState.latency > 0 && (
            <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Latencia: {connectionState.latency}ms
            </div>
          )}
        </header>

        {/* Cronómetro principal */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 text-center">
          <div className="text-6xl font-mono font-bold mb-2">
            {formatTime(currentTimeLeft)}
          </div>
          <div className="text-lg text-gray-300">
            {stages[currentStageIndex]?.title || 'Etapa'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Etapa {currentStageIndex + 1} de {stages.length}
          </div>
        </div>

        {/* Controles principales */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={handlePreviousStage}
            disabled={currentStageIndex === 0}
            className="p-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors flex flex-col items-center"
          >
            <span className="text-2xl mb-1">⏮️</span>
            <span className="text-xs">Anterior</span>
          </button>

          <button
            onTouchStart={handlePauseButtonTouchStart}
            onTouchEnd={handlePauseButtonTouchEnd}
            onMouseDown={handlePauseButtonTouchStart}
            onMouseUp={handlePauseButtonTouchEnd}
            className="p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex flex-col items-center relative"
          >
            <span className="text-2xl mb-1">{isTimerRunning ? '⏸️' : '▶️'}</span>
            <span className="text-xs">{isTimerRunning ? 'Pausar' : 'Reanudar'}</span>
            {isLongPress && (
              <div className="absolute inset-0 bg-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🔄</span>
              </div>
            )}
          </button>

          <button
            onClick={handleNextStage}
            disabled={currentStageIndex >= stages.length - 1}
            className="p-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors flex flex-col items-center"
          >
            <span className="text-2xl mb-1">⏭️</span>
            <span className="text-xs">Siguiente</span>
          </button>
        </div>

        {/* Controles de tiempo */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleSubtractTime}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex flex-col items-center"
          >
            <span className="text-2xl mb-1">➖</span>
            <span className="text-xs">-30s</span>
          </button>

          <button
            onClick={handleStopTimer}
            className="p-4 bg-red-800 hover:bg-red-900 rounded-lg transition-colors flex flex-col items-center"
            title="Parar y resetear cronómetro completamente"
          >
            <span className="text-2xl mb-1">🛑</span>
            <span className="text-xs">Parar</span>
          </button>

          <button
            onClick={handleAddTime}
            className="p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex flex-col items-center"
          >
            <span className="text-2xl mb-1">➕</span>
            <span className="text-xs">+30s</span>
          </button>
        </div>

        {/* Lista de etapas */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Etapas</h3>
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div
                key={stage.id || index}
                className={`p-3 rounded-lg transition-colors ${
                  index === currentStageIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{stage.title}</div>
                    <div className="text-sm opacity-75">{formatTime(stage.duration)}</div>
                  </div>
                  <div className="text-sm opacity-75">
                    {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Mantén presionado el botón central por 1 segundo para resetear</p>
          <p className="mt-1">Sincronizado con el panel principal</p>
          
          {/* Botón de reconexión manual */}
          <button
            onClick={forceReconnection}
            className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-lg transition-colors"
            title="Forzar reconexión manual"
          >
            🔄 Reconectar Manualmente
          </button>
          
          {/* Botón para mostrar logs */}
          <button
            onClick={() => setShowConnectionLogs(!showConnectionLogs)}
            className="mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
            title="Ver logs de conexión"
          >
            📋 {showConnectionLogs ? 'Ocultar' : 'Ver'} Logs
          </button>
          
          {!connectionState.connected && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs">
                <strong>⚠️ Control Remoto Desconectado</strong><br/>
                {connectionState.error ? `Error: ${connectionState.error}` : 'No hay conexión con el servidor'}<br/>
                Los controles funcionarán con sincronización local.<br/>
                <span className="text-xs opacity-75">Asegúrate de que Pusher esté configurado correctamente.</span>
              </p>
            </div>
          )}
          
          {connectionState.connected && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-xs">
                <strong>✅ Control Remoto Activo</strong><br/>
                Conectado a Pusher<br/>
                Los controles afectan directamente al cronómetro principal en tiempo real.
              </p>
            </div>
          )}
        </div>

        {/* Logs de conexión */}
        {showConnectionLogs && (
          <div className="mt-4 bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Logs de Conexión</h3>
            <div className="bg-gray-900 rounded p-3 h-40 overflow-y-auto text-xs font-mono">
              {connectionLogs.length === 0 ? (
                <p className="text-gray-500">No hay logs disponibles</p>
              ) : (
                connectionLogs.map((log, index) => (
                  <div key={index} className="text-gray-300 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setConnectionLogs([])}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
            >
              Limpiar Logs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
