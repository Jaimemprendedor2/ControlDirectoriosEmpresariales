import React, { useState, useEffect } from 'react';
import { createPusherService, CommandData } from '../services/pusherService';

interface Stage {
  id?: string;
  title: string;
  duration: number;
  order_index?: number;
  is_completed?: boolean;
  colors?: Array<{
    timeInSeconds: number;
    backgroundColor: string;
  }>;
  alertColor?: string;
  alertSeconds?: number;
}

export const MeetingView: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isAlertBlinking, setIsAlertBlinking] = useState(false);
  
  // Establecer título de la ventana
  useEffect(() => {
    document.title = 'Cronómetro en Pantalla';
  }, []);
  

  const currentStage = stages[currentStageIndex];

  // Función para obtener configuración de Pusher
  const getPusherConfig = () => {
    return {
      appKey: import.meta.env.VITE_PUSHER_KEY || 'tu_pusher_key_aqui',
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'tu_cluster_aqui'
    };
  };

  // Función para formatear tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cargar estado inicial desde localStorage
  useEffect(() => {
    const loadInitialState = () => {
      const savedTimeLeft = localStorage.getItem('currentTimeLeft');
      const savedStages = localStorage.getItem('meetingStages');
      const savedStageIndex = localStorage.getItem('currentStageIndex');

      if (savedTimeLeft) {
        setTimeLeft(parseInt(savedTimeLeft));
      }

      if (savedStages) {
        try {
          const parsedStages = JSON.parse(savedStages);
          setStages(parsedStages);
        } catch (error) {
          console.error('Error parsing stages:', error);
        }
      }

      if (savedStageIndex) {
        setCurrentStageIndex(parseInt(savedStageIndex));
      }
    };

    loadInitialState();
  }, []);

  // Configurar Pusher
  useEffect(() => {
    const pusherConfig = getPusherConfig();
    
    if (!pusherConfig.appKey || pusherConfig.appKey === 'tu_pusher_key_aqui') {
      console.log('Pusher no configurado, usando solo localStorage');
      return;
    }

    const pusherService = createPusherService({
      appKey: pusherConfig.appKey,
      cluster: pusherConfig.cluster,
      room: 'meeting-reflection' // Sala para reflejo del timer
    });

    // Configurar callbacks
    pusherService.onConnectionChange((state) => {
      console.log('Estado de conexión Pusher:', state);
    });

    pusherService.onCommand((command: CommandData) => {
      console.log('Comando recibido en MeetingView:', command);
      
      switch (command.action) {
        case 'setTime':
          if (command.data?.seconds !== undefined) {
            const seconds = typeof command.data.seconds === 'number' ? command.data.seconds : parseInt(command.data.seconds || '0');
            if (!isNaN(seconds)) {
              setTimeLeft(seconds);
              // NO escribir a localStorage - solo mostrar lo recibido
              console.log('🚀 Ventana reflejo (Pusher) actualizada a:', seconds, 'segundos');
            } else {
              console.error('Tiempo inválido recibido por Pusher:', command.data.seconds);
            }
          }
          break;
        case 'pauseResume':
          if (command.data?.isRunning !== undefined) {
            localStorage.setItem('isTimerRunning', command.data.isRunning.toString());
          }
          break;
        case 'setStage':
          if (command.data?.stageIndex !== undefined) {
            setCurrentStageIndex(command.data.stageIndex);
            localStorage.setItem('currentStageIndex', command.data.stageIndex.toString());
          }
          break;
        case 'setStages':
          if (command.data?.stages) {
            setStages(command.data.stages);
            localStorage.setItem('meetingStages', JSON.stringify(command.data.stages));
          }
          break;
        case 'stopTimer':
          // No resetear a 0, mantener el tiempo actual
          console.log('Comando stopTimer recibido, manteniendo tiempo actual');
          break;
        case 'syncState':
          if (command.data) {
            const { currentTimeLeft, isTimerRunning, currentStageIndex, stages } = command.data;
            if (currentTimeLeft !== undefined) {
              setTimeLeft(parseInt(currentTimeLeft));
              // NO escribir a localStorage - solo mostrar
            }
            if (isTimerRunning !== undefined) {
              // NO escribir a localStorage - solo mostrar
            }
            if (currentStageIndex !== undefined) {
              setCurrentStageIndex(currentStageIndex);
              // NO escribir a localStorage - solo mostrar
            }
            if (stages) {
              setStages(stages);
              // NO escribir a localStorage - solo mostrar
            }
          }
          break;
      }
    });

    // Cleanup
    return () => {
      if (pusherService) {
        pusherService.disconnect();
      }
    };
  }, []);

  // Escuchar mensajes del parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Mensaje recibido en MeetingView:', event.data);
      
      if (event.data.action === 'pauseResume') {
        localStorage.setItem('isTimerRunning', event.data.isRunning.toString());
      } else if (event.data.action === 'setTime') {
        const seconds = typeof event.data.seconds === 'number' ? event.data.seconds : parseInt(event.data.seconds || '0');
        if (!isNaN(seconds)) {
          setTimeLeft(seconds);
          // NO escribir a localStorage - solo mostrar lo recibido
          console.log('🚀 Ventana reflejo actualizada a:', seconds, 'segundos');
        } else {
          console.error('Tiempo inválido recibido:', event.data.seconds);
        }
      } else if (event.data.action === 'setStage') {
        setCurrentStageIndex(event.data.stageIndex);
        // NO escribir a localStorage - solo mostrar
      } else if (event.data.action === 'setStages') {
        setStages(event.data.stages);
        // NO escribir a localStorage - solo mostrar
      } else if (event.data.action === 'stopTimer') {
        // No resetear a 0, mantener el tiempo actual
        console.log('Comando stopTimer recibido vía postMessage, manteniendo tiempo actual');
      } else if (event.data.action === 'syncState') {
        const { currentTimeLeft, isTimerRunning, currentStageIndex, stages } = event.data;
        if (currentTimeLeft !== undefined) {
          setTimeLeft(parseInt(currentTimeLeft));
          // NO escribir a localStorage - solo mostrar
        }
        if (isTimerRunning !== undefined) {
          // NO escribir a localStorage - solo mostrar
        }
        if (currentStageIndex !== undefined) {
          setCurrentStageIndex(currentStageIndex);
          // NO escribir a localStorage - solo mostrar
        }
        if (stages) {
          setStages(stages);
          // NO escribir a localStorage - solo mostrar
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Eliminar márgenes globales para cobertura completa
  useEffect(() => {
    // Eliminar márgenes del body y html
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    return () => {
      // Restaurar estilos al desmontar
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
    };
  }, []);

  // Forzar tamaño de ventana
  useEffect(() => {
    const forceWindowSize = () => {
      if (window.outerWidth !== 960 || window.outerHeight !== 614) {
        window.resizeTo(960, 614);
      }
    };
    
    // Forzar tamaño inmediatamente
    forceWindowSize();
    
    // Verificar tamaño periódicamente
    const sizeInterval = setInterval(forceWindowSize, 1000);
    
    // Prevenir redimensionamiento
    window.addEventListener('resize', forceWindowSize);
    
    return () => {
      clearInterval(sizeInterval);
      window.removeEventListener('resize', forceWindowSize);
    };
  }, []);

  // Sistema robusto de sincronización - Capa 1: Keep-Alive Agresivo
  useEffect(() => {
    const keepAlive = () => {
      // Forzar foco cada 100ms
      if (document.hidden || !document.hasFocus()) {
        window.focus();
      }
      
      // Enviar señal de vida a ventana padre
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          action: 'keepAlive',
          timestamp: Date.now()
        }, '*');
      }
    };
    
    // Keep-alive cada 100ms (muy frecuente)
    const keepAliveInterval = setInterval(keepAlive, 100);
    
    return () => clearInterval(keepAliveInterval);
  }, []);

  // Sistema robusto de sincronización - Capa 2: Sincronización Forzada Constante
  useEffect(() => {
    const forceSync = () => {
      const currentTime = localStorage.getItem('currentTimeLeft');
      const currentStageIdx = localStorage.getItem('currentStageIndex');
      const savedStages = localStorage.getItem('meetingStages');
      
      // Actualizar tiempo sin verificar cambios previos
      if (currentTime) {
        const seconds = parseInt(currentTime);
        if (!isNaN(seconds)) {
          setTimeLeft(seconds);
        }
      }
      
      // Actualizar etapa
      if (currentStageIdx) {
        const stageIdx = parseInt(currentStageIdx);
        if (!isNaN(stageIdx)) {
          setCurrentStageIndex(stageIdx);
        }
      }
      
      // Actualizar stages
      if (savedStages) {
        try {
          const parsedStages = JSON.parse(savedStages);
          setStages(parsedStages);
        } catch (error) {
          console.error('Error parsing stages:', error);
        }
      }
    };
    
    // Sincronización cada 200ms (muy frecuente)
    const syncInterval = setInterval(forceSync, 200);
    
    return () => clearInterval(syncInterval);
  }, []);

  // Sistema robusto de sincronización - Capa 3: Timer Interno de Respaldo
  useEffect(() => {
    let backupTimer: NodeJS.Timeout;
    
    const startBackupTimer = () => {
      backupTimer = setInterval(() => {
        const currentTime = localStorage.getItem('currentTimeLeft');
        const isRunning = localStorage.getItem('isTimerRunning');
        
        if (currentTime && isRunning === 'true') {
          const seconds = parseInt(currentTime);
          if (!isNaN(seconds) && seconds > 0) {
            const newTime = seconds - 1;
            localStorage.setItem('currentTimeLeft', newTime.toString());
            setTimeLeft(newTime);
            
            if (newTime === 0) {
              localStorage.setItem('isTimerRunning', 'false');
            }
          }
        }
      }, 1000);
    };
    
    startBackupTimer();
    
    return () => {
      if (backupTimer) clearInterval(backupTimer);
    };
  }, []);

  // Sistema robusto de sincronización - Capa 5: Verificación y Recuperación
  useEffect(() => {
    const healthCheck = () => {
      // Verificar que la ventana padre siga activa
      if (window.opener && window.opener.closed) {
        console.log('⚠️ Ventana padre cerrada, cerrando reflejo');
        window.close();
        return;
      }
      
      // Verificar que el localStorage esté actualizado
      const lastUpdate = localStorage.getItem('lastTimerUpdate');
      const now = Date.now();
      
      if (lastUpdate && (now - parseInt(lastUpdate)) > 5000) {
        console.log('⚠️ Timer desactualizado, forzando sincronización');
        // Forzar sincronización inmediata
        const currentTime = localStorage.getItem('currentTimeLeft');
        if (currentTime) {
          setTimeLeft(parseInt(currentTime));
        }
      }
    };
    
    // Verificación cada 1 segundo
    const healthInterval = setInterval(healthCheck, 1000);
    
    return () => clearInterval(healthInterval);
  }, []);

  // Sistema robusto de sincronización - Capa 6: Event Listeners Mejorados
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Sincronización inmediata al volver visible
        const currentTime = localStorage.getItem('currentTimeLeft');
        if (currentTime) {
          setTimeLeft(parseInt(currentTime));
        }
      }
    };
    
    const handleFocus = () => {
      // Sincronización inmediata al ganar foco
      const currentTime = localStorage.getItem('currentTimeLeft');
      if (currentTime) {
        setTimeLeft(parseInt(currentTime));
      }
    };
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.action === 'syncAll') {
        const { currentTimeLeft, currentStageIndex, meetingStages } = event.data.data;
        
        if (currentTimeLeft) {
          setTimeLeft(parseInt(currentTimeLeft));
        }
        
        if (currentStageIndex) {
          setCurrentStageIndex(parseInt(currentStageIndex));
        }
        
        if (meetingStages) {
          try {
            setStages(JSON.parse(meetingStages));
          } catch (error) {
            console.error('Error parsing stages:', error);
          }
        }
        
        // Actualizar timestamp
        localStorage.setItem('lastTimerUpdate', Date.now().toString());
      }
    };
    
    // Agregar todos los event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('message', handleMessage);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Sincronización automática con localStorage para URL independiente
  useEffect(() => {
    const syncFromLocalStorage = () => {
      const currentTime = localStorage.getItem('currentTimeLeft');
      const currentStageIdx = localStorage.getItem('currentStageIndex');
      const savedStages = localStorage.getItem('meetingStages');
      
      if (currentTime) {
        const seconds = parseInt(currentTime);
        if (!isNaN(seconds) && seconds !== timeLeft) {
          setTimeLeft(seconds);
          console.log('🔄 Sincronizado desde localStorage - tiempo:', seconds);
        }
      }
      
      if (currentStageIdx) {
        const stageIdx = parseInt(currentStageIdx);
        if (!isNaN(stageIdx) && stageIdx !== currentStageIndex) {
          setCurrentStageIndex(stageIdx);
          console.log('🔄 Sincronizado desde localStorage - etapa:', stageIdx);
        }
      }
      
      if (savedStages) {
        try {
          const parsedStages = JSON.parse(savedStages);
          if (JSON.stringify(parsedStages) !== JSON.stringify(stages)) {
            setStages(parsedStages);
            console.log('🔄 Sincronizado desde localStorage - stages:', parsedStages.length);
          }
        } catch (error) {
          console.error('Error parsing stages from localStorage:', error);
        }
      }
    };

    // Sincronizar inmediatamente
    syncFromLocalStorage();
    
    // Crear intervalo para sincronización periódica cada 1 segundo (reducido para evitar oscilaciones)
    const syncInterval = setInterval(syncFromLocalStorage, 1000);
    
    return () => clearInterval(syncInterval);
  }, [timeLeft, currentStageIndex, stages]);
  
  // Sincronización adicional cuando cambia el foco de la ventana
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔄 Ventana enfocada - sincronizando inmediatamente');
      const currentTime = localStorage.getItem('currentTimeLeft');
      const currentStageIdx = localStorage.getItem('currentStageIndex');
      const savedStages = localStorage.getItem('meetingStages');
      
      if (currentTime) {
        const seconds = parseInt(currentTime);
        if (!isNaN(seconds)) {
          setTimeLeft(seconds);
        }
      }
      
      if (currentStageIdx) {
        const stageIdx = parseInt(currentStageIdx);
        if (!isNaN(stageIdx)) {
          setCurrentStageIndex(stageIdx);
        }
      }
      
      if (savedStages) {
        try {
          const parsedStages = JSON.parse(savedStages);
          setStages(parsedStages);
        } catch (error) {
          console.error('Error parsing stages on focus:', error);
        }
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Timer effect - ELIMINADO: La ventana de reflejo debe ser pasiva
  // Solo recibe actualizaciones del cronómetro principal vía postMessage
  // No debe tener su propio timer para evitar conflictos de sincronización

  // Efecto para parpadeo de alerta
  useEffect(() => {
    if (timeLeft <= 15 && timeLeft > 0) {
      setIsAlertBlinking(true);
    } else {
      setIsAlertBlinking(false);
    }
  }, [timeLeft]);

  // Obtener color de fondo basado en el tiempo restante y colores configurados
  const getBackgroundColor = () => {
    if (!currentStage) {
      console.log('🔍 getBackgroundColor: No currentStage, usando color por defecto');
      return '#1f2937'; // bg-gray-900 equivalente
    }
    
    console.log('🔍 getBackgroundColor debug:', {
      currentStage: currentStage.title,
      duration: currentStage.duration,
      timeLeft: timeLeft,
      colors: currentStage.colors,
      colorsLength: currentStage.colors?.length || 0
    });
    
    // Si hay colores configurados, usarlos
    if (currentStage.colors && currentStage.colors.length > 0) {
      const timeElapsed = currentStage.duration - timeLeft;
      console.log('🔍 Tiempo transcurrido:', timeElapsed, 'segundos');
      console.log('🔍 Colores disponibles:', currentStage.colors);
      
      // Ordenar colores por tiempo de activación (de menor a mayor)
      const sortedColors = currentStage.colors.sort((a, b) => a.timeInSeconds - b.timeInSeconds);
      console.log('🔍 Colores ordenados por tiempo:', sortedColors);
      
      // Lógica mejorada: encontrar el color apropiado basado en el tiempo transcurrido
      let selectedColor = null;
      
      // Si el tiempo transcurrido es menor que el primer color configurado,
      // usar el color por defecto (no aplicar ningún color configurado)
      if (timeElapsed < sortedColors[0].timeInSeconds) {
        console.log('🔍 Tiempo transcurrido menor al primer color configurado, usando color por defecto');
        selectedColor = null; // Esto hará que se use el color por defecto
      } else {
        // Buscar el color que corresponde al tiempo transcurrido
        for (let i = 0; i < sortedColors.length; i++) {
          const color = sortedColors[i];
          const nextColor = sortedColors[i + 1];
          
          // Si es el último color o el tiempo transcurrido está entre este color y el siguiente
          if (!nextColor || (timeElapsed >= color.timeInSeconds && timeElapsed < nextColor.timeInSeconds)) {
            selectedColor = color;
            break;
          }
        }
        
        // Si no se encontró un color específico, usar el último color si el tiempo ya superó todos
        if (!selectedColor && timeElapsed >= sortedColors[sortedColors.length - 1].timeInSeconds) {
          selectedColor = sortedColors[sortedColors.length - 1];
        }
      }
      
      if (selectedColor) {
        console.log('🎨 Aplicando color configurado:', selectedColor.backgroundColor, 'para tiempo transcurrido:', timeElapsed, 'segundos');
        return selectedColor.backgroundColor;
      } else {
        console.log('🔍 No se aplica color configurado, usando color por defecto');
      }
    } else {
      console.log('⚠️ No hay colores configurados para esta etapa');
    }
    
    // Si no hay colores configurados o no se aplica ninguno, usar colores por defecto
    const timePercentage = (timeLeft / currentStage.duration) * 100;
    console.log('🔍 Usando colores por defecto, porcentaje:', timePercentage);
    
    if (timePercentage <= 10) return '#7f1d1d'; // bg-red-900 equivalente
    if (timePercentage <= 25) return '#9a3412'; // bg-orange-900 equivalente
    if (timePercentage <= 50) return '#713f12'; // bg-yellow-900 equivalente
    return '#1f2937'; // bg-gray-900 equivalente
  };

  return (
    <div 
      className="text-white flex flex-col items-center justify-center transition-colors duration-500"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        padding: '20px',
        boxSizing: 'border-box',
        margin: 0,
        backgroundColor: getBackgroundColor()
      }}
    >
      {/* Cronómetro principal - Tamaño ajustado para ventana 960x614px */}
      <div 
        className={`font-mono font-bold ${isAlertBlinking ? 'animate-pulse' : ''}`}
        style={{
          fontSize: '200px',
          lineHeight: '0.8',
          textAlign: 'center',
          marginBottom: '20px',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      >
        {formatTime(timeLeft)}
      </div>

      {/* Información de la etapa */}
      <div 
        className="font-bold"
        style={{
          fontSize: '60px',
          lineHeight: '1',
          textAlign: 'center',
          maxWidth: '100%',
          overflow: 'hidden',
          wordWrap: 'break-word'
        }}
      >
        {currentStage?.title || 'Etapa'}
      </div>
    </div>
  );
};