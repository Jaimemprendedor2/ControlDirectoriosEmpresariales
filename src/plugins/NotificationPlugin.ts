export class NotificationPlugin {
  private permission: NotificationPermission = 'default';
  private isEnabled: boolean = true;

  constructor() {
    this.checkPermission();
  }

  private async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      console.log('🔔 Permiso de notificación:', this.permission);
      return this.permission === 'granted';
    }
    return false;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  isNotificationEnabled(): boolean {
    return this.isEnabled && this.permission === 'granted';
  }

  showNotification(title: string, body: string, icon?: string, tag?: string) {
    if (!this.isNotificationEnabled()) {
      console.log('🔔 Notificaciones deshabilitadas o sin permiso');
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: tag || 'timer-notification',
        requireInteraction: false,
        silent: false
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('🔔 Notificación enviada:', title);
    } catch (error) {
      console.error('❌ Error mostrando notificación:', error);
    }
  }

  showStageCompleteNotification(stageName: string) {
    this.showNotification(
      '⏰ Etapa Completada',
      `La etapa "${stageName}" ha terminado`,
      '/timer-icon.png',
      'stage-complete'
    );
  }

  showTimerStartNotification() {
    this.showNotification(
      '▶️ Cronómetro Iniciado',
      'El cronómetro ha comenzado a funcionar',
      '/timer-icon.png',
      'timer-start'
    );
  }

  showTimerPauseNotification() {
    this.showNotification(
      '⏸️ Cronómetro Pausado',
      'El cronómetro ha sido pausado',
      '/timer-icon.png',
      'timer-pause'
    );
  }

  showTimerStopNotification() {
    this.showNotification(
      '⏹️ Cronómetro Detenido',
      'El cronómetro ha sido detenido',
      '/timer-icon.png',
      'timer-stop'
    );
  }

  showBackgroundModeNotification() {
    this.showNotification(
      '🔒 Modo Segundo Plano',
      'El cronómetro sigue funcionando en segundo plano',
      '/timer-icon.png',
      'background-mode'
    );
  }

  showWarningNotification(message: string) {
    this.showNotification(
      '⚠️ Advertencia',
      message,
      '/timer-icon.png',
      'warning'
    );
  }

  showErrorNotification(message: string) {
    this.showNotification(
      '❌ Error',
      message,
      '/timer-icon.png',
      'error'
    );
  }

  // Limpiar todas las notificaciones
  clearAllNotifications() {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Las notificaciones se cierran automáticamente, pero podemos forzar el cierre
      console.log('🧹 Limpiando notificaciones');
    }
  }
}
