import React from 'react';
import { useNavigate } from 'react-router-dom';

// Función para obtener información de compilación
const getBuildInfo = () => {
  const buildDate = new Date('2025-09-21T15:56:23.177Z'); // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Actualizado automáticamente // Fecha actualizada automáticamente
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

export const MainMenu: React.FC = () => {
  const navigate = useNavigate();

  const handleOptionClick = (option: string) => {
    switch (option) {
      case 'predirectorio':
        // TODO: Implementar funcionalidad de Predirectorio
        alert('Funcionalidad de Predirectorio en desarrollo');
        break;
      case 'directorio':
        navigate('/directorio');
        break;
      case 'jornada':
        // TODO: Implementar funcionalidad de Jornada de Coaching Empresarial
        alert('Funcionalidad de Jornada de Coaching Empresarial en desarrollo');
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="mb-4">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              v1.7.66 ({getBuildInfo()})
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Sistema de Gestión Empresarial Gemini
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plataforma integral para la gestión de directorios empresariales, 
            predirectorios y jornadas de coaching empresarial
          </p>
        </header>

        {/* Opciones principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Predirectorio */}
          <div 
            onClick={() => handleOptionClick('predirectorio')}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-200"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Predirectorio
              </h2>
              <p className="text-gray-600 mb-6">
                Herramientas para la planificación y preparación de directorios empresariales
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">
                  🚧 En Desarrollo
                </p>
              </div>
            </div>
          </div>

          {/* Directorio */}
          <div 
            onClick={() => handleOptionClick('directorio')}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-green-200"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">📁</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Directorio
              </h2>
              <p className="text-gray-600 mb-6">
                Gestión completa de directorios empresariales con cronómetro y control remoto
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Disponible
                </p>
              </div>
            </div>
          </div>

          {/* Jornada de Coaching Empresarial */}
          <div 
            onClick={() => handleOptionClick('jornada')}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 cursor-pointer transform hover:-translate-y-2 border-2 border-transparent hover:border-purple-200"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Jornada de Coaching Empresarial
              </h2>
              <p className="text-gray-600 mb-6">
                Herramientas especializadas para jornadas de coaching y desarrollo empresarial
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800 font-medium">
                  🚧 En Desarrollo
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Características del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center">
                <div className="text-3xl mb-2">⏱️</div>
                <h4 className="font-medium text-gray-800 mb-1">Cronómetro Inteligente</h4>
                <p className="text-sm text-gray-600">Control preciso de tiempos y etapas</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl mb-2">📱</div>
                <h4 className="font-medium text-gray-800 mb-1">Control Remoto</h4>
                <p className="text-sm text-gray-600">Gestión desde cualquier dispositivo</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl mb-2">🔄</div>
                <h4 className="font-medium text-gray-800 mb-1">Sincronización</h4>
                <p className="text-sm text-gray-600">Tiempo real entre dispositivos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Sistema desarrollado con React + TypeScript + Supabase + Pusher
          </p>
        </footer>
      </div>
    </div>
  );
};
