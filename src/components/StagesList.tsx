import React from 'react';
import { InlineStageEditor } from './InlineStageEditor';

interface Stage {
  id?: string;
  title: string;
  duration: number;
  order_index?: number;
  is_completed?: boolean;
}

interface StagesListProps {
  stages: Stage[];
  onRemoveStage?: (index: number) => void;
  onEditStage?: (index: number, stage: Stage) => void;
  onAddStage?: () => void;
  onConfigureColors?: (index: number, stage: Stage) => void;
  editingIndex?: number;
  onSaveEdit?: (index: number, title: string, duration: number) => void;
  onCancelEdit?: () => void;
}

export const StagesList: React.FC<StagesListProps> = ({ 
  stages, 
  onRemoveStage, 
  onEditStage,
  onAddStage,
  onConfigureColors,
  editingIndex,
  onSaveEdit,
  onCancelEdit
}) => {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (stages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📋</div>
                 <p>No hay etapas configuradas</p>
         <p className="text-sm">Agrega etapas para comenzar tu directorio</p>
      </div>
    );
  }

  const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
                 <h3 className="text-lg font-semibold text-gray-800">
           Etapas del Directorio ({stages.length})
         </h3>
        <div className="text-sm text-gray-600">
          Total: {formatDuration(totalDuration)}
        </div>
      </div>

             <div className="space-y-2">
         {stages.map((stage, index) => (
           <div key={stage.id || index}>
             {editingIndex === index ? (
               <InlineStageEditor
                 stage={stage}
                 onSave={(title, duration) => onSaveEdit?.(index, title, duration)}
                 onCancel={onCancelEdit || (() => {})}
               />
             ) : (
               <div
                 className={`
                   flex items-center justify-between p-4 rounded-lg border transition-colors
                   ${stage.is_completed 
                     ? 'bg-green-50 border-green-200' 
                     : 'bg-white border-gray-200 hover:border-gray-300'
                   }
                 `}
               >
                 <div className="flex items-center space-x-4">
                   <div className={`
                     w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                     ${stage.is_completed 
                       ? 'bg-green-500 text-white' 
                       : 'bg-gray-200 text-gray-700'
                     }
                   `}>
                     {index + 1}
                   </div>
                   
                   <div className="flex-1">
                     <h4 className={`
                       font-medium
                       ${stage.is_completed ? 'text-green-800 line-through' : 'text-gray-800'}
                     `}>
                       {stage.title}
                     </h4>
                     <p className="text-sm text-gray-500">
                       {formatDuration(stage.duration)}
                     </p>
                   </div>
                 </div>

                 <div className="flex items-center space-x-2">
                   {onConfigureColors && (
                     <button
                       onClick={() => onConfigureColors(index, stage)}
                       className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                       title="Configurar colores"
                     >
                       🎨
                     </button>
                   )}
                   
                                       {onEditStage && (
                      <button
                        onClick={() => onEditStage(index, stage)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Editar etapa"
                      >
                        ✏️
                      </button>
                    )}
                   
                   {onRemoveStage && (
                     <button
                       onClick={() => onRemoveStage(index)}
                       className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                       title="Eliminar etapa"
                     >
                       🗑️
                     </button>
                   )}
                 </div>
               </div>
             )}
           </div>
         ))}
        
        {/* Botón para agregar nueva etapa */}
        {onAddStage && (
          <button
            onClick={onAddStage}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-medium text-gray-700">Agregar Nueva Etapa</div>
          </button>
        )}
      </div>

      {stages.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-blue-800">
             Resumen del Directorio
           </span>
            <span className="text-sm text-blue-600">
              {formatDuration(totalDuration)}
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            {stages.length} etapa{stages.length !== 1 ? 's' : ''} • 
            {Math.floor(totalDuration / 60)} minuto{Math.floor(totalDuration / 60) !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};
