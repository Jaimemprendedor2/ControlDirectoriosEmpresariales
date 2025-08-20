import React, { useState, useEffect } from 'react';
import { CsvDropzone } from '../components/CsvDropzone';
import { StagesList } from '../components/StagesList';
import { StageColorConfig } from '../components/StageColorConfig';

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

  const [configuringColors, setConfiguringColors] = useState<{index: number, stage: Stage} | null>(null);
  const [meetingWindow, setMeetingWindow] = useState<Window | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [keyboardShortcuts, setKeyboardShortcuts] = useState({
    pauseResume: 'Space',
    nextStage: 'KeyN',
    previousStage: 'KeyP',
    addTime: 'Equal',
    subtractTime: 'Minus'
  });
  const [showShortcutConfig, setShowShortcutConfig] = useState(false);
  const [configuringShortcut, setConfiguringShortcut] = useState<string | null>(null);
  const [timerUpdate, setTimerUpdate] = useState(0); // Para forzar re-render del cronómetro

  // Función para obtener información de compilación
  const getBuildInfo = () => {
    // Fecha fija de compilación (se actualiza cuando se hace un nuevo build)
    const buildDate = new Date('2024-12-19T16:30:00-03:00'); // Fecha de Santiago, Chile
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

  // Función para obtener el tiempo actual del cronómetro
  const getCurrentTime = () => {
    // Usar timerUpdate para forzar la actualización
    timerUpdate; // Esto hace que la función se ejecute cada vez que timerUpdate cambie
    
    const currentStage = stages[currentStageIndex];
    if (!currentStage) return "00:00";
    
    const timeLeft = localStorage.getItem('currentTimeLeft');
    const seconds = timeLeft ? parseInt(timeLeft) : currentStage.duration;
    
    // Asegurar que el tiempo no sea negativo
    const validSeconds = Math.max(0, seconds);
    
    const minutes = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
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

  const handleAddStage = () => {
    // Eliminar esta función ya que no se usará más
  };

  const handleQuickAddStage = () => {
    const newStage = {
      title: '',
      description: '',
      duration: 30,
      order_index: stages.length + 1,
      alertColor: '#FF0000',
      alertSeconds: 15
    };
    setStages([...stages, newStage]);
    setEditingIndex(stages.length);
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
    console.log('Editando etapa:', index, _stage);
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number, title: string, description: string, duration: number, alertColor: string, alertSeconds: number) => {
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
      sendMessageToMeetingWindow('previousStage', { stageIndex: newIndex });
    }
  };

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      const newIndex = currentStageIndex + 1;
      setCurrentStageIndex(newIndex);
      sendMessageToMeetingWindow('nextStage', { stageIndex: newIndex });
    }
  };

  const handlePauseResume = () => {
    setIsTimerRunning(!isTimerRunning);
    sendMessageToMeetingWindow('pauseResume');
  };

  const handleAddTime = () => {
    sendMessageToMeetingWindow('addTime', { seconds: 30 });
  };

  const handleSubtractTime = () => {
    sendMessageToMeetingWindow('subtractTime', { seconds: 30 });
  };

  // Funciones para configurar atajos de teclado
  const handleConfigureShortcut = (action: string) => {
    setConfiguringShortcut(action);
    setShowShortcutConfig(true);
  };

  const handleShortcutKeyPress = (event: KeyboardEvent) => {
    if (configuringShortcut) {
      event.preventDefault();
      setKeyboardShortcuts(prev => ({
        ...prev,
        [configuringShortcut]: event.code
      }));
      setConfiguringShortcut(null);
      setShowShortcutConfig(false);
    }
  };

  // Sincronizar el cronómetro del panel de control con la ventana emergente
  useEffect(() => {
    if (meetingWindow && !meetingWindow.closed) {
      const interval = setInterval(() => {
        // Forzar re-render del componente para actualizar el cronómetro
        setTimerUpdate(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [meetingWindow]);

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
      if (meetingWindow && !meetingWindow.closed) {
        switch (event.code) {
          case keyboardShortcuts.pauseResume:
            event.preventDefault();
            handlePauseResume();
            break;
          case keyboardShortcuts.nextStage:
            event.preventDefault();
            handleNextStage();
            break;
          case keyboardShortcuts.previousStage:
            event.preventDefault();
            handlePreviousStage();
            break;
          case keyboardShortcuts.addTime:
            event.preventDefault();
            handleAddTime();
            break;
          case keyboardShortcuts.subtractTime:
            event.preventDefault();
            handleSubtractTime();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [meetingWindow, keyboardShortcuts]);

  const handleStartMeeting = () => {
    if (stages.length === 0) {
      alert('Agrega al menos una etapa antes de iniciar el directorio');
      return;
    }
    
    // Abrir ventana de reunión frameless de 500x400
    const newMeetingWindow = window.open(
      '/meeting',
      'meeting',
      'width=500,height=400,scrollbars=no,resizable=no,menubar=no,toolbar=no,location=no,status=no'
    );
    
    if (newMeetingWindow) {
      // Guardar las etapas en localStorage para que la nueva ventana las pueda leer
      localStorage.setItem('meetingStages', JSON.stringify(stages));
      setMeetingWindow(newMeetingWindow);
      setIsTimerRunning(true);
      setCurrentStageIndex(0);
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Configurar Directorio
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImport(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-2"
              >
                <span>📁</span>
                <span>Importar CSV</span>
              </button>
                             <button
                 onClick={handleQuickAddStage}
                 className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-2"
               >
                 <span>➕</span>
                 <span>Crear Etapa</span>
               </button>
              <button
                onClick={() => {
                  setStages([]);
                  localStorage.removeItem('meetingStages');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
              >
                🔄 Nuevo Directorio
              </button>
            </div>
          </div>

          {stages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Directorio Empresarial
              </h2>
              <p className="text-gray-600 mb-6">
                Este directorio no tiene etapas configuradas. Agrega etapas para comenzar la configuración.
              </p>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                <h3 className="font-semibold text-blue-800 mb-2">Atajos de Teclado:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div><kbd className="bg-blue-200 px-2 py-1 rounded">Espacio</kbd> - Play/Pause</div>
                  <div><kbd className="bg-blue-200 px-2 py-1 rounded">N</kbd> - Siguiente etapa</div>
                  <div><kbd className="bg-blue-200 px-2 py-1 rounded">P</kbd> - Etapa anterior</div>
                  <div><kbd className="bg-blue-200 px-2 py-1 rounded">R</kbd> - Reiniciar etapa</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  Configurar Directorio
                </h2>
                <button
                  onClick={handleStartMeeting}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  🚀 Iniciar Directorio
                </button>
              </div>

              <StagesList 
                stages={stages}
                onRemoveStage={handleRemoveStage}
                onEditStage={handleEditStage}
                onAddStage={handleQuickAddStage}
                onConfigureColors={handleConfigureColors}
                editingIndex={editingIndex || undefined}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
              />

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
                      title={`Anterior (${keyboardShortcuts.previousStage.replace('KeyP', 'P')})`}
                    >
                      <span className="text-xl">⏮️</span>
                      <span className="text-sm">Anterior</span>
                    </button>

                    {/* Botón Pausar/Reanudar */}
                    <button
                      onClick={handlePauseResume}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                      title={`Pausar/Reanudar (${keyboardShortcuts.pauseResume.replace('Space', 'Espacio')})`}
                    >
                      <span className="text-xl">{isTimerRunning ? '⏸️' : '▶️'}</span>
                      <span className="text-sm">{isTimerRunning ? 'Pausar' : 'Reanudar'}</span>
                    </button>

                    {/* Botón Siguiente */}
                    <button
                      onClick={handleNextStage}
                      disabled={currentStageIndex >= stages.length - 1}
                      className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                      title={`Siguiente (${keyboardShortcuts.nextStage.replace('KeyN', 'N')})`}
                    >
                      <span className="text-xl">⏭️</span>
                      <span className="text-sm">Siguiente</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Agregar Tiempo */}
                    <button
                      onClick={handleAddTime}
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                      title={`+30 segundos (${keyboardShortcuts.addTime.replace('Equal', '+')})`}
                    >
                      <span className="text-xl">➕</span>
                      <span className="text-sm">+30 segundos</span>
                    </button>

                    {/* Quitar Tiempo */}
                    <button
                      onClick={handleSubtractTime}
                      className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                      title={`-30 segundos (${keyboardShortcuts.subtractTime.replace('Minus', '-')})`}
                    >
                      <span className="text-xl">➖</span>
                      <span className="text-sm">-30 segundos</span>
                    </button>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium">Etapa actual: {currentStageIndex + 1} de {stages.length}</div>
                      <div className="text-xs mt-1">
                        Los controles afectan la ventana emergente en tiempo real
                      </div>
                      <div className="text-xs mt-2 text-blue-600">
                        Atajos: {keyboardShortcuts.pauseResume.replace('Space', 'Espacio')} (Pausar/Reanudar), 
                        {keyboardShortcuts.nextStage.replace('KeyN', 'N')} (Siguiente), 
                        {keyboardShortcuts.previousStage.replace('KeyP', 'P')} (Anterior), 
                        {keyboardShortcuts.addTime.replace('Equal', '+')}/{keyboardShortcuts.subtractTime.replace('Minus', '-')} (Tiempo)
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-gray-700">Configurar Atajos:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleConfigureShortcut('pauseResume')}
                            className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs rounded transition-colors"
                          >
                            {configuringShortcut === 'pauseResume' ? 'Presiona una tecla...' : `Pausar/Reanudar: ${keyboardShortcuts.pauseResume.replace('Space', 'Espacio')}`}
                          </button>
                          <button
                            onClick={() => handleConfigureShortcut('nextStage')}
                            className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs rounded transition-colors"
                          >
                            {configuringShortcut === 'nextStage' ? 'Presiona una tecla...' : `Siguiente: ${keyboardShortcuts.nextStage.replace('KeyN', 'N')}`}
                          </button>
                          <button
                            onClick={() => handleConfigureShortcut('previousStage')}
                            className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs rounded transition-colors"
                          >
                            {configuringShortcut === 'previousStage' ? 'Presiona una tecla...' : `Anterior: ${keyboardShortcuts.previousStage.replace('KeyP', 'P')}`}
                          </button>
                          <button
                            onClick={() => handleConfigureShortcut('addTime')}
                            className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs rounded transition-colors"
                          >
                            {configuringShortcut === 'addTime' ? 'Presiona una tecla...' : `+Tiempo: ${keyboardShortcuts.addTime.replace('Equal', '+')}`}
                          </button>
                          <button
                            onClick={() => handleConfigureShortcut('subtractTime')}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
                          >
                            {configuringShortcut === 'subtractTime' ? 'Presiona una tecla...' : `-Tiempo: ${keyboardShortcuts.subtractTime.replace('Minus', '-')}`}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
                Presiona la tecla que deseas usar para esta acción
              </p>
              <div className="text-2xl font-mono text-blue-600 mb-4">
                {configuringShortcut === 'pauseResume' && 'Pausar/Reanudar'}
                {configuringShortcut === 'nextStage' && 'Siguiente Etapa'}
                {configuringShortcut === 'previousStage' && 'Etapa Anterior'}
                {configuringShortcut === 'addTime' && 'Agregar Tiempo'}
                {configuringShortcut === 'subtractTime' && 'Quitar Tiempo'}
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
      </div>
    </div>
  );
};
