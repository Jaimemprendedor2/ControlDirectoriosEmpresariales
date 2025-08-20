import React, { useState, useEffect } from 'react';

interface Stage {
  id?: string;
  title: string;
  duration: number;
  order_index?: number;
  is_completed?: boolean;
  colors?: Array<{
    timePercentage: number;
    backgroundColor: string;
  }>;
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
  const getCurrentBackgroundColor = (): string => {
    if (!currentStage?.colors || currentStage.colors.length === 0) {
      return '#ffffff'; // Color por defecto
    }

    const timePercentage = ((currentStage.duration - timeLeft) / currentStage.duration) * 100;
    
    // Encontrar el color correspondiente al porcentaje actual
    const applicableColors = currentStage.colors
      .filter(color => timePercentage >= color.timePercentage)
      .sort((a, b) => b.timePercentage - a.timePercentage);
    
    return applicableColors.length > 0 ? applicableColors[0].backgroundColor : '#ffffff';
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

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center transition-colors duration-1000"
      style={{ backgroundColor: getCurrentBackgroundColor() }}
    >
      {/* Cronómetro - Aumentado 10% y acercado al título */}
      <div className="text-[9.9rem] font-bold text-gray-900 font-mono mb-8">
        {formatTime(timeLeft)}
      </div>

      {/* Título de la etapa - Acercado al número */}
      <h1 className="text-6xl font-bold text-gray-800 text-center px-8">
        {currentStage.title}
      </h1>

      {/* Mensaje de espera si la etapa terminó */}
      {isWaitingForNext && (
        <div className="text-center space-y-8 mt-8">
          <div className="text-4xl text-gray-700 font-bold">
            ¡Etapa completada!
          </div>
          <button
            onClick={handleNextStage}
            className="px-12 py-6 bg-green-600 hover:bg-green-700 text-white text-3xl font-bold rounded-lg transition-colors shadow-lg"
          >
            {currentStageIndex < stages.length - 1 ? 'Siguiente Etapa' : 'Finalizar'}
          </button>
          <div className="text-lg text-gray-600">
            Presiona <kbd className="bg-gray-200 px-2 py-1 rounded text-sm">Espacio</kbd> para continuar
          </div>
        </div>
      )}
    </div>
  );
};
