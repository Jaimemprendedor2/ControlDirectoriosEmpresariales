import React, { useState } from 'react';
import { TimeSelector } from './TimeSelector';



interface AddStageFormProps {
  onAddStage: (stage: { title: string; description?: string; duration: number }) => void;
  initialData?: { title: string; description?: string; duration: number };
}

export const AddStageForm: React.FC<AddStageFormProps> = ({ onAddStage, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [duration, setDuration] = useState(initialData?.duration || 300); // 5 minutos por defecto
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Por favor ingresa un título para la etapa');
      return;
    }

    if (duration < 30) {
      alert('La duración mínima es 30 segundos');
      return;
    }

    onAddStage({
      title: title.trim(),
      description: description.trim(),
      duration: duration
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDuration(300); // Reset to 5 minutes
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <span className="text-xl">➕</span>
                 <span>Crear Etapa del Directorio</span>
      </button>
    );
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
             <h3 className="text-lg font-semibold text-gray-800 mb-4">
         Agregar Nueva Etapa del Directorio
       </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
                     <label htmlFor="stage-title" className="block text-sm font-medium text-gray-700 mb-1">
             Título de la Etapa del Directorio
           </label>
          <input
            type="text"
            id="stage-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
                         placeholder="Ej: Configuración Inicial"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="stage-description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            id="stage-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción de la etapa"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>

        <TimeSelector
          duration={duration}
          onChange={setDuration}
          label="Duración"
        />

        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
                         Agregar Etapa del Directorio
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
