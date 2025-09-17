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

  // Obtener color de fondo basado en el tiempo restante
  const getBackgroundColor = () => {
    if (!currentStage) return 'bg-gray-900';
    
    const timePercentage = (timeLeft / currentStage.duration) * 100;
    
    if (timePercentage <= 10) return 'bg-red-900';
    if (timePercentage <= 25) return 'bg-orange-900';
    if (timePercentage <= 50) return 'bg-yellow-900';
    return 'bg-gray-900';
  };

  return (
    <div className={`min-h-screen ${getBackgroundColor()} text-white flex items-center justify-center p-4 transition-colors duration-500`}>
      <div className="text-center">
        {/* Cronómetro principal - Tamaño ajustado para ventana 960x540px */}
        <div className={`text-[12rem] font-mono font-bold mb-12 ${isAlertBlinking ? 'animate-pulse' : ''}`}>
          {formatTime(timeLeft)}
        </div>

        {/* Información de la etapa */}
        <div className="text-6xl">
          {currentStage?.title || 'Etapa'}
        </div>
      </div>
    </div>
  );
};