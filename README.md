# Control de Reuniones

Una aplicación web moderna para gestionar el tiempo de reuniones con cronómetro automático, modo presentación y sincronización en tiempo real.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Importación CSV**: Carga agendas desde archivos CSV con validación automática
- **Cronómetro Inteligente**: Control automático del tiempo por etapa con auto-avance
- **Modo Presentación**: Vista popup minimal para proyectar en pantallas
- **Sincronización**: Tiempo real entre ventana principal y presentación via BroadcastChannel
- **Persistencia**: Estado guardado automáticamente en localStorage
- **Atajos de Teclado**: Control rápido con teclas (Espacio, N, P, R)

### 🎯 Gestión de Etapas
- ✅ Crear, editar y eliminar etapas manualmente
- ✅ Navegación entre etapas (anterior/siguiente)
- ✅ Estados visuales: Completada/En curso/Pendiente
- ✅ Barra de progreso con cambio de color cuando queda poco tiempo
- ✅ Exportación a CSV de la agenda actual

### 🔊 Notificaciones
- ✅ Sonido automático al completar etapas (Web Audio API)
- ✅ Vibración en dispositivos compatibles
- ✅ Notificaciones visuales y sonoras especiales al finalizar

### 🎨 Interfaz
- ✅ Diseño responsive con TailwindCSS
- ✅ Tema claro y profesional
- ✅ Accesibilidad con roles ARIA y focus visible
- ✅ Estados vacíos y manejo de errores

## 📋 Formato CSV

El archivo CSV debe tener la siguiente estructura:

```csv
titulo,duracion
Introducción,5:00
Revisión de métricas,15:00
Discusión,30:00
Cierre,10:00
```

### Formatos de duración soportados:
- **mm:ss** (ej. `5:00`, `12:30`)
- **minutos enteros** (ej. `5`, `15`)

## 🚀 Instalación y Uso

### Requisitos
- Node.js 16+ y npm

### Instalación
```bash
# Clonar el repositorio
git clone <url-del-repo>
cd control-reunion

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build
npm run preview
```

### Uso Rápido
1. **Importar agenda**: Arrastra un CSV o usa el botón para cargar
2. **Iniciar reunión**: Presiona Play o Espacio para comenzar
3. **Modo presentación**: Haz clic en "Modo Presentación" para abrir popup
4. **Controlar tiempo**: Usa los botones o atajos de teclado

## ⌨️ Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Play/Pause |
| `N` | Siguiente etapa |
| `P` | Etapa anterior |
| `R` | Reiniciar etapa actual |

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Estilos**: TailwindCSS
- **Estado**: Zustand
- **Routing**: React Router Dom
- **CSV**: PapaParse
- **Tiempo**: date-fns

### Estructura del Proyecto
```
src/
├── components/          # Componentes reutilizables
│   ├── CsvDropzone.tsx     # Carga de archivos CSV
│   ├── AgendaTable.tsx     # Lista de etapas
│   ├── TimerControls.tsx   # Controles del cronómetro
│   ├── ProgressBar.tsx     # Barra de progreso
│   ├── ExportButton.tsx    # Exportar CSV
│   └── PresentationButton.tsx # Botón modo presentación
├── pages/               # Páginas principales
│   ├── Home.tsx            # Vista principal
│   └── Presenter.tsx       # Vista de presentación
├── store/               # Estado global
│   └── agendaStore.ts      # Store Zustand
├── utils/               # Utilidades
│   ├── time.ts             # Funciones de tiempo
│   ├── csv.ts              # Parseo y export CSV
│   └── audio.ts            # Sonidos y vibración
├── types/               # Tipos TypeScript
│   └── index.ts
└── App.tsx             # Componente raíz
```

### Sincronización de Datos
- **BroadcastChannel**: Comunicación principal entre ventanas
- **localStorage**: Fallback y persistencia
- **Versionado**: Esquema v1 para compatibilidad futura

## 🔧 Configuración

### Variables de Entorno
No se requieren variables de entorno especiales.

### Personalización
- **Sonidos**: Modifica `src/utils/audio.ts` para cambiar frecuencias
- **Colores**: Edita `tailwind.config.js` para personalizar tema
- **Persistencia**: Cambia `STORAGE_KEY` en `agendaStore.ts`

## 🐛 Troubleshooting

### Problemas Comunes

**❌ El popup no se abre**
- Verificar que los popups estén permitidos en el navegador
- Usar el enlace manual a `/presenter`

**❌ No se sincroniza el modo presentación**
- Verificar que BroadcastChannel esté soportado
- La app usa localStorage como fallback automático

**❌ El CSV no se importa**
- Verificar formato: encabezados `titulo,duracion`
- Revisar formato de duración (mm:ss o minutos)
- Descargar y revisar el reporte de errores

**❌ El sonido no funciona**
- Verificar permisos de audio en el navegador
- Interactuar con la página antes (limitación de autoplay)

## 📱 Compatibilidad

### Navegadores Soportados
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13.1+
- ✅ Edge 80+

### Características por Dispositivo
- **Desktop**: Funcionalidad completa
- **Mobile**: Funcional, vibración en dispositivos compatibles
- **Tablet**: Interfaz responsive adaptada

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autor

Desarrollado con ❤️ para mejorar la gestión de reuniones profesionales.

---

### 🎯 Próximas Características (Roadmap)

- [ ] Drag & drop para reordenar etapas
- [ ] Temas oscuro/claro
- [ ] Sonidos configurables
- [ ] Integración con calendarios
- [ ] Exportar reportes de tiempo
- [ ] Plantillas de reuniones predefinidas


