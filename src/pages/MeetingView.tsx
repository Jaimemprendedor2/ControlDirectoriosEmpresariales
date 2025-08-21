import React, { useState, useEffect } from 'react';

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

  const currentStage = stages[currentStageIndex];

  // Sincronizar con el cronómetro principal cada 100ms
  useEffect(() => {
    const syncWithMainTimer = () => {
      // Obtener datos del localStorage (cronómetro principal)
      const storedStages = localStorage.getItem('meetingStages');
      const storedTimeLeft = localStorage.getItem('currentTimeLeft');
      const storedIsRunning = localStorage.getItem('isTimerRunning');
      const storedCurrentStage = localStorage.getItem('currentStageIndex');

      // Sincronizar etapas
      if (storedStages) {
        try {
          const parsedStages = JSON.parse(storedStages);
          setStages(parsedStages);
        } catch (error) {
          console.log('Error parsing stages:', error);
        }
      }

      // Sincronizar tiempo
      if (storedTimeLeft) {
        const seconds = parseInt(storedTimeLeft);
        if (!isNaN(seconds)) {
          setTimeLeft(seconds);
        }
      }

      // Sincronizar estado de ejecución
      if (storedIsRunning) {
        setIsRunning(storedIsRunning === 'true');
      }

      // Sincronizar etapa actual
      if (storedCurrentStage) {
        const stageIndex = parseInt(storedCurrentStage);
        if (!isNaN(stageIndex)) {
          setCurrentStageIndex(stageIndex);
        }
      }
    };

    // Sincronización inicial
    syncWithMainTimer();

    // Sincronizar cada 100ms para reflejo en tiempo real
    const interval = setInterval(syncWithMainTimer, 100);

    return () => clearInterval(interval);
  }, []);

  // Manejar el parpadeo de alerta cuando el tiempo llega a cero
  useEffect(() => {
    let blinkInterval: NodeJS.Timeout | null = null;

    if (timeLeft === 0 && currentStage?.alertColor) {
      blinkInterval = setInterval(() => {
        setIsAlertBlinking(prev => !prev);
      }, 1000);
    } else {
      setIsAlertBlinking(false);
    }

    return () => {
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [timeLeft, currentStage?.alertColor]);

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

  // Calcular color de fondo basado en tiempo transcurrido
  const getCurrentBackgroundColor = (): string => {
    if (!currentStage?.colors || currentStage.colors.length === 0) {
      return '#000000'; // Fondo negro por defecto
    }

    const timeElapsed = currentStage.duration - timeLeft;
    
    // Encontrar el color correspondiente al tiempo transcurrido
    const applicableColors = currentStage.colors
      .filter(color => timeElapsed >= color.timeInSeconds)
      .sort((a, b) => b.timeInSeconds - a.timeInSeconds);
    
    return applicableColors.length > 0 ? applicableColors[0].backgroundColor : '#000000';
  };

  // Escuchar mensajes de sincronización desde la ventana principal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { action, data } = event.data;

      if (action === 'syncState') {
        // Sincronizar estado completo desde el cronómetro principal
        if (data.currentTimeLeft !== undefined) {
          setTimeLeft(data.currentTimeLeft);
        }
        if (data.isTimerRunning !== undefined) {
          setIsRunning(data.isTimerRunning);
        }
        if (data.currentStageIndex !== undefined) {
          setCurrentStageIndex(data.currentStageIndex);
        }
        if (data.stages) {
          setStages(data.stages);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  if (!currentStage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Reflejo del Cronómetro Principal
          </h1>
          <p className="text-gray-600">
            Esperando sincronización con el panel principal...
          </p>
        </div>
      </div>
    );
  }

  // Determinar el color de fondo final (incluyendo parpadeo de alerta)
  const getFinalBackgroundColor = (): string => {
    if (timeLeft === 0 && currentStage?.alertColor && isAlertBlinking) {
      return currentStage.alertColor;
    }
    return getCurrentBackgroundColor();
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center transition-colors duration-1000"
      style={{ backgroundColor: getFinalBackgroundColor() }}
    >
      {/* Cronómetro - Aumentado 10% y separación reducida 90% */}
      <div className="text-[9.9rem] font-bold text-white font-mono mb-[2px]">
        {formatTime(timeLeft)}
      </div>

      {/* Título de la etapa - Separación reducida 90% */}
      <h1 className="text-6xl font-bold text-white text-center px-8">
        {currentStage.title}
      </h1>

      {/* Indicador de que es un reflejo */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
        📺 Reflejo
      </div>
    </div>
  );
};
