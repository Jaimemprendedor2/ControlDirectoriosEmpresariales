# 🧪 QA de Sincronización - Directorios Empresariales

## 📋 Descripción
Sistema completo de QA para verificar la sincronización entre el directorio principal y el popup de MeetingView, incluyendo controles de timer, hidratación de estado, manejo de popups bloqueados y aislamiento por directorio.

## 🚀 Inicio Rápido

### 1. Preparar Entorno
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# En otra terminal, ejecutar QA
npm run qa-sync
```

### 2. Comandos Disponibles
```bash
# Abrir script de QA completo
npm run qa

# Ejecutar QA con instrucciones
npm run qa-sync

# Herramientas de automatización
npm run qa-auto

# Ayuda de comandos
npm run qa-help
```

## 📁 Archivos del Sistema QA

### 📄 `scripts/qa-sync.md`
Script principal de QA con:
- ✅ 5 fases de pruebas detalladas
- ✅ Checklist completo con verificaciones
- ✅ Descripciones de capturas esperadas
- ✅ Criterios de éxito y métricas
- ✅ Solución de problemas conocidos

### 🤖 `scripts/qa-automation.js`
Herramientas de automatización:
- 📊 Generación de datos de prueba
- 🔧 Comandos de verificación para consola
- 🎯 Escenarios de prueba automatizados
- 📋 Plantilla de reporte de QA

## 🎯 Fases de QA

### ✅ **FASE 1: Sincronización Básica**
- Verificar controles play/pause/next/prev/reset/add/sub 30s
- Probar sincronización bidireccional
- Validar tiempo exacto entre directorio y popup

### ✅ **FASE 2: Hidratación de Estado**
- Cerrar y reabrir popup
- Verificar SYNC_REQUEST/RESPONSE
- Validar sincronización automática

### ✅ **FASE 3: Manejo de Popups Bloqueados**
- Simular bloqueo de popup
- Verificar banner de error
- Probar funcionalidad de reintento

### ✅ **FASE 4: Prueba de Drift**
- Simular pérdida de foco (60 segundos)
- Verificar cero drift (≤ 1 segundo)
- Validar sincronización después de reenfoque

### ✅ **FASE 5: Aislamiento por Directorio**
- Cambiar entre directorios
- Verificar actualización completa del popup
- Validar aislamiento por directoryId

## 🔧 Herramientas de Verificación

### Comandos de Consola
```javascript
// Verificar estado del directorio
console.log("Directorio ID:", localStorage.getItem("currentDirectoryId"));
console.log("Tiempo actual:", localStorage.getItem("currentTimeLeft"));
console.log("Etapa actual:", localStorage.getItem("currentStageIndex"));

// Verificar sincronización
console.log("Sync Service:", window.syncService?.isConnected());
console.log("Estado conexión:", window.syncService?.getState());
```

### Filtros de Consola
Buscar en DevTools Console:
- `SYNC_REQUEST`
- `SYNC_RESPONSE`
- `syncAll`
- `setTime`
- `setStage`

## 📊 Criterios de Éxito

### Sincronización Perfecta
- ✅ Diferencia de tiempo ≤ 1 segundo
- ✅ Cambios de estado instantáneos
- ✅ Controles bidireccionales funcionales

### Hidratación Robusta
- ✅ Sincronización automática al reabrir
- ✅ Sin intervención manual requerida
- ✅ Estado consistente mantenido

### Manejo de Errores
- ✅ Banner informativo para popups bloqueados
- ✅ Reintento funcional
- ✅ Sin crashes o errores críticos

### Aislamiento Correcto
- ✅ Actualización completa al cambiar directorio
- ✅ Sin interferencia entre directorios
- ✅ directoryId respetado en mensajes

## 🐛 Solución de Problemas

### Popup No Se Sincroniza
1. Verificar `syncService` inicializado
2. Revisar errores en consola
3. Forzar sincronización manual

### Drift Excesivo
1. Verificar `requestAnimationFrame`
2. Revisar intervalos de sincronización (100ms)
3. Comprobar procesos bloqueando hilo principal

### Popup Bloqueado Persistente
1. Verificar configuración de popups
2. Limpiar localStorage: `localStorage.clear()`
3. Recargar página completamente

## 📈 Métricas de Rendimiento

### Tiempos Esperados
- **Sincronización inicial**: < 500ms
- **Cambio de estado**: < 100ms
- **Hidratación**: < 1 segundo
- **Cambio de directorio**: < 2 segundos

### Uso de Recursos
- **CPU**: < 5% durante sincronización normal
- **Memoria**: < 50MB adicional por popup
- **Red**: Solo sincronización local

## 📝 Reporte de QA

### Plantilla de Reporte
```
FECHA: ___________
TESTER: ___________
NAVEGADOR: ___________
VERSIÓN: ___________

RESULTADOS POR FASE:
- FASE 1 - Sincronización Básica: [ ] APROBADO [ ] FALLIDO
- FASE 2 - Hidratación: [ ] APROBADO [ ] FALLIDO
- FASE 3 - Popups Bloqueados: [ ] APROBADO [ ] FALLIDO
- FASE 4 - Prueba de Drift: [ ] APROBADO [ ] FALLIDO
- FASE 5 - Aislamiento: [ ] APROBADO [ ] FALLIDO

ESTADO FINAL: [ ] ✅ APROBADO [ ] ❌ REQUIERE CORRECCIONES
```

## 🎯 Flujo de Trabajo Recomendado

1. **Preparación**
   ```bash
   npm run dev
   npm run qa-auto
   ```

2. **Ejecución**
   ```bash
   npm run qa-sync
   # Seguir pasos en scripts/qa-sync.md
   ```

3. **Verificación**
   - Usar comandos de consola
   - Verificar métricas de rendimiento
   - Completar checklist

4. **Reporte**
   - Usar plantilla de reporte
   - Documentar problemas encontrados
   - Aplicar soluciones necesarias

## 📚 Recursos Adicionales

- **Script principal**: `scripts/qa-sync.md`
- **Automatización**: `scripts/qa-automation.js`
- **Código fuente**: `src/pages/Directorio.tsx`
- **Servicio de sync**: `src/services/syncChannel.ts`

---

**🎯 Objetivo**: Garantizar sincronización perfecta entre directorio y popup con cero drift y manejo robusto de errores.
