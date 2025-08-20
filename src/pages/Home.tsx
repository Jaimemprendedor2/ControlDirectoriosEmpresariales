import React, { useState } from 'react';
import { CsvDropzone } from '../components/CsvDropzone';
import { AddStageForm } from '../components/AddStageForm';
import { StagesList } from '../components/StagesList';
import { StageColorConfig } from '../components/StageColorConfig';
import { TimerControls } from '../components/TimerControls';

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
}

export const Home: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [configuringColors, setConfiguringColors] = useState<{index: number, stage: Stage} | null>(null);
  const [meetingWindow, setMeetingWindow] = useState<Window | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Función para obtener fecha y hora de Chile
  const getChileDateTime = () => {
    const now = new Date();
    const chileTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Santiago"}));
    const date = chileTime.toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const time = chileTime.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    return `${date} ${time}`;
  };

  const handleImportStages = (importedStages: Array<{ title: string; duration: number }>) => {
    const newStages = importedStages.map((stage, index) => ({
      ...stage,
      order_index: index + 1
    }));
    setStages(newStages);
    setShowImport(false);
  };

  const handleAddStage = (stage: { title: string; duration: number }) => {
    const newStage = {
      ...stage,
      order_index: stages.length + 1
    };
    setStages([...stages, newStage]);
    setShowAddForm(false);
  };

  const handleQuickAddStage = () => {
    const newStage = {
      title: '',
      duration: 30,
      order_index: stages.length + 1
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

  const handleEditStage = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (index: number, title: string, duration: number) => {
    const newStages = [...stages];
    newStages[index] = {
      ...newStages[index],
      title,
      duration
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

  const handleRestartStage = () => {
    sendMessageToMeetingWindow('restartStage');
  };

  const handleAddTime = () => {
    sendMessageToMeetingWindow('addTime', { seconds: 30 });
  };

  const handleSubtractTime = () => {
    sendMessageToMeetingWindow('subtractTime', { seconds: 30 });
  };

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
               v1.1.4 ({getChileDateTime()})
             </span>
           </div>
           <h1 className="text-3xl font-bold text-gray-800 mb-2">
             Configuración de Directorios Empresariales Gemini
           </h1>
           <p className="text-gray-600">
             Configura y gestiona directorios empresariales de forma eficiente
           </p>
         </header>

        <div className="bg-white rounded-lg shadow-md p-6">
          {stages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏱️</div>
                             <h2 className="text-xl font-semibold text-gray-700 mb-4">
                 Bienvenido a la Configuración de Directorios Empresariales Gemini
               </h2>
               <p className="text-gray-600 mb-6">
                 Importa un archivo CSV con tu estructura de directorio o crea etapas manualmente para comenzar.
               </p>
              
              <div className="space-y-4 max-w-md mx-auto">
                <button 
                  onClick={() => setShowImport(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="text-xl">📁</span>
                  <span>Importar CSV</span>
                </button>
                <div className="text-gray-500 text-center">o</div>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span className="text-xl">➕</span>
                                     <span>Crear Etapa del Directorio</span>
                </button>
              </div>

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

               {/* Controles del cronómetro - solo mostrar si hay una ventana de reunión abierta */}
               {meetingWindow && !meetingWindow.closed && (
                 <TimerControls
                   currentStageIndex={currentStageIndex}
                   totalStages={stages.length}
                   isRunning={isTimerRunning}
                   onPreviousStage={handlePreviousStage}
                   onNextStage={handleNextStage}
                   onPauseResume={handlePauseResume}
                   onRestartStage={handleRestartStage}
                   onAddTime={handleAddTime}
                   onSubtractTime={handleSubtractTime}
                 />
               )}

              <div className="border-t pt-6">
                                 <h3 className="text-lg font-semibold text-gray-800 mb-4">
                   Agregar Más Etapas del Directorio
                 </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowImport(true)}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="text-2xl mb-2">📁</div>
                    <div className="font-medium text-gray-700">Importar CSV</div>
                    <div className="text-sm text-gray-500">Cargar desde archivo</div>
                  </button>
                  
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-400 hover:bg-green-50 transition-colors"
                  >
                    <div className="text-2xl mb-2">➕</div>
                                         <div className="font-medium text-gray-700">Agregar Manual</div>
                     <div className="text-sm text-gray-500">Crear etapa del directorio</div>
                  </button>
                </div>
              </div>
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

        {/* Add Stage Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Agregar Etapa</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <AddStageForm onAddStage={handleAddStage} />
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
       </div>


     </div>
   );
 };
