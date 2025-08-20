import React, { useState } from 'react';

interface StageColor {
  timePercentage: number;
  backgroundColor: string;
}

interface StageColorConfigProps {
  isOpen: boolean;
  onClose: () => void;
  stage: {
    title: string;
    duration: number;
    colors?: StageColor[];
  };
  onSave: (colors: StageColor[]) => void;
}

export const StageColorConfig: React.FC<StageColorConfigProps> = ({
  isOpen,
  onClose,
  stage,
  onSave
}) => {
  const [colors, setColors] = useState<StageColor[]>(stage.colors || []);
  const [newTimePercentage, setNewTimePercentage] = useState<number>(50);
  const [newBackgroundColor, setNewBackgroundColor] = useState<string>('#ffffff');

  if (!isOpen) return null;

  const handleAddColor = () => {
    if (newTimePercentage < 0 || newTimePercentage > 100) {
      alert('El porcentaje debe estar entre 0 y 100');
      return;
    }

    const newColor: StageColor = {
      timePercentage: newTimePercentage,
      backgroundColor: newBackgroundColor
    };

    // Verificar si ya existe un color para ese porcentaje
    const existingIndex = colors.findIndex(c => c.timePercentage === newTimePercentage);
    
    if (existingIndex >= 0) {
      // Actualizar color existente
      const updatedColors = [...colors];
      updatedColors[existingIndex] = newColor;
      setColors(updatedColors);
    } else {
      // Agregar nuevo color
      const updatedColors = [...colors, newColor].sort((a, b) => a.timePercentage - b.timePercentage);
      setColors(updatedColors);
    }

    // Reset form
    setNewTimePercentage(50);
    setNewBackgroundColor('#ffffff');
  };

  const handleRemoveColor = (timePercentage: number) => {
    setColors(colors.filter(c => c.timePercentage !== timePercentage));
  };

  const handleSave = () => {
    onSave(colors);
    onClose();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Configurar Colores - {stage.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel izquierdo: Agregar color */}
          <div>
            <h4 className="font-medium text-gray-800 mb-4">Agregar Color de Subtipo</h4>
            
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
                  Color de Fondo
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
                Agregar Color
              </button>
            </div>
          </div>

          {/* Panel derecho: Colores configurados */}
          <div>
            <h4 className="font-medium text-gray-800 mb-4">Colores Configurados</h4>
            
            {colors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎨</div>
                <p>No hay colores configurados</p>
                <p className="text-sm">Agrega colores para cambiar el fondo según el tiempo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    style={{ backgroundColor: color.backgroundColor + '20' }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: color.backgroundColor }}
                      ></div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {color.timePercentage}% transcurrido
                        </div>
                        <div className="text-sm text-gray-600 font-mono">
                          {color.backgroundColor}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveColor(color.timePercentage)}
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
            {colors.length > 0 && (
              <div className="mt-6">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Vista Previa de Transición
                </h5>
                <div className="h-8 rounded-lg overflow-hidden flex">
                  {colors.map((color, index) => {
                    const width = index === colors.length - 1 
                      ? (100 - color.timePercentage) 
                      : (colors[index + 1]?.timePercentage || 100) - color.timePercentage;
                    
                    return (
                      <div
                        key={index}
                        style={{ 
                          backgroundColor: color.backgroundColor,
                          width: `${width}%`
                        }}
                        title={`${color.timePercentage}% - ${color.backgroundColor}`}
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

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};
