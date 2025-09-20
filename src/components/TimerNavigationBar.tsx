import React from 'react';

interface NavigationBarProps {
  onToggleSettings: () => void;
  onToggleAlwaysOnTop: () => void;
  onToggleBackgroundMode: () => void;
  onClose: () => void;
  isAlwaysOnTop: boolean;
  isBackgroundMode: boolean;
}

export const TimerNavigationBar: React.FC<NavigationBarProps> = ({
  onToggleSettings,
  onToggleAlwaysOnTop,
  onToggleBackgroundMode,
  onClose,
  isAlwaysOnTop,
  isBackgroundMode
}) => {
  return (
    <div className="bg-gray-800 text-white p-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-2">
        <button className="p-1 hover:bg-gray-700 rounded transition-colors">
          <span className="text-lg">≡</span>
        </button>
        <span className="text-sm font-medium">Cronómetro v1.7.46</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <button 
          onClick={onToggleSettings}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Configuración"
        >
          ⚙️
        </button>
        
        <button 
          onClick={onToggleAlwaysOnTop}
          className={`p-1 rounded transition-colors ${
            isAlwaysOnTop 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'hover:bg-gray-700'
          }`}
          title="Siempre visible"
        >
          📌
        </button>
        
        <button 
          onClick={onToggleBackgroundMode}
          className={`p-1 rounded transition-colors ${
            isBackgroundMode 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'hover:bg-gray-700'
          }`}
          title="Modo segundo plano"
        >
          🔒
        </button>
        
        <button 
          onClick={onClose}
          className="p-1 hover:bg-red-600 rounded transition-colors"
          title="Cerrar"
        >
          ❌
        </button>
      </div>
    </div>
  );
};
