import { TimerState } from '../types/timer';

export class PersistencePlugin {
  private storageKey = 'timer-window-state';
  private settingsKey = 'timer-settings';
  private maxAge = 24 * 60 * 60 * 1000; // 24 horas

  // Guardar estado del cronómetro
  saveTimerState(state: Partial<TimerState>): void {
    try {
      const stateToSave: TimerState = {
        stages: state.stages || [],
        currentStageIndex: state.currentStageIndex || 0,
        timeLeft: state.timeLeft || 0,
        isRunning: state.isRunning || false,
        isPaused: state.isPaused || false,
        totalTime: state.totalTime || 0,
        startTime: state.startTime || null,
        pausedTime: state.pausedTime || 0,
        timestamp: Date.now()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(stateToSave));
      console.log('💾 Estado del cronómetro guardado');
    } catch (error) {
      console.error('❌ Error guardando estado del cronómetro:', error);
    }
  }

  // Cargar estado del cronómetro
  loadTimerState(): TimerState | null {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const state: TimerState = JSON.parse(saved);
        
        // Verificar si el estado no es muy antiguo
        if (Date.now() - state.timestamp < this.maxAge) {
          console.log('📂 Estado del cronómetro cargado');
          return state;
        } else {
          console.log('⏰ Estado del cronómetro expirado, limpiando');
          this.clearTimerState();
        }
      }
    } catch (error) {
      console.error('❌ Error cargando estado del cronómetro:', error);
    }
    return null;
  }

  // Limpiar estado del cronómetro
  clearTimerState(): void {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('🧹 Estado del cronómetro limpiado');
    } catch (error) {
      console.error('❌ Error limpiando estado del cronómetro:', error);
    }
  }

  // Guardar configuración
  saveSettings(settings: any): void {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
      console.log('💾 Configuración guardada');
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
    }
  }

  // Cargar configuración
  loadSettings(): any | null {
    try {
      const saved = localStorage.getItem(this.settingsKey);
      if (saved) {
        const settings = JSON.parse(saved);
        console.log('📂 Configuración cargada');
        return settings;
      }
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
    }
    return null;
  }

  // Guardar estado de plugins
  savePluginState(pluginState: any): void {
    try {
      localStorage.setItem('timer-plugin-state', JSON.stringify({
        ...pluginState,
        timestamp: Date.now()
      }));
      console.log('💾 Estado de plugins guardado');
    } catch (error) {
      console.error('❌ Error guardando estado de plugins:', error);
    }
  }

  // Cargar estado de plugins
  loadPluginState(): any | null {
    try {
      const saved = localStorage.getItem('timer-plugin-state');
      if (saved) {
        const state = JSON.parse(saved);
        
        // Verificar si el estado no es muy antiguo
        if (Date.now() - state.timestamp < this.maxAge) {
          console.log('📂 Estado de plugins cargado');
          return state;
        } else {
          console.log('⏰ Estado de plugins expirado, limpiando');
          this.clearPluginState();
        }
      }
    } catch (error) {
      console.error('❌ Error cargando estado de plugins:', error);
    }
    return null;
  }

  // Limpiar estado de plugins
  clearPluginState(): void {
    try {
      localStorage.removeItem('timer-plugin-state');
      console.log('🧹 Estado de plugins limpiado');
    } catch (error) {
      console.error('❌ Error limpiando estado de plugins:', error);
    }
  }

  // Exportar todos los datos
  exportData(): string {
    try {
      const data = {
        timerState: this.loadTimerState(),
        settings: this.loadSettings(),
        pluginState: this.loadPluginState(),
        exportDate: new Date().toISOString()
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('❌ Error exportando datos:', error);
      return '';
    }
  }

  // Importar datos
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.timerState) {
        this.saveTimerState(data.timerState);
      }
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      if (data.pluginState) {
        this.savePluginState(data.pluginState);
      }
      
      console.log('📥 Datos importados exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error importando datos:', error);
      return false;
    }
  }

  // Limpiar todos los datos
  clearAllData(): void {
    this.clearTimerState();
    this.clearPluginState();
    try {
      localStorage.removeItem(this.settingsKey);
      console.log('🧹 Todos los datos limpiados');
    } catch (error) {
      console.error('❌ Error limpiando todos los datos:', error);
    }
  }

  // Obtener información de almacenamiento
  getStorageInfo(): { used: number; available: number; total: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length;
        }
      }
      
      // Estimación aproximada (5MB es el límite típico)
      const total = 5 * 1024 * 1024; // 5MB
      const available = total - used;
      
      return { used, available, total };
    } catch (error) {
      console.error('❌ Error obteniendo información de almacenamiento:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }
}
