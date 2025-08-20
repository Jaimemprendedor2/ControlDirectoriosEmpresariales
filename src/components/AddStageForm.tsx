import React, { useState } from 'react';

interface AddStageFormProps {
  onAddStage: (stage: { title: string; duration: number }) => void;
}

export const AddStageForm: React.FC<AddStageFormProps> = ({ onAddStage }) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Por favor ingresa un título para la etapa');
      return;
    }

    if (!duration.trim()) {
      alert('Por favor ingresa la duración de la etapa');
      return;
    }

    // Parse duration
    let durationSeconds = 0;
    const durationStr = duration.trim();
    
    if (durationStr.includes(':')) {
      // Format: "5:00" or "1:30:00"
      const parts = durationStr.split(':').map(Number);
      if (parts.length === 2) {
        durationSeconds = parts[0] * 60 + parts[1]; // mm:ss
      } else if (parts.length === 3) {
        durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
      }
    } else {
      // Format: "300" (seconds) or "5" (minutes)
      const num = parseInt(durationStr);
      if (isNaN(num) || num <= 0) {
        alert('Por favor ingresa una duración válida');
        return;
      }
      durationSeconds = num < 1000 ? num * 60 : num; // Assume minutes if small number
    }

    if (durationSeconds < 30) {
      alert('La duración mínima es 30 segundos');
      return;
    }

    onAddStage({
      title: title.trim(),
      duration: durationSeconds
    });

    // Reset form
    setTitle('');
    setDuration('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <span className="text-xl">➕</span>
        <span>Crear Etapa Manual</span>
      </button>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Agregar Nueva Etapa
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="stage-title" className="block text-sm font-medium text-gray-700 mb-1">
            Título de la Etapa
          </label>
          <input
            type="text"
            id="stage-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Introducción"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="stage-duration" className="block text-sm font-medium text-gray-700 mb-1">
            Duración
          </label>
          <input
            type="text"
            id="stage-duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Ej: 5:00 o 300"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Formato: mm:ss (ej: 5:00) o segundos (ej: 300)
          </p>
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Agregar Etapa
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
