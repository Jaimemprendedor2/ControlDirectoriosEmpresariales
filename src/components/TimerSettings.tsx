import React, { useState, useEffect } from 'react';
import { TimerSettings as TimerSettingsType, TimerSettingsProps } from '../types/timer';

export const TimerSettings: React.FC<TimerSettingsProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [settings, setSettings] = useState<TimerSettingsType>({
    fontSize: 16,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    showSeconds: true,
    autoStart: false,
    showProgress: true,
    soundEnabled: true,
    notificationEnabled: true
  });

  // Cargar configuración guardada
  useEffect(() => {
    const savedSettings = localStorage.getItem('timer-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    }
  }, []);

  // Guardar configuración
  const handleSave = () => {
    localStorage.setItem('timer-settings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  // Aplicar configuración en tiempo real
  useEffect(() => {
    if (isOpen) {
      const root = document.documentElement;
      root.style.setProperty('--timer-font-size', `${settings.fontSize}px`);
      root.style.setProperty('--timer-bg-color', settings.backgroundColor);
      root.style.setProperty('--timer-text-color', settings.textColor);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Configuración del Cronómetro</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Tamaño de fuente */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tamaño de fuente: {settings.fontSize}px
            </label>
            <input
              type="range"
              min="12"
              max="48"
              value={settings.fontSize}
              onChange={(e) => setSettings({...settings, fontSize: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>
          
          {/* Color de fondo */}
          <div>
            <label className="block text-sm font-medium mb-2">Color de fondo</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})}
                className="w-12 h-10 rounded border"
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) => setSettings({...settings, backgroundColor: e.target.value})}
                className="flex-1 px-2 py-1 border rounded"
                placeholder="#000000"
              />
            </div>
          </div>
          
          {/* Color de texto */}
          <div>
            <label className="block text-sm font-medium mb-2">Color de texto</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                className="w-12 h-10 rounded border"
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => setSettings({...settings, textColor: e.target.value})}
                className="flex-1 px-2 py-1 border rounded"
                placeholder="#ffffff"
              />
            </div>
          </div>
          
          {/* Opciones de visualización */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Visualización</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showSeconds"
                checked={settings.showSeconds}
                onChange={(e) => setSettings({...settings, showSeconds: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="showSeconds" className="text-sm">Mostrar segundos</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showProgress"
                checked={settings.showProgress}
                onChange={(e) => setSettings({...settings, showProgress: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="showProgress" className="text-sm">Mostrar barra de progreso</label>
            </div>
          </div>
          
          {/* Opciones de comportamiento */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Comportamiento</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoStart"
                checked={settings.autoStart}
                onChange={(e) => setSettings({...settings, autoStart: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="autoStart" className="text-sm">Iniciar automáticamente</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="soundEnabled"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings({...settings, soundEnabled: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="soundEnabled" className="text-sm">Sonidos habilitados</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notificationEnabled"
                checked={settings.notificationEnabled}
                onChange={(e) => setSettings({...settings, notificationEnabled: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="notificationEnabled" className="text-sm">Notificaciones habilitadas</label>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};
