#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔄 Sincronizando versión y fecha de compilación...\n');

// Función para obtener la versión actual del package.json
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

// Función para actualizar la versión y fecha en Directorio.tsx
function syncDirectorioVersion(version) {
  const directorioPath = path.join(process.cwd(), 'src', 'pages', 'Directorio.tsx');
  
  if (!fs.existsSync(directorioPath)) {
    console.error('❌ No se encontró el archivo Directorio.tsx');
    return false;
  }

  let content = fs.readFileSync(directorioPath, 'utf8');
  
  // Obtener fecha actual
  const now = new Date();
  const dateString = now.toISOString();
  
  // 1. Actualizar la versión mostrada en la interfaz
  const versionPattern = /v\d+\.\d+\.\d+\s*\(\{getBuildInfo\(\)\}\)/;
  const newVersionDisplay = `v${version} ({getBuildInfo()})`;
  
  if (versionPattern.test(content)) {
    content = content.replace(versionPattern, newVersionDisplay);
    console.log(`✅ Versión actualizada en interfaz: v${version}`);
  } else {
    console.log('⚠️ No se encontró el patrón de versión en la interfaz');
  }
  
  // 2. Actualizar la fecha de compilación
  const buildDatePattern = /const buildDate = new Date\('.*?'\);/;
  const newBuildDateLine = `const buildDate = new Date('${dateString}'); // Fecha actualizada automáticamente`;
  
  if (buildDatePattern.test(content)) {
    content = content.replace(buildDatePattern, newBuildDateLine);
    console.log(`✅ Fecha de compilación actualizada: ${now.toLocaleString('es-ES')}`);
  } else {
    console.log('⚠️ No se encontró el patrón de fecha de compilación');
  }
  
  // Escribir los cambios
  fs.writeFileSync(directorioPath, content, 'utf8');
  return true;
}

// Función para actualizar VERSION.md
function syncVersionFile(version) {
  const versionPath = path.join(process.cwd(), 'VERSION.md');
  
  if (!fs.existsSync(versionPath)) {
    console.error('❌ No se encontró el archivo VERSION.md');
    return false;
  }

  let content = fs.readFileSync(versionPath, 'utf8');
  
  // Obtener fecha actual
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
  
  // Actualizar la fecha de la versión actual
  const versionPattern = /## 🚀 Versión \d+\.\d+\.\d+ - \[.*?\]/;
  const newVersionLine = `## 🚀 Versión ${version} - [${dateString} ${timeString}]`;
  
  if (versionPattern.test(content)) {
    content = content.replace(versionPattern, newVersionLine);
    console.log(`✅ VERSION.md actualizado: ${version} - ${dateString} ${timeString}`);
  }
  
  // Actualizar la última actualización
  const updatePattern = /\*Última actualización: .*?\*/;
  const newUpdateLine = `*Última actualización: ${dateString} ${timeString}*`;
  
  if (updatePattern.test(content)) {
    content = content.replace(updatePattern, newUpdateLine);
  }
  
  fs.writeFileSync(versionPath, content, 'utf8');
  return true;
}

// Función principal
function syncAll() {
  const version = getCurrentVersion();
  
  if (!version) {
    console.error('❌ No se pudo obtener la versión del package.json');
    return;
  }
  
  console.log(`📦 Versión actual detectada: ${version}`);
  
  // Sincronizar todos los archivos
  const directorioSuccess = syncDirectorioVersion(version);
  const versionSuccess = syncVersionFile(version);
  
  if (directorioSuccess && versionSuccess) {
    console.log('\n🎉 ¡Sincronización completada exitosamente!');
    console.log(`✅ Versión ${version} sincronizada en todos los archivos`);
    console.log(`⏰ Fecha y hora actualizadas: ${new Date().toLocaleString('es-ES')}`);
  } else {
    console.log('\n⚠️ Sincronización completada con algunos errores');
  }
}

// Ejecutar la sincronización
try {
  syncAll();
} catch (error) {
  console.error('❌ Error durante la sincronización:', error.message);
  process.exit(1);
}
