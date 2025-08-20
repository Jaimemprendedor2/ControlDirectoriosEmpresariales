import React, { useState, useEffect, useCallback } from 'react';

interface Stage {
  id?: string;
  title: string;
  duration: number;
  order_index?: number;
  is_completed?: boolean;
}

interface MeetingTimerProps {
  stages: Stage[];
  isOpen: boolean;
  onClose: () => void;
}

export const MeetingTimer: React.FC<MeetingTimerProps> = ({ stages, isOpen, onClose }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentStage = stages[currentStageIndex];

  // Inicializar el cronómetro cuando se abre
  useEffect(() => {
    if (isOpen && stages.length > 0) {
      setCurrentStageIndex(0);
      setTimeLeft(stages[0].duration);
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [isOpen, stages]);

  // Manejar el cronómetro
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Tiempo agotado para esta etapa
            if (currentStageIndex < stages.length - 1) {
              // Pasar a la siguiente etapa
              const nextIndex = currentStageIndex + 1;
              setCurrentStageIndex(nextIndex);
              return stages[nextIndex].duration;
            } else {
              // Reunión terminada
              setIsRunning(false);
              return 0;
            }
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, timeLeft, currentStageIndex, stages]);

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

  // Calcular progreso
  const progress = currentStage ? ((currentStage.duration - timeLeft) / currentStage.duration) * 100 : 0;

  // Manejar controles
  const handlePlayPause = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    }
  };

  const handleNext = () => {
    if (currentStageIndex < stages.length - 1) {
      const nextIndex = currentStageIndex + 1;
      setCurrentStageIndex(nextIndex);
      setTimeLeft(stages[nextIndex].duration);
    }
  };

  const handlePrevious = () => {
    if (currentStageIndex > 0) {
      const prevIndex = currentStageIndex - 1;
      setCurrentStageIndex(prevIndex);
      setTimeLeft(stages[prevIndex].duration);
    }
  };

  const handleRestart = () => {
    setTimeLeft(currentStage.duration);
  };

  // Manejar atajos de teclado
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handlePlayPause();
          break;
        case 'KeyN':
          event.preventDefault();
          handleNext();
          break;
        case 'KeyP':
          event.preventDefault();
          handlePrevious();
          break;
        case 'KeyR':
          event.preventDefault();
          handleRestart();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, currentStageIndex, stages, onClose]);

  if (!isOpen || !currentStage) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentStage.title}
          </h2>
          <p className="text-gray-600">
            Etapa {currentStageIndex + 1} de {stages.length}
          </p>
        </div>

        {/* Cronómetro principal */}
        <div className="text-center mb-8">
          <div className="text-8xl font-bold text-blue-600 mb-4 font-mono">
            {formatTime(timeLeft)}
          </div>
          
          {/* Barra de progreso */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-sm text-gray-500">
            {Math.floor(progress)}% completado
          </p>
        </div>

        {/* Controles */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentStageIndex === 0}
            className="p-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
            title="Etapa anterior (P)"
          >
            ⏮️
          </button>
          
          <button
            onClick={handlePlayPause}
            className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
            title="Play/Pause (Espacio)"
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentStageIndex === stages.length - 1}
            className="p-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
            title="Siguiente etapa (N)"
          >
            ⏭️
          </button>
        </div>

        {/* Botón reiniciar */}
        <div className="text-center mb-6">
          <button
            onClick={handleRestart}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            title="Reiniciar etapa (R)"
          >
            🔄 Reiniciar Etapa
          </button>
        </div>

        {/* Lista de etapas */}
        <div className="border-t pt-6">
                     <h3 className="text-lg font-semibold text-gray-800 mb-3">Etapas del Directorio</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {stages.map((stage, index) => (
              <div
                key={index}
                className={`
                  flex items-center justify-between p-2 rounded-lg text-sm
                  ${index === currentStageIndex 
                    ? 'bg-blue-100 border border-blue-300' 
                    : index < currentStageIndex 
                    ? 'bg-green-100 border border-green-300' 
                    : 'bg-gray-100 border border-gray-300'
                  }
                `}
              >
                <span className="font-medium">{stage.title}</span>
                <span className="text-gray-600">
                  {Math.floor(stage.duration / 60)}:{(stage.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Botón cerrar */}
        <div className="text-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            title="Cerrar (ESC)"
          >
                         Cerrar Configuración
          </button>
        </div>

        {/* Atajos de teclado */}
        <div className="text-center mt-4 text-xs text-gray-500">
          <p>Atajos: <kbd className="bg-gray-200 px-1 rounded">Espacio</kbd> Play/Pause • 
          <kbd className="bg-gray-200 px-1 rounded">N</kbd> Siguiente • 
          <kbd className="bg-gray-200 px-1 rounded">P</kbd> Anterior • 
          <kbd className="bg-gray-200 px-1 rounded">R</kbd> Reiniciar • 
          <kbd className="bg-gray-200 px-1 rounded">ESC</kbd> Cerrar</p>
        </div>
      </div>
    </div>
  );
};
