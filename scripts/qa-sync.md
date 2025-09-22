# Script de QA - Sincronización de Directorios Empresariales

## 📋 Descripción General
Este script verifica la sincronización entre el directorio principal y el popup de MeetingView, incluyendo controles de timer, hidratación de estado, manejo de popups bloqueados y aislamiento por directorio.

## 🎯 Objetivos de QA
- ✅ Verificar sincronización de controles (play/pause/next/prev/reset/add/sub 30s)
- ✅ Validar hidratación por SYNC_REQUEST/RESPONSE
- ✅ Probar manejo de popups bloqueados
- ✅ Verificar cero drift en pérdida de foco
- ✅ Confirmar aislamiento por directoryId

---

## 🚀 Preparación del Entorno

### Prerrequisitos
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir navegador en http://localhost:5173
```

### Configuración de Datos de Prueba
```bash
# Crear directorio de prueba con etapas
# - Directorio: "QA Test Meeting"
# - Etapas: 
#   * "Presentación" (5 minutos)
#   * "Discusión" (10 minutos) 
#   * "Conclusiones" (3 minutos)
```

---

## 📝 Checklist de QA

### ✅ **FASE 1: Sincronización Básica de Controles**

#### 1.1 Abrir Directorio e Iniciar
- [ ] Navegar a `/directorio`
- [ ] Seleccionar directorio "QA Test Meeting"
- [ ] Verificar que se muestran las 3 etapas configuradas
- [ ] **Captura esperada**: Lista de etapas con duraciones correctas

#### 1.2 Abrir Popup y Verificar Sincronización
- [ ] Hacer clic en "Iniciar Directorio"
- [ ] Verificar que se abre popup automáticamente
- [ ] **Captura esperada**: Popup abierto con timer en 5:00 (primera etapa)

#### 1.3 Probar Controles Sincronizados
- [ ] **PLAY/PAUSE**: 
  - [ ] Pausar en directorio → verificar pausa en popup
  - [ ] Reanudar en popup → verificar reanudación en directorio
- [ ] **NEXT/PREV**:
  - [ ] Avanzar etapa en directorio → verificar cambio en popup
  - [ ] Retroceder etapa en popup → verificar cambio en directorio
- [ ] **RESET**:
  - [ ] Resetear en directorio → verificar reset en popup
- [ ] **ADD/SUB 30s**:
  - [ ] Agregar 30s en directorio → verificar +30s en popup
  - [ ] Restar 30s en popup → verificar -30s en directorio

**Captura esperada**: Ambos timers muestran exactamente el mismo tiempo y estado

---

### ✅ **FASE 2: Hidratación de Estado**

#### 2.1 Cerrar y Reabrir Popup
- [ ] Cerrar popup completamente
- [ ] Reabrir popup desde directorio
- [ ] **Verificar hidratación automática**:
  - [ ] Timer muestra tiempo correcto
  - [ ] Etapa actual es la correcta
  - [ ] Estado de play/pause es correcto

#### 2.2 Verificar SYNC_REQUEST/RESPONSE
- [ ] Abrir DevTools → Console
- [ ] Buscar mensajes: `SYNC_REQUEST` y `SYNC_RESPONSE`
- [ ] **Captura esperada**: Logs de sincronización en consola

**Captura esperada**: Popup se sincroniza automáticamente sin intervención manual

---

### ✅ **FASE 3: Manejo de Popups Bloqueados**

#### 3.1 Simular Bloqueo de Popup
- [ ] Configurar navegador para bloquear popups
- [ ] Intentar abrir popup desde directorio
- [ ] **Verificar banner de error**:
  - [ ] Aparece mensaje "Popup bloqueado por el navegador"
  - [ ] Botón "Reintentar" es visible y funcional
  - [ ] Botón está enfocado para accesibilidad

#### 3.2 Probar Reintento
- [ ] Permitir popups en navegador
- [ ] Hacer clic en "Reintentar"
- [ ] **Verificar**:
  - [ ] Banner desaparece
  - [ ] Popup se abre correctamente
  - [ ] Sincronización funciona normalmente

**Captura esperada**: Banner de error con botón de reintento funcional

---

### ✅ **FASE 4: Prueba de Drift (Pérdida de Foco)**

#### 4.1 Configurar Prueba de Drift
- [ ] Iniciar timer en directorio
- [ ] Abrir popup sincronizado
- [ ] Anotar tiempo inicial en ambos

#### 4.2 Simular Pérdida de Foco
- [ ] Cambiar a otra aplicación (60 segundos)
- [ ] Volver a la aplicación
- [ ] **Verificar cero drift**:
  - [ ] Tiempo en directorio = tiempo en popup
  - [ ] Diferencia máxima: ±1 segundo
  - [ ] No hay desincronización visible

**Captura esperada**: Ambos timers mantienen sincronización perfecta después de 60s

---

### ✅ **FASE 5: Aislamiento por Directorio**

#### 5.1 Preparar Múltiples Directorios
- [ ] Crear segundo directorio: "QA Test Meeting 2"
- [ ] Configurar etapas diferentes (duraciones distintas)
- [ ] Tener ambos directorios listos

#### 5.2 Probar Aislamiento
- [ ] Iniciar directorio 1 con popup abierto
- [ ] Cambiar a directorio 2
- [ ] **Verificar aislamiento**:
  - [ ] Popup se actualiza con etapas del directorio 2
  - [ ] Timer se resetea al tiempo del directorio 2
  - [ ] No hay interferencia entre directorios

#### 5.3 Verificar directoryId
- [ ] Abrir DevTools → Console
- [ ] Buscar mensajes con `directoryId` diferentes
- [ ] **Verificar**: Mensajes de directorio 1 no afectan directorio 2

**Captura esperada**: Popup cambia completamente al cambiar de directorio

---

## 🔧 Comandos de Verificación

### Verificar Sincronización en Consola
```javascript
// En DevTools Console del directorio
console.log('Directorio ID:', localStorage.getItem('currentDirectoryId'));
console.log('Tiempo actual:', localStorage.getItem('currentTimeLeft'));
console.log('Etapa actual:', localStorage.getItem('currentStageIndex'));

// En DevTools Console del popup
console.log('Popup sincronizado:', window.syncService?.isConnected());
```

### Verificar Mensajes de Sincronización
```javascript
// Filtrar mensajes de sincronización en Console
// Buscar: SYNC_REQUEST, SYNC_RESPONSE, syncAll, setTime, setStage
```

---

## 📊 Criterios de Éxito

### ✅ Sincronización Perfecta
- [ ] Diferencia de tiempo ≤ 1 segundo entre directorio y popup
- [ ] Cambios de estado se reflejan instantáneamente
- [ ] Controles funcionan bidireccionalmente

### ✅ Hidratación Robusta
- [ ] Popup se sincroniza automáticamente al reabrir
- [ ] No se requiere intervención manual
- [ ] Estado se mantiene consistente

### ✅ Manejo de Errores
- [ ] Popups bloqueados muestran banner informativo
- [ ] Reintento funciona correctamente
- [ ] No hay crashes o errores en consola

### ✅ Aislamiento Correcto
- [ ] Cambio de directorio actualiza popup completamente
- [ ] No hay interferencia entre directorios
- [ ] directoryId se respeta en todos los mensajes

---

## 🐛 Problemas Conocidos y Soluciones

### Popup No Se Sincroniza
**Síntoma**: Popup abre pero no muestra tiempo correcto
**Solución**: 
1. Verificar que `syncService` está inicializado
2. Revisar mensajes de error en consola
3. Forzar sincronización manual

### Drift Excesivo
**Síntoma**: Diferencia > 1 segundo entre timers
**Solución**:
1. Verificar que `requestAnimationFrame` está funcionando
2. Revisar intervalos de sincronización (100ms)
3. Comprobar que no hay procesos bloqueando el hilo principal

### Popup Bloqueado Persistente
**Síntoma**: Banner de error no desaparece
**Solución**:
1. Verificar configuración de popups en navegador
2. Limpiar localStorage: `localStorage.clear()`
3. Recargar página completamente

---

## 📈 Métricas de Rendimiento

### Tiempos de Respuesta Esperados
- **Sincronización inicial**: < 500ms
- **Cambio de estado**: < 100ms  
- **Hidratación**: < 1 segundo
- **Cambio de directorio**: < 2 segundos

### Uso de Recursos
- **CPU**: < 5% durante sincronización normal
- **Memoria**: < 50MB adicional por popup
- **Red**: Solo sincronización local (sin tráfico de red)

---

## 🎯 Checklist Final

- [ ] **FASE 1**: Controles sincronizados ✅
- [ ] **FASE 2**: Hidratación funcional ✅  
- [ ] **FASE 3**: Manejo de popups bloqueados ✅
- [ ] **FASE 4**: Cero drift verificado ✅
- [ ] **FASE 5**: Aislamiento por directorio ✅
- [ ] **Rendimiento**: Métricas dentro de rangos esperados ✅
- [ ] **Errores**: Sin errores críticos en consola ✅

---

## 📝 Notas de QA

**Fecha de Prueba**: ___________
**Tester**: ___________
**Navegador**: ___________
**Versión**: ___________

**Observaciones**:
- [ ] Todos los pasos completados exitosamente
- [ ] Problemas encontrados: ___________
- [ ] Soluciones aplicadas: ___________
- [ ] Recomendaciones: ___________

**Estado Final**: ✅ APROBADO / ❌ REQUIERE CORRECCIONES
