import React, { useState, useEffect, useRef } from 'react';
import { TimeSelector } from './TimeSelector';

interface InlineStageEditorProps {
  stage: {
    title: string;
    description?: string;
    duration: number;
    alertColor?: string;
    alertSeconds?: number;
  };
  onSave: (title: string, description: string, duration: number, alertColor: string, alertSeconds: number) => void;
  onCancel: () => void;
}

export const InlineStageEditor: React.FC<InlineStageEditorProps> = ({
  stage,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(stage.title);
  const [description, setDescription] = useState(stage.description || '');
  const [duration, setDuration] = useState(stage.duration);
  const [alertColor, setAlertColor] = useState(stage.alertColor || '#FF0000');
  const [alertSeconds, setAlertSeconds] = useState(stage.alertSeconds || 15);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Enfocar el input del título al montar
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);



  const handleSave = () => {
    console.log('handleSave llamado');
    console.log('title:', title);
    console.log('duration:', duration);
    console.log('title.trim():', title.trim());
    console.log('duration > 0:', duration > 0);
    
    if (title.trim() && duration > 0) {
      console.log('Guardando etapa...');
      onSave(title.trim(), description.trim(), duration, alertColor, alertSeconds);
    } else {
      console.log('No se puede guardar - título vacío o duración inválida');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="p-4 rounded-lg border border-blue-300 bg-blue-50 space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
          ✏️
        </div>
        <h4 className="font-medium text-blue-800">Editando Etapa</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de la etapa"
          />
        </div>

        {/* Tiempo */}
        <TimeSelector
          duration={duration}
          onChange={setDuration}
          label="Tiempo"
        />

        {/* Descripción */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción de la etapa (opcional)"
            rows={2}
          />
        </div>

        {/* Color de Alerta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color de Alerta
          </label>
          <div className="flex space-x-2">
            <input
              type="color"
              value={alertColor}
              onChange={(e) => setAlertColor(e.target.value)}
              className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
            />
            <input
              type="text"
              value={alertColor}
              onChange={(e) => setAlertColor(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="#FF0000"
            />
          </div>
        </div>

        {/* Segundos de Alerta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Segundos antes de alerta
          </label>
          <input
            type="number"
            min="1"
            max="300"
            value={alertSeconds}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (!isNaN(value) && value >= 1 && value <= 300) {
                setAlertSeconds(value);
              }
            }}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="15"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Guardar
        </button>
      </div>
    </div>
  );
};
