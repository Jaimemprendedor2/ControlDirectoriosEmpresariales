# Pruebas Manuales - Manejo de Popup Bloqueado

## Descripción de la Funcionalidad

Se ha implementado un sistema de manejo de popup bloqueado por el navegador en `Directorio.tsx`. Cuando `window.open` devuelve `null` o la ventana se cierra inmediatamente, se muestra un banner no modal con opciones de reintento.

## Características Implementadas

- ✅ Detección automática de popup bloqueado
- ✅ Banner no modal con mensaje informativo
- ✅ Botón "Reintentar abrir popup" con gesto de usuario
- ✅ Accesibilidad completa (role="alert", focus automático)
- ✅ No interrumpe el flujo de la aplicación
- ✅ Botón de cerrar banner

## Pruebas Manuales

### 1. Configurar Bloqueo de Popups

**Objetivo:** Simular el bloqueo de popups por el navegador

**Pasos:**
1. Abrir Chrome/Edge
2. Ir a Configuración → Privacidad y seguridad → Configuración del sitio
3. Buscar el dominio de la aplicación
4. Configurar "Popups y redireccionamientos" a "Bloquear"
5. Recargar la aplicación

### 2. Probar Detección de Popup Bloqueado

**Objetivo:** Verificar que se detecta correctamente el bloqueo

**Pasos:**
1. Con popups bloqueados, navegar a la aplicación
2. Seleccionar un directorio existente
3. Hacer clic en "Abrir Reflejo"
4. **Resultado esperado:** 
   - Aparece banner amarillo con mensaje "No pudimos abrir el popup"
   - Banner incluye botón "Reintentar abrir popup"
   - Banner incluye botón "✕ Cerrar"

### 3. Probar Funcionalidad de Reintento

**Objetivo:** Verificar que el botón de reintento funciona

**Pasos:**
1. Con el banner visible, hacer clic en "Reintentar abrir popup"
2. **Resultado esperado:**
   - Se ejecuta nuevamente `openOrFocusMirror()`
   - Si sigue bloqueado, el banner permanece
   - Si se permite el popup, el banner desaparece y se abre la ventana

### 4. Probar Accesibilidad

**Objetivo:** Verificar que la funcionalidad es accesible

**Pasos:**
1. Usar solo teclado para navegar
2. Verificar que el banner tiene `role="alert"`
3. Verificar que el botón de reintento recibe focus automáticamente
4. Verificar que se puede navegar entre botones con Tab
5. Verificar que se puede activar con Enter/Espacio

**Resultado esperado:**
- Banner anuncia correctamente el problema
- Focus se mueve automáticamente al botón de reintento
- Navegación por teclado funciona correctamente

### 5. Probar Cierre del Banner

**Objetivo:** Verificar que se puede cerrar el banner

**Pasos:**
1. Con el banner visible, hacer clic en "✕ Cerrar"
2. **Resultado esperado:**
   - Banner desaparece
   - No se interrumpe el flujo de la aplicación
   - Se puede continuar usando la aplicación normalmente

### 6. Probar Flujo Normal (Sin Bloqueo)

**Objetivo:** Verificar que no afecta el funcionamiento normal

**Pasos:**
1. Permitir popups en el navegador
2. Navegar a la aplicación
3. Seleccionar un directorio
4. Hacer clic en "Abrir Reflejo"
5. **Resultado esperado:**
   - No aparece banner
   - Se abre la ventana popup normalmente
   - Funcionalidad normal no se ve afectada

### 7. Probar Múltiples Intentos

**Objetivo:** Verificar comportamiento con múltiples intentos

**Pasos:**
1. Con popups bloqueados, hacer clic en "Abrir Reflejo"
2. Hacer clic en "Reintentar abrir popup" varias veces
3. **Resultado esperado:**
   - Cada intento ejecuta la función correctamente
   - Banner permanece visible hasta que se permita el popup
   - No hay errores en consola

### 8. Probar Cambio de Configuración Durante Uso

**Objetivo:** Verificar comportamiento al cambiar configuración

**Pasos:**
1. Con popups bloqueados, mostrar banner
2. Cambiar configuración del navegador para permitir popups
3. Hacer clic en "Reintentar abrir popup"
4. **Resultado esperado:**
   - Banner desaparece
   - Se abre la ventana popup correctamente
   - Funcionalidad normal se restaura

## Criterios de Aceptación

- ✅ Banner aparece solo cuando popup está bloqueado
- ✅ Banner es no modal y no interrumpe el flujo
- ✅ Botón de reintento funciona correctamente
- ✅ Accesibilidad completa implementada
- ✅ Banner se puede cerrar manualmente
- ✅ No afecta funcionamiento normal
- ✅ Mensajes son claros y útiles para el usuario

## Notas Técnicas

- La detección se basa en `window.open()` devolviendo `null` o ventana cerrada inmediatamente
- El banner usa `role="alert"` para accesibilidad
- Focus automático al botón de reintento para mejor UX
- Timeout de 100ms para detectar cierre inmediato de ventana
- Estado `popupBlocked` controla la visibilidad del banner
