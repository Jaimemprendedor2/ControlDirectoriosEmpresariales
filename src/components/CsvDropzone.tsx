import React, { useCallback, useState } from 'react';
import Papa from 'papaparse';

interface CsvDropzoneProps {
  onImport: (stages: Array<{ title: string; duration: number }>) => void;
}

export const CsvDropzone: React.FC<CsvDropzoneProps> = ({ onImport }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const parseCsv = useCallback((file: File) => {
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsLoading(false);
        
        if (results.errors.length > 0) {
          alert('Error al procesar el CSV: ' + results.errors[0].message);
          return;
        }

        const stages = results.data.map((row: any, index: number) => {
          const title = row.titulo || row.title || `Etapa ${index + 1}`;
          let duration = 0;

          // Parse duration from various formats
          if (row.duracion || row.duration) {
            const durationStr = (row.duracion || row.duration).toString();
            
            if (durationStr.includes(':')) {
              // Format: "5:00" or "1:30:00"
              const parts = durationStr.split(':').map(Number);
              if (parts.length === 2) {
                duration = parts[0] * 60 + parts[1]; // mm:ss
              } else if (parts.length === 3) {
                duration = parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
              }
            } else {
              // Format: "300" (seconds) or "5" (minutes)
              duration = parseInt(durationStr);
              if (duration < 1000) {
                duration *= 60; // Assume minutes if small number
              }
            }
          }

          return {
            title,
            duration: Math.max(duration, 30) // Minimum 30 seconds
          };
        });

        if (stages.length > 0) {
          onImport(stages);
        } else {
          alert('No se encontraron etapas válidas en el CSV');
        }
      },
      error: (error) => {
        setIsLoading(false);
        alert('Error al leer el archivo: ' + error.message);
      }
    });
  }, [onImport]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      parseCsv(file);
    }
  }, [parseCsv]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file && file.type === 'text/csv') {
      parseCsv(file);
    } else {
      alert('Por favor selecciona un archivo CSV válido');
    }
  }, [parseCsv]);

  return (
    <div className="w-full">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
        id="csv-upload"
      />
      
      <label
        htmlFor="csv-upload"
        className={`
          block w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Procesando CSV...</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📁</div>
                         <div className="text-lg font-medium text-gray-700">
               Importar Estructura CSV
             </div>
            <div className="text-sm text-gray-500">
              Arrastra un archivo CSV aquí o haz clic para seleccionar
            </div>
            <div className="text-xs text-gray-400 mt-2">
                             Formato: titulo,duracion (ej: "Configuración Inicial,5:00")
            </div>
          </div>
        )}
      </label>
    </div>
  );
};
