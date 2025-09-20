import React, { useState, useEffect } from 'react';
import { TimerNavigationBar } from '../components/TimerNavigationBar';
import { TimerSettings } from '../components/TimerSettings';
import { useWindowPlugins } from '../hooks/useWindowPlugins';
import { NotificationPlugin } from '../plugins/NotificationPlugin';
import { PersistencePlugin } from '../plugins/PersistencePlugin';
import { TimerSettings as TimerSettingsType } from '../types/timer';

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
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  
  // Estados para plugins y configuración
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 16,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    showSeconds: true,
    autoStart: false,
    showProgress: true,
    soundEnabled: true,
    notificationEnabled: true
  });

  // Inicializar plugins
  const notificationPlugin = new NotificationPlugin();
  const persistencePlugin = new PersistencePlugin();
  
  // Hook para plugins de ventana
  const {
    isAlwaysOnTop,
    isBackgroundMode,
    toggleAlwaysOnTop,
    toggleBackgroundMode,
    requestNotificationPermission
  } = useWindowPlugins();

  // Establecer título de la ventana
  useEffect(() => {
    document.title = "Ventana Cronómetro";
  }, []);

  // Cargar configuración al inicializar
  useEffect(() => {
    const savedSettings = persistencePlugin.loadSettings();
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...savedSettings }));
    }
    
    // Solicitar permisos de notificación
    requestNotificationPermission();
  }, []);

  // Aplicar configuración en tiempo real
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--timer-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--timer-bg-color', settings.backgroundColor);
    root.style.setProperty('--timer-text-color', settings.textColor);
  }, [settings]);

  // Funciones para manejar configuración
  const handleSaveSettings = (newSettings: TimerSettingsType) => {
    setSettings(newSettings);
    persistencePlugin.saveSettings(newSettings);
    notificationPlugin.setEnabled(newSettings.notificationEnabled);
  };

  const handleClose = () => {
    // Guardar estado antes de cerrar
    persistencePlugin.saveTimerState({
      stages,
      currentStageIndex,
      timeLeft,
      isRunning,
      isPaused,
      totalTime,
      startTime,
      pausedTime
    });

    // Notificar a la ventana padre que se está cerrando
    if (window.opener) {
      window.opener.postMessage({ action: 'windowClosed' }, '*');
    }
    window.close();
  };

  // Solicitar Wake Lock para mantener pantalla activa durante streaming
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('Wake Lock activado para streaming continuo');
        }
      } catch (err) {
        console.log('Wake Lock no disponible:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLock) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);

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
        console.log('📊 Stages guardados:', savedStages);
        console.log('📊 Stage actual:', savedCurrentStage);
        console.log('📊 Tiempo restante:', savedTimeLeft);

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

  // Escuchar mensajes de la ventana principal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 MeetingView recibió mensaje:', event.data);
      
      if (event.data.action === 'startTimer') {
        console.log('▶️ Iniciando cronómetro...');
        setIsRunning(true);
        setIsPaused(false);
        setStartTime(Date.now());
        setPausedTime(0);
      } else if (event.data.action === 'pauseTimer') {
        console.log('⏸️ Pausando cronómetro...');
        setIsRunning(false);
        setIsPaused(true);
        if (startTime) {
          setPausedTime(pausedTime + (Date.now() - startTime));
        }
      } else if (event.data.action === 'resumeTimer') {
        console.log('▶️ Reanudando cronómetro...');
        setIsRunning(true);
        setIsPaused(false);
        setStartTime(Date.now());
      } else if (event.data.action === 'resetTimer') {
        console.log('🔄 Reiniciando cronómetro...');
        setIsRunning(false);
        setIsPaused(false);
        setStartTime(null);
        setPausedTime(0);
        if (stages.length > 0) {
          setTimeLeft(stages[currentStageIndex].duration);
          setTotalTime(stages[currentStageIndex].duration);
        }
      } else if (event.data.action === 'setStages') {
        console.log('🎨 MeetingView recibió setStages:', event.data);
        console.log('🎨 Stages recibidos:', event.data.data?.stages);
        console.log('🎨 Estructura completa del mensaje:', event.data);
        if (event.data.data?.stages) {
          setStages(event.data.data.stages);
          console.log('✅ Stages actualizados en MeetingView');
        } else {
          console.log('⚠️ No se encontraron stages en el mensaje');
        }
      } else if (event.data.action === 'setCurrentStage') {
        console.log('📋 Cambiando stage actual:', event.data.data?.stageIndex);
        if (event.data.data?.stageIndex !== undefined) {
          const newIndex = event.data.data.stageIndex;
          setCurrentStageIndex(newIndex);
          if (stages[newIndex]) {
            setTimeLeft(stages[newIndex].duration);
            setTotalTime(stages[newIndex].duration);
            console.log('✅ Stage cambiado a:', stages[newIndex]);
          }
        }
      } else if (event.data.action === 'syncAll') {
        console.log('📡 MeetingView recibió syncAll:', event.data.data);
        if (event.data.data) {
          const data = event.data.data;
          if (data.currentTimeLeft !== undefined) {
            const newTime = parseInt(data.currentTimeLeft);
            if (!isNaN(newTime)) {
              setTimeLeft(newTime);
              setTotalTime(newTime); // Sincronizar totalTime con timeLeft
            }
          }
          if (data.currentStageIndex !== undefined) {
            const newIndex = parseInt(data.currentStageIndex);
            if (!isNaN(newIndex)) {
              setCurrentStageIndex(newIndex);
            }
          }
          if (data.meetingStages) {
            try {
              const parsedStages = JSON.parse(data.meetingStages);
              setStages(parsedStages);
            } catch (error) {
              console.error('❌ Error parsing meetingStages en syncAll:', error);
            }
          }
          if (data.isTimerRunning !== undefined) {
            const running = data.isTimerRunning === 'true' || data.isTimerRunning === true;
            setIsRunning(running);
            setIsPaused(!running);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [stages, currentStageIndex, startTime, pausedTime]);


  // Efecto de parpadeo
  useEffect(() => {
    let blinkInterval: NodeJS.Timeout;

    if (timeLeft <= 15) {
      setIsBlinking(true);
      blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500);
    } else {
      setIsBlinking(false);
    }

    return () => {
      if (blinkInterval) {
        clearInterval(blinkInterval);
      }
    };
  }, [timeLeft]);

  // Actualización continua del timestamp para forzar re-renders en streaming
  useEffect(() => {
    const timestampInterval = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 100); // Actualizar cada 100ms para forzar cambios visuales

    return () => clearInterval(timestampInterval);
  }, []);

  // Sistema robusto de sincronización - Capa 3: Timer Interno de Respaldo
  useEffect(() => {
    let backupTimer: NodeJS.Timeout;

    const startBackupTimer = () => {
      backupTimer = setInterval(() => {
        const currentTime = localStorage.getItem("timeLeft");
        const isRunning = localStorage.getItem("isRunning");

        if (currentTime && isRunning === "true") {
          const seconds = parseInt(currentTime);
          if (!isNaN(seconds) && seconds > 0) {
            const newTime = seconds - 1;
            localStorage.setItem("timeLeft", newTime.toString());
            setTimeLeft(newTime);

            if (newTime === 0) {
              localStorage.setItem("isRunning", "false");
              setIsRunning(false);
            }
          }
        }
      }, 1000);
    };

    startBackupTimer();

    return () => {
      if (backupTimer) clearInterval(backupTimer);
    };
  }, []);

  // Función para obtener el color de fondo basado en el tiempo transcurrido
  const getBackgroundColor = () => {
    if (!stages[currentStageIndex] || !stages[currentStageIndex].colors) {
      return '#1f2937'; // Color por defecto
    }

    const currentStage = stages[currentStageIndex];
    const timeElapsed = totalTime - timeLeft;
    
    console.log('🎨 Calculando color de fondo:');
    console.log('  - Tiempo total:', totalTime);
    console.log('  - Tiempo restante:', timeLeft);
    console.log('  - Tiempo transcurrido:', timeElapsed);
    console.log('  - Colores configurados:', currentStage.colors);

    // Verificar que currentStage.colors existe y es un array
    if (!currentStage.colors || !Array.isArray(currentStage.colors)) {
      console.log('🎨 No hay colores configurados o no es un array válido');
      return '#1f2937';
    }

    // Buscar el color correspondiente al tiempo transcurrido
    for (let i = currentStage.colors.length - 1; i >= 0; i--) {
      const colorConfig = currentStage.colors[i];
      if (colorConfig && timeElapsed >= colorConfig.timeInSeconds) {
        console.log('🎨 Aplicando color:', colorConfig.backgroundColor, 'para tiempo:', colorConfig.timeInSeconds);
        return colorConfig.backgroundColor;
      }
    }

    // Si no hay colores configurados o no se cumple ninguna condición, usar color por defecto
    console.log('🎨 Usando color por defecto');
    return '#1f2937';
  };

  // Función para formatear tiempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para obtener el color del texto
  const getTextColor = () => {
    if (timeLeft <= 15) {
      return isBlinking ? '#ef4444' : '#ffffff';
    }
    return '#ffffff';
  };

  if (stages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Cronómetro de Reunión</h1>
          <p className="text-gray-300">No hay stages configurados</p>
          <p className="text-sm text-gray-400 mt-2">Abre la ventana principal para configurar las etapas</p>
        </div>
      </div>
    );
  }

  const currentStage = stages[currentStageIndex];
  const backgroundColor = getBackgroundColor();

  return (
    <div
      className="min-h-screen flex flex-col transition-all duration-100"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {/* Barra de navegación */}
      <TimerNavigationBar
        onToggleSettings={() => setShowSettings(true)}
        onToggleAlwaysOnTop={toggleAlwaysOnTop}
        onToggleBackgroundMode={toggleBackgroundMode}
        onClose={handleClose}
        isAlwaysOnTop={isAlwaysOnTop}
        isBackgroundMode={isBackgroundMode}
      />

      {/* Contenido principal del cronómetro */}
      <div className="flex-1 flex flex-col items-center justify-center">
      {/* Título del Stage */}
      <div className="text-center mb-8">
        <h1
          className="text-4xl font-bold mb-2"
          style={{ color: getTextColor() }}
        >
          {currentStage?.title || 'Stage Actual'}
        </h1>
        <p
          className="text-lg opacity-80"
          style={{ color: getTextColor() }}
        >
          {currentStageIndex + 1} de {stages.length} etapas
        </p>
      </div>

      {/* Cronómetro principal con timestamp forzado */}
      <div key={currentTimestamp} className="text-center mb-8">
        <div
          className={`text-8xl font-mono font-bold transition-all duration-100 ${
            isBlinking ? 'animate-pulse' : ''
          }`}
          style={{ color: getTextColor() }}
        >
          {formatTime(timeLeft)}
        </div>

        {/* Barra de progreso */}
        <div className="w-96 h-4 bg-gray-700 rounded-full mt-6 overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{
              width: `${((totalTime - timeLeft) / totalTime) * 100}%`,
              backgroundColor: getTextColor()
            }}
          />
        </div>

        {/* Texto de progreso */}
        <p
          className="text-sm mt-2"
          style={{ color: getTextColor() }}
        >
          {Math.floor(((totalTime - timeLeft) / totalTime) * 100)}% completado
        </p>
      </div>

      {/* Información del estado */}
      <div className="text-center">
        <div
          className="text-lg mb-2"
          style={{ color: getTextColor() }}
        >
          {isRunning ? '⏱️ Ejecutando' : isPaused ? '⏸️ Pausado' : '⏹️ Detenido'}
        </div>

        {timeLeft <= 15 && (
          <div
            className="text-sm opacity-80"
            style={{ color: getTextColor() }}
          >
            {timeLeft === 0 ? '⏰ Tiempo agotado' : '⚠️ Tiempo crítico'}
          </div>
        )}
      </div>

      {/* Información de Debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 text-xs text-gray-400 bg-black bg-opacity-50 p-2 rounded">
          <div>Stage: {currentStageIndex + 1}/{stages.length}</div>
          <div>Tiempo: {timeLeft}s / {totalTime}s</div>
          <div>Estado: {isRunning ? 'Ejecutando' : isPaused ? 'Pausado' : 'Detenido'}</div>
          <div>Color: {backgroundColor}</div>
          <div>Timestamp: {currentTimestamp}</div>
        </div>
      )}

      {/* Indicador de actividad para cámara virtual (siempre visible pero sutil) */}
      <div
        className="fixed top-4 right-4 w-2 h-2 bg-green-500 rounded-full opacity-30 animate-pulse"
        title="Indicador de actividad para streaming"
      />

      {/* Timestamp invisible para forzar actualizaciones continuas */}
      <div className="opacity-0 text-xs fixed bottom-0 right-0 pointer-events-none">
        {currentTimestamp}
      </div>
      </div>

      {/* Componente de configuración */}
      <TimerSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};