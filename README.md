# Configuración de Directorios Empresariales Gemini

**Versión:** 1.1.2

Una plataforma moderna y eficiente para configurar y gestionar directorios empresariales con tecnología Gemini. Esta aplicación te permite crear, organizar y administrar estructuras de directorios empresariales de manera intuitiva y profesional.

## 🚀 Características Principales

- **📁 Importación CSV**: Carga estructuras de directorios desde archivos CSV
- **➕ Creación Manual**: Agrega etapas de configuración manualmente
- **⏱️ Cronómetro Inteligente**: Control de tiempo para cada etapa del directorio
- **🎯 Gestión de Etapas**: Organiza y gestiona las etapas del directorio
- **⌨️ Atajos de Teclado**: Navegación rápida y eficiente
- **📊 Progreso Visual**: Seguimiento en tiempo real del progreso
- **🔄 Sincronización**: Funciona en múltiples ventanas simultáneamente

## 📋 Formato CSV

El archivo CSV debe tener el siguiente formato:

```csv
titulo,duracion
Configuración Inicial,5:00
Análisis de Estructura,15:00
Implementación,30:00
Validación Final,10:00
```

### Formatos de Duración Soportados:
- `mm:ss` (ej: `5:00` = 5 minutos)
- `hh:mm:ss` (ej: `1:30:00` = 1 hora 30 minutos)
- Segundos (ej: `300` = 5 minutos)
- Minutos (ej: `5` = 5 minutos)

## 🛠️ Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Jaimemprendedor2/ControlDirectoriosEmpresariales.git
   cd ControlDirectoriosEmpresariales
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   cp env.example .env
   # Editar .env con tus credenciales de Supabase
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

## ⌨️ Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Play/Pause del cronómetro |
| `N` | Siguiente etapa del directorio |
| `P` | Etapa anterior del directorio |
| `R` | Reiniciar etapa actual |
| `ESC` | Cerrar cronómetro |

## 🏗️ Arquitectura Técnica

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **TailwindCSS** para estilos
- **React Router** para navegación
- **Zustand** para gestión de estado

### Backend
- **Supabase** como BaaS
- **PostgreSQL** como base de datos
- **Row Level Security (RLS)** para seguridad

### Librerías Principales
- **PapaParse**: Parsing de archivos CSV
- **date-fns**: Manipulación de fechas
- **BroadcastChannel**: Sincronización entre ventanas

## 📊 Estructura de la Base de Datos

### Tablas Principales:
- `meetings` → `directories`: Directorios empresariales
- `meeting_stages` → `directory_stages`: Etapas del directorio
- `meeting_sessions` → `directory_sessions`: Sesiones de configuración
- `stage_progress` → `stage_progress`: Progreso de etapas

## 🔄 Flujo de Trabajo

1. **Configuración Inicial**: Importar CSV o crear etapas manualmente
2. **Revisión**: Verificar la estructura del directorio
3. **Ejecución**: Iniciar el cronómetro para cada etapa
4. **Seguimiento**: Monitorear el progreso en tiempo real
5. **Finalización**: Completar la configuración del directorio

## 🚀 Roadmap

### Versión 1.2.0 (Próxima)
- [ ] Autenticación de usuarios
- [ ] Plantillas de directorios predefinidas
- [ ] Exportación de reportes
- [ ] Integración con APIs empresariales

### Versión 1.3.0
- [ ] Dashboard de analytics
- [ ] Notificaciones en tiempo real
- [ ] Modo presentación mejorado
- [ ] Integración con calendarios

### Versión 2.0.0
- [ ] IA asistente con Gemini
- [ ] Automatización de procesos
- [ ] Colaboración en tiempo real
- [ ] Múltiples directorios simultáneos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas:
- 📧 Email: soporte@directoriosempresariales.com
- 📱 WhatsApp: +1 (555) 123-4567
- 🌐 Web: https://directoriosempresariales.com

---

**Desarrollado con ❤️ para optimizar la configuración de directorios empresariales**


