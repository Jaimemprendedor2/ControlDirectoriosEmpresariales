import React, { useState } from 'react';

interface StageColor {
  timePercentage: number;
  backgroundColor: string;
}

interface Stage {
  id?: string;
  title: string;
  duration: number;
  order_index?: number;
  is_completed?: boolean;
  colors?: StageColor[];
}

interface ColorConfigProps {
  isOpen: boolean;
  onClose: () => void;
  stages: Stage[];
  onUpdateStages: (updatedStages: Stage[]) => void;
}

export const ColorConfig: React.FC<ColorConfigProps> = ({ 
  isOpen, 
  onClose, 
  stages, 
  onUpdateStages 
}) => {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [newTimePercentage, setNewTimePercentage] = useState<number>(50);
  const [newBackgroundColor, setNewBackgroundColor] = useState<string>('#ffffff');

  if (!isOpen) return null;

  const currentStage = stages[selectedStageIndex];
  const stageColors = currentStage?.colors || [];

  const handleAddColor = () => {
    if (newTimePercentage < 0 || newTimePercentage > 100) {
      alert('El porcentaje debe estar entre 0 y 100');
      return;
    }

    const updatedStages = [...stages];
    if (!updatedStages[selectedStageIndex].colors) {
      updatedStages[selectedStageIndex].colors = [];
    }

    // Verificar que no exista ya un color para ese porcentaje
    const existingColorIndex = updatedStages[selectedStageIndex].colors!.findIndex(
      color => color.timePercentage === newTimePercentage
    );

    if (existingColorIndex >= 0) {
      // Actualizar color existente
      updatedStages[selectedStageIndex].colors![existingColorIndex].backgroundColor = newBackgroundColor;
    } else {
      // Agregar nuevo color
      updatedStages[selectedStageIndex].colors!.push({
        timePercentage: newTimePercentage,
        backgroundColor: newBackgroundColor
      });
    }

    // Ordenar colores por porcentaje
    updatedStages[selectedStageIndex].colors!.sort((a, b) => a.timePercentage - b.timePercentage);

    onUpdateStages(updatedStages);
  };

  const handleRemoveColor = (timePercentage: number) => {
    const updatedStages = [...stages];
    if (updatedStages[selectedStageIndex].colors) {
      updatedStages[selectedStageIndex].colors = updatedStages[selectedStageIndex].colors!.filter(
        color => color.timePercentage !== timePercentage
      );
    }
    onUpdateStages(updatedStages);
  };

  const presetColors = [
    { name: 'Verde', color: '#10B981' },
    { name: 'Amarillo', color: '#F59E0B' },
    { name: 'Naranja', color: '#F97316' },
    { name: 'Rojo', color: '#EF4444' },
    { name: 'Azul', color: '#3B82F6' },
    { name: 'Púrpura', color: '#8B5CF6' },
    { name: 'Rosa', color: '#EC4899' },
    { name: 'Gris', color: '#6B7280' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Configuración de Colores por Etapa
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Selector de etapa */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Etapa del Directorio
          </label>
          <select
            value={selectedStageIndex}
            onChange={(e) => setSelectedStageIndex(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {stages.map((stage, index) => (
              <option key={index} value={index}>
                {index + 1}. {stage.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Panel izquierdo: Configuración */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Agregar/Editar Color
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Porcentaje de Tiempo Transcurrido (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newTimePercentage}
                  onChange={(e) => setNewTimePercentage(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ej: 50 para 50%"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0% = inicio de la etapa, 100% = final de la etapa
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color de Fondo (Hexadecimal)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    value={newBackgroundColor}
                    onChange={(e) => setNewBackgroundColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newBackgroundColor}
                    onChange={(e) => setNewBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              {/* Colores predefinidos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colores Predefinidos
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {presetColors.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setNewBackgroundColor(preset.color)}
                      className="p-2 rounded-md border border-gray-300 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: preset.color }}
                      title={`${preset.name} (${preset.color})`}
                    >
                      <span className="text-white text-xs font-medium drop-shadow">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddColor}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              >
                {stageColors.some(c => c.timePercentage === newTimePercentage) 
                  ? 'Actualizar Color' 
                  : 'Agregar Color'
                }
              </button>
            </div>
          </div>

          {/* Panel derecho: Vista previa y lista */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Colores Configurados
            </h3>

            {stageColors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎨</div>
                <p>No hay colores configurados para esta etapa</p>
                <p className="text-sm">Agrega colores para que cambien según el tiempo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stageColors.map((colorConfig, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    style={{ backgroundColor: colorConfig.backgroundColor + '20' }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: colorConfig.backgroundColor }}
                      ></div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {colorConfig.timePercentage}% transcurrido
                        </div>
                        <div className="text-sm text-gray-600 font-mono">
                          {colorConfig.backgroundColor}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveColor(colorConfig.timePercentage)}
                      className="text-red-500 hover:text-red-700 font-bold"
                      title="Eliminar color"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Vista previa de la transición */}
            {stageColors.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Vista Previa de Transición
                </h4>
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {stageColors.map((colorConfig, index) => {
                    const width = index === stageColors.length - 1 
                      ? (100 - colorConfig.timePercentage) 
                      : (stageColors[index + 1]?.timePercentage || 100) - colorConfig.timePercentage;
                    
                    return (
                      <div
                        key={index}
                        style={{ 
                          backgroundColor: colorConfig.backgroundColor,
                          width: `${width}%`
                        }}
                        title={`${colorConfig.timePercentage}% - ${colorConfig.backgroundColor}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cerrar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
