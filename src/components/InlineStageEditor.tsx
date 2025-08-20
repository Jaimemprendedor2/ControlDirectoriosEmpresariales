import React, { useState, useEffect, useRef } from 'react';

interface InlineStageEditorProps {
  stage: {
    title: string;
    duration: number;
  };
  onSave: (title: string, duration: number) => void;
  onCancel: () => void;
}

export const InlineStageEditor: React.FC<InlineStageEditorProps> = ({
  stage,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(stage.title);
  const [duration, setDuration] = useState(stage.duration);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Enfocar el input del título al montar
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const handleSave = () => {
    if (title.trim() && duration > 0) {
      onSave(title.trim(), duration);
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
    <div className="flex items-center justify-between p-4 rounded-lg border border-blue-300 bg-blue-50">
      <div className="flex items-center space-x-4 flex-1">
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
          ✏️
        </div>
        
        <div className="flex-1 space-y-2">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre de la etapa"
          />
          
          <input
            type="text"
            value={formatDuration(duration)}
            onChange={(e) => {
              const value = e.target.value;
              // Permitir cualquier entrada numérica y ':'
              if (value === '' || /^[\d:]*$/.test(value)) {
                // No convertir inmediatamente, solo permitir la entrada
                // La conversión se hará en onBlur
              }
            }}
            onBlur={(e) => {
              // Validar y formatear al perder el foco
              const value = e.target.value;
              if (value) {
                const seconds = parseTimeToSeconds(value);
                setDuration(seconds);
              }
            }}
            onKeyDown={(e) => {
              // Permitir teclas numéricas, dos puntos, backspace, delete, tab, enter, escape
              const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
              const isNumber = /^[0-9]$/.test(e.key);
              const isColon = e.key === ':';
              
              if (!isNumber && !isColon && !allowedKeys.includes(e.key)) {
                e.preventDefault();
              }
            }}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="00:30"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          ✅
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          ❌
        </button>
      </div>
    </div>
  );
};
