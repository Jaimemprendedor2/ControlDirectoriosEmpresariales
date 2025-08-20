import React from 'react';

interface TimerControlsProps {
  currentStageIndex: number;
  totalStages: number;
  isRunning: boolean;
  onPreviousStage: () => void;
  onNextStage: () => void;
  onPauseResume: () => void;
  onRestartStage: () => void;
  onAddTime: () => void;
  onSubtractTime: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  currentStageIndex,
  totalStages,
  isRunning,
  onPreviousStage,
  onNextStage,
  onPauseResume,
  onRestartStage,
  onAddTime,
  onSubtractTime
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Controles del Cronómetro
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Navegación de etapas */}
        <button
          onClick={onPreviousStage}
          disabled={currentStageIndex === 0}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <span>⏮️</span>
          <span>Anterior</span>
        </button>

        <button
          onClick={onNextStage}
          disabled={currentStageIndex === totalStages - 1}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <span>⏭️</span>
          <span>Siguiente</span>
        </button>

        {/* Control de reproducción */}
        <button
          onClick={onPauseResume}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <span>{isRunning ? '⏸️' : '▶️'}</span>
          <span>{isRunning ? 'Pausar' : 'Reanudar'}</span>
        </button>

        {/* Reiniciar etapa */}
        <button
          onClick={onRestartStage}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <span>🔄</span>
          <span>Reiniciar</span>
        </button>

        {/* Ajustes de tiempo */}
        <button
          onClick={onAddTime}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <span>➕</span>
          <span>+30s</span>
        </button>

        <button
          onClick={onSubtractTime}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          <span>➖</span>
          <span>-30s</span>
        </button>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-600">
          <div className="font-medium">Etapa actual: {currentStageIndex + 1} de {totalStages}</div>
          <div className="text-xs mt-1">
            Los controles afectan la ventana emergente en tiempo real
          </div>
        </div>
      </div>
    </div>
  );
};
