import React, { useState } from 'react';

interface DirectorySetupFormProps {
  onSubmit: (data: { name: string; date: string }) => void;
}

export const DirectorySetupForm: React.FC<DirectorySetupFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && date) {
      onSubmit({ name: name.trim(), date });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏢</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Configuración de Directorios Empresariales Gemini
            </h1>
            <p className="text-gray-600">
              Ingresa los datos básicos del directorio empresarial
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="directoryName" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Directorio Empresarial
              </label>
              <input
                type="text"
                id="directoryName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Directorio Ejecutivo 2024"
                required
              />
            </div>

            <div>
              <label htmlFor="directoryDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha del Directorio
              </label>
              <input
                type="date"
                id="directoryDate"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !date}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span className="text-xl">🚀</span>
              <span>Continuar a Configuración</span>
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Información:</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• El directorio se creará sin etapas iniciales</div>
              <div>• Podrás agregar etapas en la siguiente pantalla</div>
              <div>• Los datos se guardarán automáticamente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
