import React, { useState, useEffect } from 'react';
import { MeetingService } from '../services/meetingService';
import { Meeting } from '../lib/supabase';

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
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');

  // Sistema robusto de conexión
  const [connectionId] = useState(`control-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());
  const [heartbeatInterval, setHeartbeatInterval] = useState<NodeJS.Timeout | null>(null);
  const [reconnectionTimer, setReconnectionTimer] = useState<NodeJS.Timeout | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');
  const [connectionLatency, setConnectionLatency] = useState<number>(0);

  // Función para generar un ID único de conexión
  const generateConnectionId = () => {
    return `control-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Función para medir latencia de conexión
  const measureConnectionLatency = (): Promise<number> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      if (window.opener && !window.opener.closed && isConnected) {
        try {
          window.opener.postMessage({ 
            action: 'latencyTest', 
            data: { 
              timestamp: startTime,
              connectionId: connectionId 
            } 
          }, '*');
          
          // Esperar respuesta con timeout
          const timeout = setTimeout(() => {
            resolve(999); // Timeout
          }, 1000);
          
          const handleLatencyResponse = (event: MessageEvent) => {
            if (event.data.action === 'latencyResponse' && event.data.data.connectionId === connectionId) {
              clearTimeout(timeout);
              window.removeEventListener('message', handleLatencyResponse);
              const latency = Date.now() - startTime;
              resolve(latency);
            }
          };
          
          window.addEventListener('message', handleLatencyResponse);
        } catch (error) {
          resolve(999); // Error
        }
      } else {
        resolve(999); // No conectado
      }
    });
  };

  // Función para evaluar calidad de conexión
  const evaluateConnectionQuality = (latency: number): 'excellent' | 'good' | 'poor' | 'disconnected' => {
    if (latency >= 999) return 'disconnected';
    if (latency < 50) return 'excellent';
    if (latency < 200) return 'good';
    return 'poor';
  };

  // Función para enviar heartbeat
  const sendHeartbeat = () => {
    const now = Date.now();
    setLastHeartbeat(now);
    
    if (window.opener && !window.opener.closed && isConnected) {
      try {
        window.opener.postMessage({ 
          action: 'heartbeat', 
          data: { 
            timestamp: now,
            connectionId: connectionId,
            latency: connectionLatency
          } 
        }, '*');
      } catch (error) {
        console.log('Error enviando heartbeat:', error);
        handleConnectionError();
      }
    } else {
      // Fallback: enviar a localStorage
      localStorage.setItem('controlHeartbeat', JSON.stringify({
        timestamp: now,
        connectionId: connectionId,
        latency: connectionLatency
      }));
    }
  };

  // Función para manejar errores de conexión
  const handleConnectionError = () => {
    console.log('🔌 Error de conexión detectado, iniciando reconexión...');
    setIsConnected(false);
    setConnectionStatus('Reconectando...');
    setConnectionQuality('disconnected');
    
    // Limpiar timers existentes
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      setHeartbeatInterval(null);
    }
    if (reconnectionTimer) {
      clearTimeout(reconnectionTimer);
      setReconnectionTimer(null);
    }
    
    // Intentar reconexión
    attemptReconnection();
  };

  // Función para intentar reconexión
  const attemptReconnection = () => {
    const maxAttempts = 5;
    const attemptDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 10000); // Exponential backoff
    
    if (connectionAttempts >= maxAttempts) {
      console.log('❌ Máximo de intentos de reconexión alcanzado');
      setConnectionStatus('Error de conexión');
      setConnectionQuality('disconnected');
      return;
    }
    
    setConnectionAttempts(prev => prev + 1);
    setConnectionStatus(`Reconectando... (${connectionAttempts + 1}/${maxAttempts})`);
    
    const timer = setTimeout(() => {
      checkConnection();
      measureAndUpdateConnectionQuality();
    }, attemptDelay);
    
    setReconnectionTimer(timer);
  };

  // Función para medir y actualizar calidad de conexión
  const measureAndUpdateConnectionQuality = async () => {
    const latency = await measureConnectionLatency();
    setConnectionLatency(latency);
    
    const quality = evaluateConnectionQuality(latency);
    setConnectionQuality(quality);
    
    // Si la conexión es buena, resetear intentos
    if (quality !== 'disconnected') {
      setConnectionAttempts(0);
    }
  };

  // Función para forzar reconexión manual
  const forceReconnection = () => {
    console.log('🔄 Reconexión manual solicitada');
    setConnectionAttempts(0);
    handleConnectionError();
  };

  // Función para registrar conexión con el servidor principal
  const registerWithMainServer = () => {
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ 
          action: 'registerConnection', 
          data: { 
            connectionId: connectionId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
          } 
        }, '*');
      } catch (error) {
        console.log('Error registrando conexión:', error);
      }
    }
  };

  // Función para formatear tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para enviar mensajes a la ventana principal
  const sendMessageToMain = (action: string, data?: any) => {
    if (window.opener && !window.opener.closed && isConnected && connectionQuality !== 'disconnected') {
      try {
        const messageData = {
          action,
          data: {
            ...data,
            connectionId: connectionId,
            timestamp: Date.now(),
            latency: connectionLatency
          }
        };
        
        window.opener.postMessage(messageData, '*');
        console.log('📱 Enviando mensaje a ventana principal:', { action, data, connectionId });
        
        // Medir latencia después de enviar mensaje
        setTimeout(() => {
          measureAndUpdateConnectionQuality();
        }, 100);
        
        return true;
      } catch (error) {
        console.log('Error enviando mensaje a ventana principal:', error);
        handleConnectionError();
        return false;
      }
    } else {
      console.log('⚠️ No hay conexión válida con la ventana principal, usando localStorage');
      // Actualizar localStorage directamente como fallback
      try {
        switch (action) {
          case 'setTime':
            localStorage.setItem('currentTimeLeft', data.seconds.toString());
            break;
          case 'setRunning':
            localStorage.setItem('isTimerRunning', data.isRunning.toString());
            break;
          case 'nextStage':
            const nextIndex = Math.min(currentStageIndex + 1, stages.length - 1);
            localStorage.setItem('currentStageIndex', nextIndex.toString());
            if (stages[nextIndex]) {
              localStorage.setItem('currentTimeLeft', stages[nextIndex].duration.toString());
              localStorage.setItem('initialTime', stages[nextIndex].duration.toString());
            }
            break;
          case 'previousStage':
            const prevIndex = Math.max(currentStageIndex - 1, 0);
            localStorage.setItem('currentStageIndex', prevIndex.toString());
            if (stages[prevIndex]) {
              localStorage.setItem('currentTimeLeft', stages[prevIndex].duration.toString());
              localStorage.setItem('initialTime', stages[prevIndex].duration.toString());
            }
            break;
          case 'addTime':
            const newTimeAdd = currentTimeLeft + (data.seconds || 30);
            localStorage.setItem('currentTimeLeft', newTimeAdd.toString());
            break;
          case 'subtractTime':
            const newTimeSub = Math.max(0, currentTimeLeft - (data.seconds || 30));
            localStorage.setItem('currentTimeLeft', newTimeSub.toString());
            break;
        }
        console.log('📝 Actualización realizada en localStorage como fallback');
        return true;
      } catch (error) {
        console.log('Error actualizando localStorage:', error);
        return false;
      }
    }
  };

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
    }
  };

  // Control de etapas
  const handlePreviousStage = () => {
    if (currentStageIndex > 0) {
      const newIndex = currentStageIndex - 1;
      setCurrentStageIndex(newIndex);
      const newStageTime = stages[newIndex].duration;
      setCurrentTimeLeft(newStageTime);
      setIsTimerRunning(false);
      sendMessageToMain('previousStage', { stageIndex: newIndex });
    }
  };

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      const newIndex = currentStageIndex + 1;
      setCurrentStageIndex(newIndex);
      const newStageTime = stages[newIndex].duration;
      setCurrentTimeLeft(newStageTime);
      setIsTimerRunning(false);
      sendMessageToMain('nextStage', { stageIndex: newIndex });
    }
  };

  // Control del cronómetro
  const handlePauseResume = () => {
    const newRunningState = !isTimerRunning;
    setIsTimerRunning(newRunningState);
    sendMessageToMain('pauseResume', { isRunning: newRunningState });
  };

  const handleResetToZero = () => {
    setCurrentTimeLeft(0);
    setIsTimerRunning(false);
    sendMessageToMain('setTime', { seconds: 0 });
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
  const handleAddTime = () => {
    if (!isTimerRunning) {
      let newTime: number;
      if (currentTimeLeft === 0) {
        newTime = 30;
      } else {
        newTime = Math.ceil(currentTimeLeft / 30) * 30;
      }
      setCurrentTimeLeft(newTime);
      sendMessageToMain('setTime', { seconds: newTime });
    } else {
      const newTime = currentTimeLeft + 30;
      setCurrentTimeLeft(newTime);
      sendMessageToMain('addTime', { seconds: 30 });
    }
  };

  const handleSubtractTime = () => {
    if (!isTimerRunning) {
      const newTime = Math.max(0, Math.floor(currentTimeLeft / 30) * 30);
      setCurrentTimeLeft(newTime);
      sendMessageToMain('setTime', { seconds: newTime });
    } else {
      const newTime = Math.max(0, currentTimeLeft - 30);
      setCurrentTimeLeft(newTime);
      sendMessageToMain('subtractTime', { seconds: 30 });
    }
  };

  // Verificar conexión con ventana principal
  const checkConnection = () => {
    const hasOpener = window.opener && !window.opener.closed;
    
    // Verificar si la ventana principal está en el mismo dominio
    let isSameOrigin = false;
    try {
      if (hasOpener) {
        // Intentar acceder a la ubicación para verificar el mismo origen
        const openerOrigin = window.opener.location.origin;
        const currentOrigin = window.location.origin;
        isSameOrigin = openerOrigin === currentOrigin;
      }
    } catch (error) {
      // Si hay error de acceso, probablemente es por políticas de seguridad
      console.log('No se puede verificar el origen de la ventana principal:', error);
    }
    
    const isConnected = hasOpener && isSameOrigin;
    setIsConnected(isConnected);
    setConnectionStatus(isConnected ? 'Conectado' : 'Desconectado');
    
    // Si hay conexión válida, enviar ping para verificar
    if (isConnected) {
      try {
        window.opener.postMessage({ action: 'ping', data: { from: 'control' } }, '*');
      } catch (error) {
        console.log('Error enviando ping:', error);
        setIsConnected(false);
        setConnectionStatus('Error de conexión');
      }
    }
  };

  // Sincronización con localStorage y verificación de conexión
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

    // Verificar conexión cada 3 segundos
    const connectionInterval = setInterval(checkConnection, 3000);
    
    // Sincronizar cada 500ms para mayor responsividad
    const syncInterval = setInterval(syncWithLocalStorage, 500);
    
    // Enviar heartbeat cada 2 segundos
    const heartbeatTimer = setInterval(sendHeartbeat, 2000);
    setHeartbeatInterval(heartbeatTimer);
    
    // Medir calidad de conexión cada 10 segundos
    const qualityTimer = setInterval(measureAndUpdateConnectionQuality, 10000);
    
    // Verificación inicial
    checkConnection();
    syncWithLocalStorage();
    registerWithMainServer();
    measureAndUpdateConnectionQuality();
    
    return () => {
      clearInterval(connectionInterval);
      clearInterval(syncInterval);
      clearInterval(heartbeatTimer);
      clearInterval(qualityTimer);
    };
  }, [connectionId]);

  // Escuchar respuestas de la ventana principal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { action, data } = event.data;
      
      switch (action) {
        case 'pong':
          console.log('📡 Pong recibido de ventana principal');
          setIsConnected(true);
          setConnectionStatus('Conectado');
          break;
        case 'heartbeat':
          console.log('💓 Heartbeat recibido de ventana principal');
          if (data.connectionId === connectionId) {
            setLastHeartbeat(Date.now());
            // Responder al heartbeat
            if (event.source && event.source !== window) {
              (event.source as Window).postMessage({ 
                action: 'heartbeat', 
                data: { 
                  timestamp: Date.now(),
                  connectionId: connectionId,
                  latency: connectionLatency
                } 
              }, '*');
            }
          }
          break;
        case 'connectionRegistered':
          console.log('✅ Conexión registrada exitosamente');
          setIsConnected(true);
          setConnectionStatus('Conectado');
          setConnectionAttempts(0);
          // Sincronizar estado
          if (data.stages) {
            setStages(data.stages);
          }
          if (data.currentStageIndex !== undefined) {
            setCurrentStageIndex(data.currentStageIndex);
          }
          if (data.isTimerRunning !== undefined) {
            setIsTimerRunning(data.isTimerRunning);
          }
          if (data.currentTimeLeft) {
            setCurrentTimeLeft(parseInt(data.currentTimeLeft));
          }
          break;
        case 'forceReconnect':
          console.log('🔄 Reconexión forzada solicitada por servidor principal');
          forceReconnection();
          break;
        case 'latencyResponse':
          if (data.connectionId === connectionId) {
            const latency = Date.now() - data.timestamp;
            setConnectionLatency(latency);
            const quality = evaluateConnectionQuality(latency);
            setConnectionQuality(quality);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [connectionId, connectionLatency]);

  // Cargar datos al iniciar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get('meeting');
    
    if (meetingId) {
      loadMeetingData(meetingId);
    }
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
          
          {/* Indicador de estado de conexión */}
          <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            {connectionStatus}
          </div>
          
          {/* Indicador de calidad de conexión */}
          {isConnected && (
            <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                connectionQuality === 'excellent' ? 'bg-green-500' :
                connectionQuality === 'good' ? 'bg-yellow-500' :
                connectionQuality === 'poor' ? 'bg-orange-500' : 'bg-red-500'
              }`}></span>
              {connectionQuality === 'excellent' ? 'Excelente' :
               connectionQuality === 'good' ? 'Buena' :
               connectionQuality === 'poor' ? 'Pobre' : 'Desconectado'} 
              {connectionLatency > 0 && connectionLatency < 999 && ` (${connectionLatency}ms)`}
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleSubtractTime}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex flex-col items-center"
          >
            <span className="text-2xl mb-1">➖</span>
            <span className="text-xs">-30s</span>
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
          
          {!isConnected && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs">
                <strong>⚠️ Control Remoto Desconectado</strong><br/>
                Estado: {connectionStatus}<br/>
                Para usar como control remoto, abre este enlace desde la misma pestaña donde tienes el panel principal abierto.<br/>
                <span className="text-xs opacity-75">Los controles funcionarán con sincronización local.</span>
              </p>
            </div>
          )}
          
          {isConnected && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-xs">
                <strong>✅ Control Remoto Activo</strong><br/>
                Estado: {connectionStatus}<br/>
                Los controles afectan directamente al cronómetro principal en tiempo real.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
