import React, { useEffect } from 'react';

export const Presenter: React.FC = () => {
  useEffect(() => {
    // Configurar la ventana para modo presentación
    document.title = 'Control de Reuniones - Modo Presentación';
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="text-center max-w-4xl w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Modo Presentación</h1>
          <p className="text-xl text-gray-300">
            Vista optimizada para proyección
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <div className="text-6xl mb-6">⏱️</div>
          
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Etapa Actual</h2>
            <p className="text-xl text-gray-400">Sin etapa activa</p>
          </div>

          <div className="mb-6">
            <div className="text-6xl font-mono font-bold text-blue-400">
              00:00
            </div>
            <p className="text-lg text-gray-400 mt-2">Tiempo restante</p>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-1000" 
              style={{ width: '0%' }}
            ></div>
          </div>

          <div className="text-lg text-gray-400">
            Progreso: 0 / 0 etapas
          </div>
        </div>

        <div className="text-gray-500">
          <p className="mb-2">Esta ventana se sincroniza automáticamente con la ventana principal</p>
          <p className="text-sm">Controla la reunión desde la ventana principal</p>
        </div>
      </div>
    </div>
  );
};
