import { useState, useEffect, useCallback } from 'react';
import { WakeLockSentinel } from '../types/timer';

declare global {
  interface Navigator {
    wakeLock?: {
      request(type: 'screen'): Promise<WakeLockSentinel>;
    };
  }
  
  interface Window {
    electronAPI?: {
      setAlwaysOnTop: (alwaysOnTop: boolean) => void;
      minimizeToTray: () => void;
    };
  }
}

export const useWindowPlugins = () => {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  // Plugin: Siempre visible (Always on Top)
  const toggleAlwaysOnTop = useCallback(() => {
    if (window.electronAPI) {
      // Para aplicaciones Electron
      window.electronAPI.setAlwaysOnTop(!isAlwaysOnTop);
    } else {
      // Para navegadores - usar CSS y JavaScript
      const body = document.body;
      if (!isAlwaysOnTop) {
        // Activar modo siempre visible
        body.style.position = 'fixed';
        body.style.top = '0';
        body.style.left = '0';
        body.style.width = '100%';
        body.style.height = '100%';
        body.style.zIndex = '9999';
        body.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        
        // Agregar clase para indicar estado
        body.classList.add('always-on-top');
        
        console.log('✅ Modo siempre visible activado');
      } else {
        // Desactivar modo siempre visible
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.width = '';
        body.style.height = '';
        body.style.zIndex = '';
        body.style.backgroundColor = '';
        
        // Remover clase
        body.classList.remove('always-on-top');
        
        console.log('❌ Modo siempre visible desactivado');
      }
    }
    setIsAlwaysOnTop(!isAlwaysOnTop);
  }, [isAlwaysOnTop]);

  // Plugin: Modo segundo plano (Background Mode)
  const toggleBackgroundMode = useCallback(async () => {
    if (!isBackgroundMode) {
      // Activar modo segundo plano
      try {
        if ('wakeLock' in navigator && navigator.wakeLock) {
          const lock = await navigator.wakeLock.request('screen');
          setWakeLock(lock);
          
          console.log('✅ Wake Lock activado para modo segundo plano');
          
          // Configurar para mantener activo
          lock.addEventListener('release', () => {
            console.log('⚠️ Wake Lock liberado');
            setWakeLock(null);
          });
        }
        
        // Configurar para mantener ventana activa
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Agregar clase para indicar estado
        document.body.classList.add('background-mode');
        
        console.log('✅ Modo segundo plano activado');
        
      } catch (err) {
        console.error('❌ Error activando modo segundo plano:', err);
      }
    } else {
      // Desactivar modo segundo plano
      if (wakeLock) {
        try {
          await wakeLock.release();
          setWakeLock(null);
          console.log('✅ Wake Lock liberado');
        } catch (err) {
          console.error('❌ Error liberando Wake Lock:', err);
        }
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.body.classList.remove('background-mode');
      
      console.log('❌ Modo segundo plano desactivado');
    }
    
    setIsBackgroundMode(!isBackgroundMode);
  }, [isBackgroundMode, wakeLock]);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && isBackgroundMode) {
      // Ventana oculta pero en modo segundo plano
      console.log('📱 Ventana en segundo plano - manteniendo activa');
      
      // Opcional: Mostrar notificación
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Cronómetro en segundo plano', {
          body: 'El cronómetro sigue funcionando en segundo plano',
          icon: '/favicon.ico',
          tag: 'timer-background'
        });
      }
    }
  }, [isBackgroundMode]);

  // Plugin: Minimizar a bandeja del sistema
  const minimizeToTray = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.minimizeToTray();
    } else {
      // Para navegadores - minimizar ventana
      window.blur();
      document.body.style.display = 'none';
      setTimeout(() => {
        document.body.style.display = '';
      }, 100);
    }
  }, []);

  // Plugin: Solicitar permisos de notificación
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permiso de notificación:', permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Limpiar recursos al desmontar
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLock, handleVisibilityChange]);

  return {
    isAlwaysOnTop,
    isBackgroundMode,
    toggleAlwaysOnTop,
    toggleBackgroundMode,
    minimizeToTray,
    requestNotificationPermission
  };
};
