import React from 'react';

// Función para obtener información de compilación
const getBuildInfo = () => {
  const buildDate = new Date('2025-09-22T19:47:55.054Z'); // Actualizado automáticamente
  const date = buildDate.toLocaleDateString('es-CL', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
  const time = buildDate.toLocaleTimeString('es-CL', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  return `Compilado: ${date} ${time}`;
};

interface VersionInfoProps {
  className?: string;
  showTitle?: boolean;
}

export const VersionInfo: React.FC<VersionInfoProps> = ({ 
  className = "", 
  showTitle = true 
}) => {
  return (
    <div className={`text-center ${className}`}>
      {showTitle && (
        <div className="mb-2">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            v1.7.82 ({getBuildInfo()})
          </span>
        </div>
      )}
      {!showTitle && (
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          v1.7.82 ({getBuildInfo()})
        </span>
      )}
    </div>
  );
};
