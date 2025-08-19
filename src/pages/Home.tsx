import React from 'react';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Control de Reuniones
          </h1>
          <p className="text-gray-600">
            Gestiona el tiempo de tus reuniones de forma eficiente
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏱️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Bienvenido al Control de Reuniones
            </h2>
            <p className="text-gray-600 mb-6">
              Importa un archivo CSV con tu agenda o crea etapas manualmente para comenzar.
            </p>
            
            <div className="space-y-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                📁 Importar CSV
              </button>
              <div className="text-gray-500">o</div>
              <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
                ➕ Crear Etapa Manual
              </button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Atajos de Teclado:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <div><kbd className="bg-blue-200 px-2 py-1 rounded">Espacio</kbd> - Play/Pause</div>
                <div><kbd className="bg-blue-200 px-2 py-1 rounded">N</kbd> - Siguiente etapa</div>
                <div><kbd className="bg-blue-200 px-2 py-1 rounded">P</kbd> - Etapa anterior</div>
                <div><kbd className="bg-blue-200 px-2 py-1 rounded">R</kbd> - Reiniciar etapa</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
