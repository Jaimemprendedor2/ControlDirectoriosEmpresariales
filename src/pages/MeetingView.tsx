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

interface MeetingViewProps {
  stages: Stage[];
}

export const MeetingView: React.FC<MeetingViewProps> = ({ stages: propStages }) => {
  // Leer las etapas del localStorage si no se pasan como props
  const [stages] = useState<Stage[]>(() => {
    const storedStages = localStorage.getItem('meetingStages');
    return storedStages ? JSON.parse(storedStages) : propStages;
  });
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [isAlertBlinking, setIsAlertBlinking] = useState(false);

  const currentStage = stages[currentStageIndex];

  // Inicializar el cronómetro
  useEffect(() => {
    if (stages.length > 0) {
      setTimeLeft(stages[0].duration);
    }
  }, [stages]);

  // Manejar el cronómetro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && !isWaitingForNext && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Tiempo agotado para esta etapa
            setIsRunning(false);
            setIsWaitingForNext(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isWaitingForNext, timeLeft]);

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

  // Pasar a la siguiente etapa
  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      const nextIndex = currentStageIndex + 1;
      setCurrentStageIndex(nextIndex);
      setTimeLeft(stages[nextIndex].duration);
      setIsWaitingForNext(false);
      setIsRunning(true);
    } else {
      // Reunión terminada
      setIsWaitingForNext(false);
      setIsRunning(false);
      // Cerrar la ventana
      window.close();
    }
  };

  // Manejar atajos de teclado
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isWaitingForNext) {
            handleNextStage();
          }
          break;
        case 'Escape':
          event.preventDefault();
          window.close();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isWaitingForNext]);

  // Escuchar mensajes de la ventana principal
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { action, data } = event.data;

      switch (action) {
        case 'previousStage':
          if (currentStageIndex > 0) {
            const newIndex = currentStageIndex - 1;
            setCurrentStageIndex(newIndex);
            setTimeLeft(stages[newIndex].duration);
            setIsWaitingForNext(false);
            setIsRunning(true);
          }
          break;

        case 'nextStage':
          if (currentStageIndex < stages.length - 1) {
            const newIndex = currentStageIndex + 1;
            setCurrentStageIndex(newIndex);
            setTimeLeft(stages[newIndex].duration);
            setIsWaitingForNext(false);
            setIsRunning(true);
          }
          break;

        case 'pauseResume':
          setIsRunning(!isRunning);
          break;

        case 'restartStage':
          setTimeLeft(currentStage.duration);
          setIsWaitingForNext(false);
          setIsRunning(true);
          break;

        case 'addTime':
          setTimeLeft(prev => prev + (data?.seconds || 30));
          break;

        case 'subtractTime':
          setTimeLeft(prev => Math.max(0, prev - (data?.seconds || 30)));
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentStageIndex, stages, isRunning, currentStage]);

  if (!currentStage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            No hay etapas configuradas
          </h1>
          <p className="text-gray-600">
            Cierra esta ventana y configura las etapas del directorio
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
      {/* Cronómetro - Aumentado 10% y separación exacta de 20px */}
      <div className="text-[9.9rem] font-bold text-white font-mono mb-[20px]">
        {formatTime(timeLeft)}
      </div>

      {/* Título de la etapa - Separación exacta de 20px */}
      <h1 className="text-6xl font-bold text-white text-center px-8">
        {currentStage.title}
      </h1>
    </div>
  );
};
