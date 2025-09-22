import React, { useState, useEffect } from 'react';
import { VersionInfo } from '../components/VersionInfo';
import { createSyncService, SyncMessage, TimerState } from '../services/syncChannel';

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
  alertSeconds?: number;
}

export const MeetingView: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0);
  const [syncService, setSyncService] = useState<any>(null);

  // Establecer título de la ventana
  useEffect(() => {
    document.title = "Ventana Cronómetro";
  }, []);

  // Inicializar servicio de sincronización
  useEffect(() => {
    const service = createSyncService();
    service.setIsMainWindow(false);
    service.startHeartbeat();
    
    // Configurar callbacks
    service.onMessage((message: SyncMessage) => {
      console.log('📨 Mensaje recibido en MeetingView:', message);
      
      if (message.type === 'TICK') {
        // Actualizar estado del timer
        const timerState = message.data as TimerState;
        setTimeLeft(timerState.currentTimeLeft);
        setIsRunning(timerState.isRunning);
        setCurrentStageIndex(timerState.currentStageIndex);
        setStages(timerState.stages);
      } else if (message.type === 'CONTROL') {
        // Procesar comandos de control
        const { action, ...data } = message.data;
        handleControlCommand(action, data);
      } else if (message.type === 'SYNC_REQUEST') {
        // Responder con estado actual
        const currentState: TimerState = {
          currentTimeLeft: timeLeft,
          isRunning,
          currentStageIndex,
          stages,
          timestamp: Date.now()
        };
        service.respondToSync(currentState);
      }
    });
    
    service.onConnection((state) => {
      console.log('🔌 Estado de conexión:', state);
    });
    
    setSyncService(service);
    
    // Solicitar sincronización inicial
    service.requestSync();
    
    return () => {
      service.disconnect();
    };
  }, []);

  // Función para manejar comandos de control
  const handleControlCommand = (action: string, data: any) => {
    console.log('🎮 Comando de control recibido:', action, data);
    
    switch (action) {
      case 'pauseResume':
        setIsRunning(data.isRunning);
        break;
      case 'nextStage':
        if (data.stageIndex !== undefined) {
          setCurrentStageIndex(data.stageIndex);
        }
        break;
      case 'previousStage':
        if (data.stageIndex !== undefined) {
          setCurrentStageIndex(data.stageIndex);
        }
        break;
      case 'setTime':
        if (data.seconds !== undefined) {
          setTimeLeft(data.seconds);
        }
        break;
      case 'addTime':
        if (data.seconds !== undefined) {
          setTimeLeft(prev => prev + data.seconds);
        }
        break;
      case 'subtractTime':
        if (data.seconds !== undefined) {
          setTimeLeft(prev => Math.max(0, prev - data.seconds));
        }
        break;
      case 'setStages':
        if (data.stages) {
          setStages(data.stages);
        }
        break;
      default:
        console.log('⚠️ Comando de control no reconocido:', action);
    }
  };

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    const loadInitialState = () => {
      try {
        const savedStages = localStorage.getItem('meetingStages');
        const savedCurrentStage = localStorage.getItem('currentStageIndex');
        const savedTimeLeft = localStorage.getItem('timeLeft');
        const savedIsRunning = localStorage.getItem('isRunning');
        const savedTotalTime = localStorage.getItem('totalTime');
        const savedStartTime = localStorage.getItem('startTime');
        const savedPausedTime = localStorage.getItem('pausedTime');

        console.log('🔄 Cargando estado inicial desde localStorage...');

        if (savedStages) {
          const parsedStages = JSON.parse(savedStages);
          setStages(parsedStages);
          console.log('✅ Stages cargados:', parsedStages);
        }

        if (savedCurrentStage !== null) {
          const stageIndex = parseInt(savedCurrentStage);
          setCurrentStageIndex(stageIndex);
          console.log('✅ Stage actual cargado:', stageIndex);
        }

        if (savedTimeLeft !== null) {
          const time = parseInt(savedTimeLeft);
          setTimeLeft(time);
          console.log('✅ Tiempo restante cargado:', time);
        }

        if (savedIsRunning !== null) {
          const running = savedIsRunning === 'true';
          setIsRunning(running);
          console.log('✅ Estado de ejecución cargado:', running);
        }

        if (savedTotalTime !== null) {
          const total = parseInt(savedTotalTime);
          setTotalTime(total);
          console.log('✅ Tiempo total cargado:', total);
        }

        if (savedStartTime !== null) {
          const start = parseInt(savedStartTime);
          setStartTime(start);
          console.log('✅ Tiempo de inicio cargado:', start);
        }

        if (savedPausedTime !== null) {
          const paused = parseInt(savedPausedTime);
          setPausedTime(paused);
          console.log('✅ Tiempo pausado cargado:', paused);
        }

        // Si no hay tiempo restante pero hay stages, inicializar con el primer stage
        if (savedTimeLeft === null && savedStages) {
          const parsedStages = JSON.parse(savedStages);
          if (parsedStages.length > 0) {
            const firstStage = parsedStages[0];
            setTimeLeft(firstStage.duration);
            setTotalTime(firstStage.duration);
            console.log('🔄 Inicializando con primer stage:', firstStage);
          }
        }
      } catch (error) {
        console.error('❌ Error cargando estado inicial:', error);
      }
    };

    loadInitialState();
  }, []);

  // Escuchar mensajes de la ventana principal (fallback para postMessage)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Solo procesar mensajes que no sean del servicio de sincronización
      if (event.data && event.data.source === 'housenovo-directorios') {
        return; // Ya procesado por el servicio de sincronización
      }
      
      console.log('📨 Mensaje postMessage recibido:', event.data);
      handleControlCommand(event.data.action, event.data);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sincronización con localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'meetingStages' && e.newValue) {
        const parsedStages = JSON.parse(e.newValue);
        setStages(parsedStages);
        console.log('🔄 Stages sincronizados desde localStorage');
      }
      
      if (e.key === 'currentStageIndex' && e.newValue !== null) {
        setCurrentStageIndex(parseInt(e.newValue));
        console.log('🔄 Stage actual sincronizado desde localStorage');
      }
      
      if (e.key === 'timeLeft' && e.newValue !== null) {
        setTimeLeft(parseInt(e.newValue));
        console.log('🔄 Tiempo restante sincronizado desde localStorage');
      }
      
      if (e.key === 'isRunning' && e.newValue !== null) {
        setIsRunning(e.newValue === 'true');
        console.log('🔄 Estado de ejecución sincronizado desde localStorage');
      }
      
      if (e.key === 'isPaused' && e.newValue !== null) {
        setIsPaused(e.newValue === 'true');
        console.log('🔄 Estado de pausa sincronizado desde localStorage');
      }
      
      if (e.key === 'totalTime' && e.newValue !== null) {
        setTotalTime(parseInt(e.newValue));
        console.log('🔄 Tiempo total sincronizado desde localStorage');
      }
      
      if (e.key === 'startTime' && e.newValue !== null) {
        setStartTime(parseInt(e.newValue));
        console.log('🔄 Tiempo de inicio sincronizado desde localStorage');
      }
      
      if (e.key === 'pausedTime' && e.newValue !== null) {
        setPausedTime(parseInt(e.newValue));
        console.log('🔄 Tiempo pausado sincronizado desde localStorage');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ELIMINADO: setInterval local que causaba desincronización
  // La pestaña de reflejo ahora solo muestra datos, no calcula tiempo

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular color de fondo basado en tiempo restante
  const getBackgroundColor = (): string => {
    if (!stages[currentStageIndex]) return '#1f2937';

    const currentStage = stages[currentStageIndex];
    const percentage = timeLeft / totalTime;

    // Si hay colores personalizados definidos
    if (currentStage.colors && currentStage.colors.length > 0) {
      const sortedColors = [...currentStage.colors].sort((a, b) => b.timeInSeconds - a.timeInSeconds);
      
      for (const colorConfig of sortedColors) {
        if (timeLeft <= colorConfig.timeInSeconds) {
          return colorConfig.backgroundColor;
        }
      }
    }

    // Colores por defecto basados en porcentaje
    if (percentage > 0.5) return '#10b981'; // Verde
    if (percentage > 0.25) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  // Calcular color de texto basado en el fondo
  const getTextColor = (): string => {
    const bgColor = getBackgroundColor();
    // Si el fondo es claro, usar texto oscuro, si es oscuro usar texto claro
    return bgColor === '#f59e0b' ? '#000000' : '#ffffff';
  };

  // Calcular progreso
  const getProgress = (): number => {
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const currentStage = stages[currentStageIndex];

  if (!currentStage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Esperando Directorio...
          </h1>
          <p className="text-gray-600">
            Configura las etapas e inicia el directorio desde la ventana principal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center transition-all duration-100"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {/* Versión de la plataforma */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <VersionInfo showTitle={false} />
      </div>
      
      {/* Contenido principal del cronómetro */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Título de la etapa */}
        <h1 
          className="text-6xl font-bold mb-12 text-center px-8"
          style={{ color: getTextColor() }}
        >
          {currentStage.title}
        </h1>
        
        {/* Cronómetro principal */}
        <div 
          className="text-9xl font-bold font-mono mb-12"
          style={{ color: getTextColor() }}
        >
          {formatTime(timeLeft)}
        </div>
        
        {/* Indicador de etapa */}
        <div 
          className="text-2xl mb-8"
          style={{ color: getTextColor() }}
        >
          Etapa {currentStageIndex + 1} de {stages.length}
        </div>
        
        {/* Barra de progreso */}
        <div className="w-96 bg-black bg-opacity-20 rounded-full h-4 mb-8">
          <div 
            className="h-4 rounded-full transition-all duration-300"
            style={{ 
              width: `${getProgress()}%`,
              backgroundColor: getTextColor(),
              opacity: 0.7
            }}
          ></div>
        </div>
        
        {/* Estado del cronómetro */}
        <div 
          className="text-xl mb-4"
          style={{ color: getTextColor() }}
        >
          {isRunning ? '▶️ Ejecutando' : isPaused ? '⏸️ Pausado' : '⏹️ Detenido'}
        </div>
        
        {/* Información adicional */}
        <div 
          className="text-lg text-center"
          style={{ color: getTextColor() }}
        >
          <p>Tiempo total: {formatTime(totalTime)}</p>
          <p>Tiempo transcurrido: {formatTime(totalTime - timeLeft)}</p>
        </div>
      </div>
    </div>
  );
};