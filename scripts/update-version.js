#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Actualizando versión del proyecto...\n');

// Función para obtener la versión actual
function getCurrentVersion() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageContent.version;
  } catch (error) {
    console.error('❌ Error leyendo package.json:', error.message);
    return null;
  }
}

// Función para incrementar la versión
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

// Función para actualizar package.json
function updatePackageJson(newVersion) {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageContent.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2) + '\n');
  console.log(`✅ package.json actualizado a versión ${newVersion}`);
}

// Función para actualizar VERSION.md
function updateVersionFile(newVersion) {
  const versionPath = path.join(process.cwd(), 'VERSION.md');
  let content = fs.readFileSync(versionPath, 'utf8');
  
  const now = new Date();
  const dateString = now.toISOString().split('T')[0];
  const timeString = now.toTimeString().split(' ')[0];
  
  // Agregar nueva entrada al inicio del archivo
  const newEntry = `## 🚀 Versión ${newVersion} - [${dateString} ${timeString}]

### ✅ **Cambios Realizados:**
- **Actualización automática**: Versión sincronizada automáticamente
- **Mejoras en el sistema de versionado**: Sincronización automática entre archivos

### 🔧 **Archivos Modificados:**
- \`package.json\` (VERSIÓN ACTUALIZADA)
- \`src/pages/Home.tsx\` (VERSIÓN SINCRONIZADA)
- \`VERSION.md\` (HISTORIAL ACTUALIZADO)

### 📦 **Dependencias:**
- **Sin cambios**: Solo actualización de versión

---

`;
  
  // Insertar la nueva entrada después del título
  content = content.replace(/(# 📋 Historial de Versiones - Control de Reunión\s*\n)/, `$1${newEntry}`);
  
  fs.writeFileSync(versionPath, content, 'utf8');
  console.log(`✅ VERSION.md actualizado con nueva entrada para versión ${newVersion}`);
}

// Función principal
function updateVersion(type = 'patch') {
  const currentVersion = getCurrentVersion();
  
  if (!currentVersion) {
    console.error('❌ No se pudo obtener la versión actual');
    return;
  }
  
  const newVersion = incrementVersion(currentVersion, type);
  
  console.log(`📦 Versión actual: ${currentVersion}`);
  console.log(`🆕 Nueva versión: ${newVersion} (${type})`);
  
  // Actualizar archivos
  updatePackageJson(newVersion);
  updateVersionFile(newVersion);
  
  // Ejecutar sincronización
  console.log('\n🔄 Ejecutando sincronización...');
  try {
    execSync('npm run sync-version', { stdio: 'inherit' });
    console.log('\n🎉 ¡Actualización de versión completada exitosamente!');
    console.log(`✅ Proyecto actualizado a versión ${newVersion}`);
    console.log(`⏰ Fecha: ${new Date().toLocaleString('es-ES')}`);
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error.message);
  }
}

// Obtener tipo de actualización desde argumentos
const type = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(type)) {
  console.error('❌ Tipo de actualización inválido. Use: major, minor, o patch');
  process.exit(1);
}

// Ejecutar actualización
try {
  updateVersion(type);
} catch (error) {
  console.error('❌ Error durante la actualización:', error.message);
  process.exit(1);
}
