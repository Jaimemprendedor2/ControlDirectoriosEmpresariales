# 🔄 Sistema de Versionado Automático

## 📋 Descripción

Este proyecto incluye un sistema automatizado de versionado que mantiene sincronizada la versión entre todos los archivos del proyecto y actualiza automáticamente las fechas de compilación.

## 🚀 Scripts Disponibles

### **Sincronización de Versión**
```bash
npm run sync-version
```
- Sincroniza la versión entre `package.json`, `Home.tsx` y `VERSION.md`
- Actualiza la fecha de compilación en la interfaz
- Actualiza la fecha de última modificación en `VERSION.md`

### **Actualización de Versión**
```bash
# Actualización PATCH (1.6.2 → 1.6.3)
npm run version-patch

# Actualización MINOR (1.6.2 → 1.7.0)
npm run version-minor

# Actualización MAJOR (1.6.2 → 2.0.0)
npm run version-major
```

### **Build Automático**
```bash
npm run build
```
- Ejecuta automáticamente `sync-version` antes del build
- Garantiza que la versión esté sincronizada en producción

## 📁 Archivos Sincronizados

### **1. package.json**
- **Campo**: `version`
- **Formato**: `1.6.2`
- **Actualización**: Manual o con scripts de versión

### **2. src/pages/Home.tsx**
- **Línea**: `v1.6.2 ({getBuildInfo()})`
- **Función**: `getBuildInfo()` - Muestra fecha de compilación
- **Actualización**: Automática con `sync-version`

### **3. VERSION.md**
- **Sección**: `## 🚀 Versión X.X.X - [YYYY-MM-DD HH:MM:SS]`
- **Actualización**: Automática con `sync-version` y `update-version`

## ⚙️ Cuándo se Ejecuta Automáticamente

### **Build de Producción**
- **Comando**: `npm run build`
- **Acción**: Ejecuta `sync-version` antes de compilar
- **Resultado**: Versión sincronizada en la aplicación final

### **Actualización de Versión**
- **Comando**: `npm run version-*`
- **Acción**: Actualiza versión y ejecuta sincronización
- **Resultado**: Nueva versión en todos los archivos

## 🔧 Configuración

### **Scripts en package.json**
```json
{
  "scripts": {
    "build": "npm run sync-version && tsc && vite build",
    "sync-version": "node scripts/sync-version.js",
    "update-version": "node scripts/update-version.js",
    "version-patch": "node scripts/update-version.js patch",
    "version-minor": "node scripts/update-version.js minor",
    "version-major": "node scripts/update-version.js major"
  }
}
```

## 📊 Flujo de Trabajo

### **1. Desarrollo Normal**
```bash
# Hacer cambios en el código
# La versión se mantiene igual
npm run dev
```

### **2. Actualización de Versión**
```bash
# Para cambios menores (bugs, mejoras pequeñas)
npm run version-patch

# Para nuevas funcionalidades
npm run version-minor

# Para cambios importantes o incompatibles
npm run version-major
```

### **3. Build para Producción**
```bash
# Sincroniza automáticamente la versión
npm run build
```

## ✅ Beneficios

1. **Sincronización Automática**: No hay que recordar actualizar manualmente cada archivo
2. **Fechas Actualizadas**: La fecha de compilación siempre refleja cuándo se actualizó
3. **Consistencia**: Todos los archivos muestran la misma versión
4. **Automatización**: Se ejecuta automáticamente en el build
5. **Historial**: Mantiene un registro detallado de versiones en `VERSION.md`

## 🎯 Estado Actual

- **Versión**: 1.6.2
- **Última Sincronización**: 16/9/2025, 19:47:36
- **Estado**: ✅ Sincronizado correctamente

## 📝 Notas Importantes

- **Siempre ejecutar** `npm run sync-version` después de cambios manuales en la versión
- **El build automático** ya incluye la sincronización
- **Para actualizar versión**, usar los scripts `version-*` en lugar de editar manualmente
- **La fecha de compilación** se actualiza automáticamente cada vez que se ejecuta `sync-version`
