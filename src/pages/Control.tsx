import React, { useState, useEffect } from 'react';
import { VersionInfo } from '../components/VersionInfo';
import { MeetingService } from '../services/meetingService';
import { Meeting } from '../lib/supabase';
import { createSyncService } from '../services/syncChannel';
import { ConnectionState } from '../types/timer';

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
  
  // Estado de conexión SyncChannel
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
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

  // Inicializar SyncChannel
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    
    if (!meetingId) {
      addConnectionLog('❌ No se encontró ID de directorio en la URL');
      return;
    }

    // Crear servicio de sincronización
    const syncService = createSyncService();
    syncService.setDirectoryId(meetingId);
    syncService.setIsMainWindow(false);

    // Configurar callbacks
    syncService.onConnection((state) => {
      setConnectionState(state);
      addConnectionLog(`Estado de conexión: ${state.connected ? 'Conectado' : 'Desconectado'}`);
      if (state.error) {
        addConnectionLog(`Error: ${state.error}`);
      }
    });

    syncService.onMessage((message) => {
      if (message.type === 'CONTROL') {
        addConnectionLog(`Comando recibido: ${message.data.action}`);
        handleCommand(message.data);
      }
    });

    syncService.onError((error) => {
      addConnectionLog(`Error SyncChannel: ${error}`);
    });

    // Iniciar heartbeat
    syncService.startHeartbeat();
    addConnectionLog('✅ Servicio de sincronización inicializado');

    // Cleanup al desmontar
    return () => {
      addConnectionLog('🔌 Desconectando servicio de sincronización...');
      syncService.disconnect();
    };
  }, []);

  // Cargar datos del directorio
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    
    if (!meetingId) return;

    const loadMeeting = async () => {
      try {
        const { meeting, stages: meetingStages } = await MeetingService.getMeetingWithStages(meetingId);
        
        const convertedStages: Stage[] = meetingStages.map((stage: any) => ({
          id: stage.id,
          title: stage.title,
          description: '',
          duration: stage.duration,
          order_index: stage.order_index,
          is_completed: stage.is_completed
        }));
        
        setMeeting(meeting);
        setStages(convertedStages);
        
        if (convertedStages.length > 0) {
          setCurrentTimeLeft(convertedStages[0].duration * 60);
        }
        
        addConnectionLog(`✅ Directorio cargado: ${meeting.title}`);
      } catch (error) {
        addConnectionLog(`❌ Error cargando directorio: ${error}`);
      }
    };

    loadMeeting();
  }, []);

  // Manejar comandos recibidos
  const handleCommand = (command: any) => {
    switch (command.action) {
      case 'setTime':
        setCurrentTimeLeft(command.seconds);
        break;
      case 'setStage':
        setCurrentStageIndex(command.stageIndex);
        break;
      case 'setStages':
        setStages(command.stages);
        break;
      case 'play':
        setIsTimerRunning(true);
        break;
      case 'pause':
        setIsTimerRunning(false);
        break;
      case 'reset':
        setIsTimerRunning(false);
        setCurrentTimeLeft(stages[currentStageIndex]?.duration * 60 || 0);
        break;
      default:
        addConnectionLog(`Comando no reconocido: ${command.action}`);
    }
  };

  // Enviar comando al directorio principal
  const sendCommand = (action: string, data?: any) => {
    const syncService = createSyncService();
    if (syncService.isConnected()) {
      syncService.sendControlCommand(action, data);
      addConnectionLog(`Comando enviado: ${action}`);
    } else {
      addConnectionLog('❌ No hay conexión para enviar comando');
    }
  };

  // Controles del timer
  const handlePlayPause = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      sendCommand('pause');
    } else {
      setIsTimerRunning(true);
      sendCommand('play');
    }
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    setCurrentTimeLeft(stages[currentStageIndex]?.duration * 60 || 0);
    sendCommand('reset');
  };

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      const newIndex = currentStageIndex + 1;
      setCurrentStageIndex(newIndex);
      setCurrentTimeLeft(stages[newIndex].duration * 60);
      sendCommand('setStage', { stageIndex: newIndex });
      sendCommand('setTime', { seconds: stages[newIndex].duration * 60 });
    }
  };

  const handlePrevStage = () => {
    if (currentStageIndex > 0) {
      const newIndex = currentStageIndex - 1;
      setCurrentStageIndex(newIndex);
      setCurrentTimeLeft(stages[newIndex].duration * 60);
      sendCommand('setStage', { stageIndex: newIndex });
      sendCommand('setTime', { seconds: stages[newIndex].duration * 60 });
    }
  };

  const handleAddTime = () => {
    const newTime = currentTimeLeft + 30;
    setCurrentTimeLeft(newTime);
    sendCommand('setTime', { seconds: newTime });
  };

  const handleSubTime = () => {
    const newTime = Math.max(0, currentTimeLeft - 30);
    setCurrentTimeLeft(newTime);
    sendCommand('setTime', { seconds: newTime });
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && currentTimeLeft > 0) {
      interval = setInterval(() => {
        setCurrentTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentTimeLeft]);

  // Long press handlers
  const handleMouseDown = (action: () => void) => {
    setIsLongPress(true);
    const timer = setTimeout(() => {
      action();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPress(false);
  };

  const handleMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsLongPress(false);
  };

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Cargando Directorio...
          </h2>
          <p className="text-gray-600">
            Por favor espera mientras se cargan los datos del directorio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {meeting.title}
              </h1>
              <p className="text-sm text-gray-600">
                Control de Directorio
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <VersionInfo />
              <button
                onClick={() => setShowConnectionLogs(!showConnectionLogs)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  connectionState.connected 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {connectionState.connected ? '🟢 Conectado' : '🔴 Desconectado'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
                  {formatTime(currentTimeLeft)}
                </div>
                
                <div className="text-xl text-gray-600 mb-8">
                  {stages[currentStageIndex]?.title || 'Sin etapa'}
                </div>

                {/* Timer Controls */}
                <div className="flex justify-center space-x-4 mb-8">
                  <button
                    onClick={handlePlayPause}
                    className={`px-6 py-3 rounded-lg font-semibold text-white ${
                      isTimerRunning 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {isTimerRunning ? '⏸️ Pausar' : '▶️ Iniciar'}
                  </button>
                  
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold"
                  >
                    🔄 Reset
                  </button>
                </div>

                {/* Stage Controls */}
                <div className="flex justify-center space-x-4 mb-8">
                  <button
                    onClick={handlePrevStage}
                    disabled={currentStageIndex === 0}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-semibold"
                  >
                    ⏮️ Anterior
                  </button>
                  
                  <button
                    onClick={handleNextStage}
                    disabled={currentStageIndex === stages.length - 1}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-semibold"
                  >
                    Siguiente ⏭️
                  </button>
                </div>

                {/* Time Adjustment */}
                <div className="flex justify-center space-x-4">
                  <button
                    onMouseDown={() => handleMouseDown(handleSubTime)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
                  >
                    -30s
                  </button>
                  
                  <button
                    onMouseDown={() => handleMouseDown(handleAddTime)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
                  >
                    +30s
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stages List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Etapas del Directorio
              </h3>
              
              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <div
                    key={stage.id || index}
                    className={`p-3 rounded-lg border-2 ${
                      index === currentStageIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {stage.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(stage.duration * 60)}
                        </div>
                      </div>
                      {index === currentStageIndex && (
                        <div className="text-blue-500 font-bold">
                          ACTUAL
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Logs Modal */}
      {showConnectionLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Logs de Conexión</h3>
              <button
                onClick={() => setShowConnectionLogs(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-80">
              <div className="space-y-1">
                {connectionLogs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};