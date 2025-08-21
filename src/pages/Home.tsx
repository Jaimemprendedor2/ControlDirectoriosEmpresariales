import React, { useState, useEffect } from 'react';
import { CsvDropzone } from '../components/CsvDropzone';
import { StagesList } from '../components/StagesList';
import { StageColorConfig } from '../components/StageColorConfig';
import { MeetingService } from '../services/meetingService';
import { Meeting } from '../lib/supabase';

interface Stage {
  id?: string;
  title: string;
  description?: string;
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

export const Home: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [newMeetingName, setNewMeetingName] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');

  const [configuringColors, setConfiguringColors] = useState<{index: number, stage: Stage} | null>(null);
  const [meetingWindow, setMeetingWindow] = useState<Window | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [keyboardShortcuts, setKeyboardShortcuts] = useState({
    pauseResume: { key: 'Space', ctrl: false, alt: false, shift: false, global: false },
    nextStage: { key: 'KeyN', ctrl: false, alt: false, shift: false, global: false },
    previousStage: { key: 'KeyP', ctrl: false, alt: false, shift: false, global: false },
    addTime: { key: 'Equal', ctrl: false, alt: false, shift: false, global: false },
    subtractTime: { key: 'Minus', ctrl: false, alt: false, shift: false, global: false }
  });
  const [showShortcutConfig, setShowShortcutConfig] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [configuringShortcut, setConfiguringShortcut] = useState<string | null>(null);
  const [timerUpdate, setTimerUpdate] = useState(0); // Para forzar re-render del cronómetro
  const [isLongPress, setIsLongPress] = useState(false); // Para manejar presión prolongada del botón

  // Función para obtener información de compilación
  const getBuildInfo = () => {
    // Fecha fija de compilación (se actualiza cuando se hace un nuevo build)
    const buildDate = new Date();
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

  // Función para formatear combinaciones de teclas
  const formatShortcut = (shortcut: { key: string; ctrl: boolean; alt: boolean; shift: boolean; global: boolean }) => {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    
    let key = shortcut.key;
    if (key === 'Space') key = 'Espacio';
    else if (key === 'KeyN') key = 'N';
    else if (key === 'KeyP') key = 'P';
    else if (key === 'Equal') key = '+';
    else if (key === 'Minus') key = '-';
    else if (key.startsWith('F')) key = key; // F1, F2, etc.
    
    parts.push(key);
    return parts.join(' + ');
  };

  // Cargar directorios desde la base de datos
  const loadMeetings = async () => {
    try {
      const meetingsData = await MeetingService.getMeetings();
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Error cargando directorios:', error);
    }
  };

  // Crear nuevo directorio
  const handleCreateNewMeeting = async () => {
    if (!newMeetingName.trim()) {
      alert('Por favor ingresa un nombre para el directorio');
      return;
    }

    try {
      // Crear el directorio
      const meeting = await MeetingService.createMeeting(
        newMeetingName,
        `Directorio creado el ${newMeetingDate || new Date().toLocaleDateString('es-CL')}`
      );

      // Crear la etapa "Inicio" automáticamente
      await MeetingService.addStage(meeting.id, 'Inicio', 300); // 5 minutos = 300 segundos

      // Cargar el directorio recién creado
      await loadMeetingWithStages(meeting.id);
      setSelectedMeeting(meeting);
      
      // Cerrar modal y limpiar campos
      setShowNewMeetingModal(false);
      setNewMeetingName('');
      setNewMeetingDate('');
      
      // Recargar la lista de directorios
      await loadMeetings();
    } catch (error) {
      console.error('Error creando directorio:', error);
      alert('Error al crear el directorio');
    }
  };

  // Cargar un directorio específico con sus etapas
  const loadMeetingWithStages = async (meetingId: string) => {
    try {
      const { meeting, stages: meetingStages } = await MeetingService.getMeetingWithStages(meetingId);
      
      // Convertir MeetingStage[] a Stage[]
      const convertedStages: Stage[] = meetingStages.map(stage => ({
        id: stage.id,
        title: stage.title,
        description: '',
        duration: stage.duration,
        order_index: stage.order_index,
        is_completed: stage.is_completed,
        alertColor: '#FF0000',
        alertSeconds: 15
      }));
      
      setStages(convertedStages);
      setSelectedMeeting(meeting);
    } catch (error) {
      console.error('Error cargando directorio:', error);
    }
  };

  // Seleccionar un directorio de la lista
  const handleSelectMeeting = (meeting: Meeting) => {
    loadMeetingWithStages(meeting.id);
  };

  // Eliminar un directorio
  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;

    // Confirmar la eliminación
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar el directorio "${selectedMeeting.title}"?\n\nEsta acción no se puede deshacer y eliminará todas las etapas asociadas.`
    );

    if (!confirmDelete) return;

    try {
      // Cerrar la ventana de reunión si está abierta
      if (meetingWindow && !meetingWindow.closed) {
        meetingWindow.close();
        setMeetingWindow(null);
        setIsTimerRunning(false);
      }

      // Eliminar el directorio de la base de datos
      await MeetingService.deleteMeeting(selectedMeeting.id);
      
      // Limpiar el estado local
      setSelectedMeeting(null);
      setStages([]);
      
      // Recargar la lista de directorios
      await loadMeetings();
      
      alert('Directorio eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando directorio:', error);
      alert('Error al eliminar el directorio');
    }
  };

  // Función para obtener el tiempo actual del cronómetro
  const getCurrentTime = () => {
    // Usar timerUpdate para forzar la actualización
    timerUpdate; // Esto hace que la función se ejecute cada vez que timerUpdate cambie
    
    const currentStage = stages[currentStageIndex];
    if (!currentStage) return "00:00";
    
    // Obtener el tiempo del localStorage con mejor sincronización
    const timeLeft = localStorage.getItem('currentTimeLeft');
    let seconds = timeLeft ? parseInt(timeLeft) : currentStage.duration;
    
    // Asegurar que el tiempo no sea negativo y no sea NaN
    if (isNaN(seconds)) {
      seconds = currentStage.duration;
      // Si el valor es NaN, corregir el localStorage
      localStorage.setItem('currentTimeLeft', seconds.toString());
    }
    
    const validSeconds = Math.max(0, seconds);
    
    const minutes = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    
    // Usar el mismo formato que MeetingView para consistencia
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImportStages = (importedStages: Array<{ title: string; description?: string; duration: number; color?: string }>) => {
    const newStages = importedStages.map((stage, index) => ({
      title: stage.title,
      description: stage.description || '',
      duration: stage.duration,
      order_index: index + 1,
      alertColor: stage.color || '#FF0000',
      alertSeconds: 15
    }));
    setStages(newStages);
    setShowImport(false);
  };



  const handleQuickAddStage = async () => {
    if (!selectedMeeting) {
      alert('Selecciona un directorio primero');
      return;
    }

    try {
      // Crear la etapa en la base de datos
      await MeetingService.addStage(selectedMeeting.id, 'Nueva Etapa', 30);
      
      // Recargar las etapas del directorio
      await loadMeetingWithStages(selectedMeeting.id);
      
      // Poner en modo edición la última etapa añadida
      setEditingIndex(stages.length);
    } catch (error) {
      console.error('Error agregando etapa:', error);
      alert('Error al agregar la etapa');
    }
  };

  const handleRemoveStage = (index: number) => {
    const newStages = stages.filter((_, i) => i !== index);
    // Reorder stages
    const reorderedStages = newStages.map((stage, i) => ({
      ...stage,
      order_index: i + 1
    }));
    setStages(reorderedStages);
  };

  const handleEditStage = (index: number, _stage: Stage) => {
    console.log('=== handleEditStage DEBUG ===');
    console.log('Índice recibido:', index);
    console.log('Etapa a editar:', _stage);
    console.log('stages.length:', stages.length);
    console.log('editingIndex actual:', editingIndex);
    console.log('selectedMeeting:', selectedMeeting);
    
    // Asegurar que el índice sea válido
    if (index >= 0 && index < stages.length) {
      console.log('✅ Índice válido, estableciendo editingIndex a:', index);
      setEditingIndex(index);
      
      // Verificar que el estado se actualizó
      setTimeout(() => {
        console.log('🔄 editingIndex después de setState:', editingIndex);
      }, 0);
    } else {
      console.error('❌ Índice de etapa inválido:', index);
    }
  };

  const handleSaveEdit = async (index: number, title: string, description: string, duration: number, alertColor: string, alertSeconds: number) => {
    try {
      const stageToUpdate = stages[index];
      
      // Si la etapa tiene ID (está en la base de datos), actualizarla
      if (stageToUpdate.id && selectedMeeting) {
        await MeetingService.updateStage(stageToUpdate.id, title, duration);
        console.log('Etapa actualizada en BD:', stageToUpdate.id, { title, duration });
      }
      
      // Actualizar el estado local
      const newStages = [...stages];
      newStages[index] = {
        ...newStages[index],
        title,
        description,
        duration,
        alertColor,
        alertSeconds
      };
      setStages(newStages);
      setEditingIndex(null);
      
      console.log('Etapa actualizada exitosamente:', index, title);
    } catch (error) {
      console.error('Error actualizando etapa:', error);
      alert('Error al actualizar la etapa');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleConfigureColors = (index: number, stage: Stage) => {
    setConfiguringColors({ index, stage });
  };

  const handleSaveColors = (colors: Array<{ timeInSeconds: number; backgroundColor: string }>, alertColor: string) => {
    if (configuringColors) {
      const newStages = [...stages];
      newStages[configuringColors.index] = {
        ...newStages[configuringColors.index],
        colors,
        alertColor
      };
      setStages(newStages);
      setConfiguringColors(null);
    }
  };

  // Funciones para controlar el cronómetro
  const sendMessageToMeetingWindow = (action: string, data?: any) => {
    if (meetingWindow && !meetingWindow.closed) {
      meetingWindow.postMessage({ action, data }, '*');
    }
  };

  const handlePreviousStage = () => {
    if (currentStageIndex > 0) {
      const newIndex = currentStageIndex - 1;
      setCurrentStageIndex(newIndex);
      // Sincronizar el tiempo de la nueva etapa y actualizar tiempo inicial
      const newStageTime = stages[newIndex].duration;
      localStorage.setItem('currentTimeLeft', newStageTime.toString());
      localStorage.setItem('initialTime', newStageTime.toString());
      // Pausar el cronómetro al cambiar de etapa
      setIsTimerRunning(false);
      sendMessageToMeetingWindow('previousStage', { stageIndex: newIndex });
    }
  };

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      const newIndex = currentStageIndex + 1;
      setCurrentStageIndex(newIndex);
      // Sincronizar el tiempo de la nueva etapa y actualizar tiempo inicial
      const newStageTime = stages[newIndex].duration;
      localStorage.setItem('currentTimeLeft', newStageTime.toString());
      localStorage.setItem('initialTime', newStageTime.toString());
      // Pausar el cronómetro al cambiar de etapa
      setIsTimerRunning(false);
      sendMessageToMeetingWindow('nextStage', { stageIndex: newIndex });
    }
  };

  const handlePauseResume = () => {
    const newRunningState = !isTimerRunning;
    setIsTimerRunning(newRunningState);
    
    // Sincronizar inmediatamente el estado del panel de control
    if (!newRunningState) {
      // Si se va a pausar, obtener el tiempo actual del localStorage
      const currentTimeLeft = localStorage.getItem('currentTimeLeft');
      if (currentTimeLeft) {
        // Forzar una actualización inmediata del panel de control
        setTimerUpdate(prev => prev + 1);
      }
    }
    
    sendMessageToMeetingWindow('pauseResume', { isRunning: newRunningState });
  };



  const handleResetToZero = () => {
    // Resetear a 00:00
    localStorage.setItem('currentTimeLeft', '0');
    sendMessageToMeetingWindow('setTime', { seconds: 0 });
    setIsTimerRunning(false);
  };

  // Funciones para manejar presión prolongada del botón
  const handlePauseButtonMouseDown = () => {
    // Resetear el estado de presión prolongada al inicio
    setIsLongPress(false);
    
    const timer = setTimeout(() => {
      setIsLongPress(true);
      handleResetToZero(); // Cambiar a resetear a 00:00
    }, 1000); // 1 segundo

    // Guardar el timer para poder cancelarlo
    (window as any).pauseButtonTimer = timer;
  };

  const handlePauseButtonMouseUp = () => {
    if ((window as any).pauseButtonTimer) {
      clearTimeout((window as any).pauseButtonTimer);
      (window as any).pauseButtonTimer = null;
    }
    
    // Solo ejecutar pausar/reanudar si no fue una presión prolongada
    if (!isLongPress) {
      handlePauseResume();
    }
    
    // Resetear el estado de presión prolongada después de un breve delay
    setTimeout(() => setIsLongPress(false), 200);
  };

  const handlePauseButtonMouseLeave = () => {
    if ((window as any).pauseButtonTimer) {
      clearTimeout((window as any).pauseButtonTimer);
      (window as any).pauseButtonTimer = null;
    }
    setIsLongPress(false);
  };

  const handleAddTime = () => {
    // Obtener el tiempo actual del localStorage
    const currentTimeLeft = localStorage.getItem('currentTimeLeft');
    const currentSeconds = currentTimeLeft ? parseInt(currentTimeLeft) : 0;
    
    if (!isTimerRunning) {
      // Si está detenido: ajustar a escala de 30s
      let newTime: number;
      if (currentSeconds === 0) {
        newTime = 30; // Si está en 0, pasar a 30s
      } else {
        newTime = Math.ceil(currentSeconds / 30) * 30; // Redondear hacia arriba al múltiplo de 30
      }
      localStorage.setItem('currentTimeLeft', newTime.toString());
      sendMessageToMeetingWindow('setTime', { seconds: newTime });
    } else {
      // Si está funcionando: sumar 30s inmediatamente
      const newTime = currentSeconds + 30;
      localStorage.setItem('currentTimeLeft', newTime.toString());
      sendMessageToMeetingWindow('addTime', { seconds: 30 });
    }
  };

  const handleSubtractTime = () => {
    // Obtener el tiempo actual del localStorage
    const currentTimeLeft = localStorage.getItem('currentTimeLeft');
    const currentSeconds = currentTimeLeft ? parseInt(currentTimeLeft) : 0;
    
    if (!isTimerRunning) {
      // Si está detenido: ajustar a escala de 30s
      const newTime = Math.max(0, Math.floor(currentSeconds / 30) * 30); // Redondear hacia abajo al múltiplo de 30
      localStorage.setItem('currentTimeLeft', newTime.toString());
      sendMessageToMeetingWindow('setTime', { seconds: newTime });
    } else {
      // Si está funcionando: restar 30s inmediatamente
      const newTime = Math.max(0, currentSeconds - 30);
      localStorage.setItem('currentTimeLeft', newTime.toString());
      sendMessageToMeetingWindow('subtractTime', { seconds: 30 });
    }
  };

  // Funciones para configurar atajos de teclado
  const handleConfigureShortcut = (action: string) => {
    setConfiguringShortcut(action);
    setShowShortcutConfig(true);
  };

  const handleShortcutKeyPress = (event: KeyboardEvent) => {
    if (configuringShortcut) {
      event.preventDefault();
      
      // Verificar si es una tecla de función válida (F1-F24) o tecla normal
      const validKeys = [
        'Space', 'KeyN', 'KeyP', 'Equal', 'Minus',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24'
      ];
      
      if (validKeys.includes(event.code)) {
        setKeyboardShortcuts(prev => ({
          ...prev,
          [configuringShortcut]: {
            ...prev[configuringShortcut as keyof typeof prev],
            key: event.code,
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey
          }
        }));
        setConfiguringShortcut(null);
        setShowShortcutConfig(false);
      }
    }
  };

  // Cargar directorios al iniciar el componente
  useEffect(() => {
    loadMeetings();
  }, []);

  // Sincronizar el cronómetro del panel de control con la ventana emergente
  useEffect(() => {
    if (meetingWindow && !meetingWindow.closed) {
      const interval = setInterval(() => {
        // Forzar re-render del componente para actualizar el cronómetro
        setTimerUpdate(prev => prev + 1);
      }, 100); // Actualizar cada 100ms para mejor sincronización

      return () => clearInterval(interval);
    }
  }, [meetingWindow, isTimerRunning]); // Agregar isTimerRunning como dependencia

  useEffect(() => {
    if (showShortcutConfig) {
      document.addEventListener('keydown', handleShortcutKeyPress);
      return () => {
        document.removeEventListener('keydown', handleShortcutKeyPress);
      };
    }
  }, [showShortcutConfig, configuringShortcut]);

  // Función para manejar atajos de teclado
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Verificar cada atajo
      Object.entries(keyboardShortcuts).forEach(([action, shortcut]) => {
        if (event.code === shortcut.key && 
            event.ctrlKey === shortcut.ctrl && 
            event.altKey === shortcut.alt && 
            event.shiftKey === shortcut.shift) {
          
          // Solo ejecutar si la ventana está activa O si el atajo es global
          const shouldExecute = (meetingWindow && !meetingWindow.closed) || shortcut.global;
          
          if (shouldExecute) {
            event.preventDefault();
            
            switch (action) {
              case 'pauseResume':
                handlePauseResume();
                break;
              case 'nextStage':
                handleNextStage();
                break;
              case 'previousStage':
                handlePreviousStage();
                break;
              case 'addTime':
                handleAddTime();
                break;
              case 'subtractTime':
                handleSubtractTime();
                break;
            }
          }
        }
      });
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [meetingWindow, keyboardShortcuts]);

    const handleStartMeeting = () => {
    console.log('handleStartMeeting llamado');
    console.log('meetingWindow:', meetingWindow);
    console.log('stages.length:', stages.length);
    
    // Si ya hay una ventana abierta, cerrarla y parar el directorio
    if (meetingWindow && !meetingWindow.closed) {
      console.log('Cerrando ventana existente');
      meetingWindow.close();
      setMeetingWindow(null);
      setIsTimerRunning(false);
      return;
    }

    // Si no hay etapas, mostrar error
    if (stages.length === 0) {
      alert('Agrega al menos una etapa antes de iniciar el directorio');
      return;
    }
    
    console.log('Abriendo nueva ventana');
    // Abrir ventana de reunión frameless de 500x400
    const newMeetingWindow = window.open(
      '/meeting',
      'meeting',
      'width=500,height=400,scrollbars=no,resizable=no,menubar=no,toolbar=no,location=no,status=no'
    );
    
         if (newMeetingWindow) {
       // Guardar las etapas en localStorage para que la nueva ventana las pueda leer
       localStorage.setItem('meetingStages', JSON.stringify(stages));
       // Inicializar el tiempo de la primera etapa como tiempo inicial
       const initialStageTime = stages[0].duration;
       localStorage.setItem('currentTimeLeft', initialStageTime.toString());
       localStorage.setItem('initialTime', initialStageTime.toString()); // Guardar tiempo inicial
       setMeetingWindow(newMeetingWindow);
       setIsTimerRunning(false); // No iniciar automáticamente
       setCurrentStageIndex(0);
       
       // Forzar una actualización inmediata del panel de control
       setTimeout(() => {
         setTimerUpdate(prev => prev + 1);
       }, 50); // Pequeño delay para asegurar que la ventana se haya cargado
       
       console.log('Ventana abierta exitosamente');
     }
   };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              v1.6.1 ({getBuildInfo()})
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Configuración de Directorios Empresariales Gemini
          </h1>
        </header>

                <div className="bg-white rounded-lg shadow-md p-6">
          {!selectedMeeting ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Directorios Empresariales
                </h2>
                <button
                  onClick={() => setShowNewMeetingModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-2"
                >
                  <span>➕</span>
                  <span>Nuevo Directorio</span>
                </button>
              </div>

              {meetings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    No hay directorios creados
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Crea tu primer directorio empresarial para comenzar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Selecciona un directorio:
                  </h3>
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      onClick={() => handleSelectMeeting(meeting)}
                      className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 cursor-pointer transition-colors border border-gray-200 hover:border-gray-300"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-medium text-gray-800">
                            {meeting.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {meeting.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            Creado: {new Date(meeting.created_at).toLocaleDateString('es-CL')}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(meeting.created_at).toLocaleTimeString('es-CL', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <button
                    onClick={() => {
                      setSelectedMeeting(null);
                      setStages([]);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center space-x-1"
                  >
                    <span>←</span>
                    <span>Volver a directorios</span>
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedMeeting.title}
                  </h2>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteMeeting}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-2"
                    title="Eliminar directorio"
                  >
                    <span>🗑️</span>
                    <span>Eliminar Directorio</span>
                  </button>
                  <button
                    onClick={() => setShowNewMeetingModal(true)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    🔄 Nuevo Directorio
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedMeeting && (
            <>
              {stages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">
                    Directorio Empresarial
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Este directorio no tiene etapas configuradas.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <button
                      onClick={handleStartMeeting}
                      className={`font-medium py-2 px-6 rounded-lg transition-colors ${
                        meetingWindow && !meetingWindow.closed 
                          ? 'bg-red-600 hover:bg-red-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {meetingWindow && !meetingWindow.closed ? '🛑 Parar Directorio' : '🚀 Iniciar Directorio'}
                    </button>
                  </div>

                                     <StagesList 
                     stages={stages}
                     onRemoveStage={handleRemoveStage}
                     onEditStage={handleEditStage}
                     onAddStage={handleQuickAddStage}
                     onConfigureColors={handleConfigureColors}
                     editingIndex={editingIndex !== null ? editingIndex : undefined}
                     onSaveEdit={handleSaveEdit}
                     onCancelEdit={handleCancelEdit}
                   />
                </div>
              )}
            </>
          )}
          
          {/* Panel de Control de Tiempo - mostrar cuando se inicie el directorio */}
          {meetingWindow && !meetingWindow.closed && (
            <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">⏱️</span>
                    Panel de Control del Directorio
                  </h3>
                  
                  {/* Vista del Cronómetro */}
                  <div className="bg-gray-900 rounded-lg p-4 mb-4 text-center">
                    <div className="text-4xl font-mono text-white font-bold">
                      {getCurrentTime()}
                    </div>
                    <div className="text-white text-sm mt-1">
                      {stages[currentStageIndex]?.title || 'Etapa'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Botón Anterior */}
                    <button
                      onClick={handlePreviousStage}
                      disabled={currentStageIndex === 0}
                      className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                                             title={`Anterior (${formatShortcut(keyboardShortcuts.previousStage)})`}
                    >
                      <span className="text-xl">⏮️</span>
                      <span className="text-sm">Anterior</span>
                    </button>

                    {/* Botón Pausar/Reanudar/Reiniciar */}
                    <button
                      onMouseDown={handlePauseButtonMouseDown}
                      onMouseUp={handlePauseButtonMouseUp}
                      onMouseLeave={handlePauseButtonMouseLeave}
                      onTouchStart={handlePauseButtonMouseDown}
                      onTouchEnd={handlePauseButtonMouseUp}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 relative"
                                             title={`Clic: Pausar/Reanudar | Mantener 1s: Resetear a 00:00 (${formatShortcut(keyboardShortcuts.pauseResume)})`}
                    >
                      <span className="text-xl">{isTimerRunning ? '⏸️' : '▶️'}</span>
                      <span className="text-sm">{isTimerRunning ? 'Pausar' : 'Reanudar'}</span>
                      {isLongPress && (
                                                 <div className="absolute inset-0 bg-blue-800 rounded-lg flex items-center justify-center">
                           <span className="text-white text-sm font-bold">🔄 Reseteando...</span>
                         </div>
                      )}
                    </button>

                    {/* Botón Siguiente */}
                    <button
                      onClick={handleNextStage}
                      disabled={currentStageIndex >= stages.length - 1}
                      className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                                             title={`Siguiente (${formatShortcut(keyboardShortcuts.nextStage)})`}
                    >
                      <span className="text-xl">⏭️</span>
                      <span className="text-sm">Siguiente</span>
                    </button>
                  </div>

                                     <div className="grid grid-cols-2 gap-3">
                     {/* Quitar Tiempo */}
                     <button
                       onClick={handleSubtractTime}
                       className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                                              title={`-30 segundos (${formatShortcut(keyboardShortcuts.subtractTime)})`}
                     >
                       <span className="text-xl">➖</span>
                       <span className="text-sm">-30 segundos</span>
                     </button>

                     {/* Agregar Tiempo */}
                     <button
                       onClick={handleAddTime}
                       className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                                              title={`+30 segundos (${formatShortcut(keyboardShortcuts.addTime)})`}
                     >
                       <span className="text-xl">➕</span>
                       <span className="text-sm">+30 segundos</span>
                     </button>
                   </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">Etapa actual: {currentStageIndex + 1} de {stages.length}</div>
                      <div className="text-xs mt-1">
                        Los controles afectan la ventana emergente en tiempo real
                      </div>
                                             <div className="text-xs mt-2 text-blue-600">
                         Atajos configurados: {formatShortcut(keyboardShortcuts.pauseResume)} (Pausar/Reanudar/Resetear), 
                         {formatShortcut(keyboardShortcuts.nextStage)} (Siguiente), 
                         {formatShortcut(keyboardShortcuts.previousStage)} (Anterior), 
                         {formatShortcut(keyboardShortcuts.addTime)}/{formatShortcut(keyboardShortcuts.subtractTime)} (Tiempo)
                       </div>
                       <div className="mt-3">
                         <button
                           onClick={() => setShowShortcutsModal(true)}
                           className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition-colors flex items-center space-x-2"
                         >
                           <span>⌨️</span>
                           <span>Configurar Atajos</span>
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              )}
        </div>

        {/* Modal para Nuevo Directorio */}
        {showNewMeetingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Crear Nuevo Directorio</h3>
                <button
                  onClick={() => {
                    setShowNewMeetingModal(false);
                    setNewMeetingName('');
                    setNewMeetingDate('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="meetingName" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Directorio *
                  </label>
                  <input
                    type="text"
                    id="meetingName"
                    value={newMeetingName}
                    onChange={(e) => setNewMeetingName(e.target.value)}
                    placeholder="Ej: Directorio Mensual Enero 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha (opcional)
                  </label>
                  <input
                    type="date"
                    id="meetingDate"
                    value={newMeetingDate}
                    onChange={(e) => setNewMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    ℹ️ Se creará automáticamente una etapa "Inicio" de 5 minutos que podrás editar después.
                  </p>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowNewMeetingModal(false);
                      setNewMeetingName('');
                      setNewMeetingDate('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateNewMeeting}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    Crear Directorio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {showImport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Importar CSV</h3>
                <button
                  onClick={() => setShowImport(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <CsvDropzone onImport={handleImportStages} />
            </div>
          </div>
        )}

        

        {/* Color Configuration Modal */}
        {configuringColors && (
          <StageColorConfig
            isOpen={true}
            onClose={() => setConfiguringColors(null)}
            stage={configuringColors.stage}
            onSave={handleSaveColors}
          />
        )}

                 {/* Shortcut Configuration Overlay */}
         {showShortcutConfig && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
             <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
               <h3 className="text-lg font-semibold mb-4">Configurar Atajo de Teclado</h3>
               <p className="text-gray-600 mb-4">
                 Presiona la combinación de teclas que deseas usar para esta acción
               </p>
               <p className="text-sm text-blue-600 mb-4">
                 Puedes usar Ctrl, Alt, Shift + teclas normales o teclas de función (F1-F24)
               </p>
               <div className="text-2xl font-mono text-blue-600 mb-4">
                 {configuringShortcut === 'pauseResume' && 'Pausar/Reanudar'}
                 {configuringShortcut === 'nextStage' && 'Siguiente Etapa'}
                 {configuringShortcut === 'previousStage' && 'Etapa Anterior'}
                 {configuringShortcut === 'addTime' && 'Agregar Tiempo'}
                 {configuringShortcut === 'subtractTime' && 'Quitar Tiempo'}
                 {configuringShortcut === 'restartStage' && 'Reiniciar Etapa'}
               </div>
               <button
                 onClick={() => {
                   setShowShortcutConfig(false);
                   setConfiguringShortcut(null);
                 }}
                 className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
               >
                 Cancelar
               </button>
             </div>
           </div>
         )}

                   {/* Shortcuts Configuration Modal */}
          {showShortcutsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Configuración de Atajos de Teclado</h3>
                  <button
                    onClick={() => setShowShortcutsModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Tabla de atajos */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Acción</th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Atajo Actual</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Global</th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Configurar</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                                                   <div className="font-medium text-blue-700">Pausar/Reanudar/Resetear</div>
                         <div className="text-sm text-gray-600">Clic: Pausar/Reanudar | Mantener 1s: Resetear a 00:00</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className="font-mono text-blue-600">{formatShortcut(keyboardShortcuts.pauseResume)}</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={keyboardShortcuts.pauseResume.global}
                            onChange={(e) => setKeyboardShortcuts(prev => ({
                              ...prev,
                              pauseResume: { ...prev.pauseResume, global: e.target.checked }
                            }))}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() => handleConfigureShortcut('pauseResume')}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors text-sm"
                          >
                            {configuringShortcut === 'pauseResume' ? 'Presiona...' : 'Cambiar'}
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="font-medium text-green-700">Siguiente Etapa</div>
                          <div className="text-sm text-gray-600">Avanzar a la siguiente etapa</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className="font-mono text-green-600">{formatShortcut(keyboardShortcuts.nextStage)}</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={keyboardShortcuts.nextStage.global}
                            onChange={(e) => setKeyboardShortcuts(prev => ({
                              ...prev,
                              nextStage: { ...prev.nextStage, global: e.target.checked }
                            }))}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() => handleConfigureShortcut('nextStage')}
                            className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors text-sm"
                          >
                            {configuringShortcut === 'nextStage' ? 'Presiona...' : 'Cambiar'}
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="font-medium text-yellow-700">Etapa Anterior</div>
                          <div className="text-sm text-gray-600">Volver a la etapa anterior</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className="font-mono text-yellow-600">{formatShortcut(keyboardShortcuts.previousStage)}</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={keyboardShortcuts.previousStage.global}
                            onChange={(e) => setKeyboardShortcuts(prev => ({
                              ...prev,
                              previousStage: { ...prev.previousStage, global: e.target.checked }
                            }))}
                            className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() => handleConfigureShortcut('previousStage')}
                            className="px-3 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded transition-colors text-sm"
                          >
                            {configuringShortcut === 'previousStage' ? 'Presiona...' : 'Cambiar'}
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="font-medium text-emerald-700">Agregar Tiempo</div>
                          <div className="text-sm text-gray-600">Sumar 30 segundos al cronómetro</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className="font-mono text-emerald-600">{formatShortcut(keyboardShortcuts.addTime)}</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={keyboardShortcuts.addTime.global}
                            onChange={(e) => setKeyboardShortcuts(prev => ({
                              ...prev,
                              addTime: { ...prev.addTime, global: e.target.checked }
                            }))}
                            className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() => handleConfigureShortcut('addTime')}
                            className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded transition-colors text-sm"
                          >
                            {configuringShortcut === 'addTime' ? 'Presiona...' : 'Cambiar'}
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="font-medium text-red-700">Quitar Tiempo</div>
                          <div className="text-sm text-gray-600">Restar 30 segundos al cronómetro</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <span className="font-mono text-red-600">{formatShortcut(keyboardShortcuts.subtractTime)}</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={keyboardShortcuts.subtractTime.global}
                            onChange={(e) => setKeyboardShortcuts(prev => ({
                              ...prev,
                              subtractTime: { ...prev.subtractTime, global: e.target.checked }
                            }))}
                            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <button
                            onClick={() => handleConfigureShortcut('subtractTime')}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors text-sm"
                          >
                            {configuringShortcut === 'subtractTime' ? 'Presiona...' : 'Cambiar'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Información sobre Atajos</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                                         <li>• <strong>Pausar/Reanudar/Resetear:</strong> Mismo atajo, resetear a 00:00 se activa manteniendo presionado 1 segundo</li>
                    <li>• <strong>Global:</strong> Los atajos marcados funcionan aunque la aplicación no esté en primer plano</li>
                    <li>• Puedes usar combinaciones con Ctrl, Alt y Shift</li>
                    <li>• Las teclas de función F1-F24 están disponibles</li>
                    <li>• Ejemplos: Ctrl+F1, Alt+Shift+N, F5, etc.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
