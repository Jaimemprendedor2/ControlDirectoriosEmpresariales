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

export const Presenter: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);

  const currentStage = stages[currentStageIndex];

  // Escuchar mensajes de la ventana padre
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'START_TIMER') {
        setStages(event.data.stages);
        if (event.data.stages.length > 0) {
          setCurrentStageIndex(0);
          setTimeLeft(event.data.stages[0].duration);
          setIsRunning(true);
          setIsWaitingForNext(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
      // Directorio terminado
      setIsWaitingForNext(false);
      setIsRunning(false);
    }
  };

  // Manejar teclas
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (isWaitingForNext) {
            handleNextStage();
          }
          break;
        case 'Enter':
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

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isWaitingForNext, currentStageIndex, stages]);

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
      className="min-h-screen flex flex-col items-center justify-center transition-colors duration-1000"
      style={{ backgroundColor: getCurrentBackgroundColor() }}
    >
      <div className="text-center">
        {/* Título de la etapa */}
        <h1 className="text-6xl font-bold text-gray-800 mb-12">
          {currentStage.title}
        </h1>
        
        {/* Cronómetro principal */}
        <div className="text-9xl font-bold text-gray-900 font-mono mb-12">
          {formatTime(timeLeft)}
        </div>
        
        {/* Indicador de etapa */}
        <div className="text-2xl text-gray-600 mb-8">
          Etapa {currentStageIndex + 1} de {stages.length}
        </div>
        
        {/* Mensaje de espera si la etapa terminó */}
        {isWaitingForNext && (
          <div className="space-y-6 mt-12">
            <div className="text-4xl text-gray-700 font-bold">
              ¡Etapa Completada!
            </div>
            <div className="text-xl text-gray-600">
              Presiona <kbd className="bg-gray-200 px-3 py-1 rounded font-mono">Espacio</kbd> o <kbd className="bg-gray-200 px-3 py-1 rounded font-mono">Enter</kbd> para continuar
            </div>
            <button
              onClick={handleNextStage}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-2xl font-bold rounded-lg transition-colors"
            >
              {currentStageIndex < stages.length - 1 ? 'Siguiente Etapa' : 'Finalizar Directorio'}
            </button>
          </div>
        )}

        {/* Indicador de progreso general */}
        {!isWaitingForNext && (
          <div className="mt-8">
            <div className="w-96 bg-gray-200 rounded-full h-2 mx-auto">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${((currentStage.duration - timeLeft) / currentStage.duration) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-sm text-gray-500">
            Presiona <kbd className="bg-gray-200 px-2 py-1 rounded text-xs">ESC</kbd> para cerrar
          </div>
        </div>
      </div>
    </div>
  );
};