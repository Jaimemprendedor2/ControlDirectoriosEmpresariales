#!/usr/bin/env node

/**
 * Script para actualizar la versión en todas las páginas de la plataforma
 * Asegura que todas las páginas muestren la misma versión y fecha
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔄 Actualizando versión en todas las páginas...\n');

// Función para obtener la fecha y hora actual
function getCurrentDateTime() {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
  return { date, time, full: `${date} ${time}`, iso: now.toISOString() };
}

// Función para actualizar el componente VersionInfo
function updateVersionInfoComponent(newVersion, dateTime) {
  const versionInfoPath = path.join(projectRoot, 'src', 'components', 'VersionInfo.tsx');
  
  if (!fs.existsSync(versionInfoPath)) {
    console.log('⚠️ VersionInfo.tsx no encontrado, creando...');
    return;
  }
  
  let content = fs.readFileSync(versionInfoPath, 'utf8');
  
  // Actualizar versión
  const versionPattern = /v\d+\.\d+\.\d+/g;
  content = content.replace(versionPattern, `v${newVersion}`);
  
  // Actualizar fecha de compilación
  const buildDatePattern = /const buildDate = new Date\('.*?'\);/;
  const newBuildDateLine = `const buildDate = new Date('${dateTime.iso}'); // Actualizado automáticamente para deploy`;
  
  if (buildDatePattern.test(content)) {
    content = content.replace(buildDatePattern, newBuildDateLine);
  }
  
  fs.writeFileSync(versionInfoPath, content);
  console.log(`✅ VersionInfo.tsx actualizado a v${newVersion}`);
}

// Función para actualizar páginas individuales
function updatePageFile(filePath, fileName, newVersion, dateTime) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ Archivo no encontrado: ${fileName}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Actualizar versión en la interfaz
  const versionPattern = /v\d+\.\d+\.\d+/g;
  content = content.replace(versionPattern, `v${newVersion}`);
  
  // Actualizar fecha de compilación si existe
  const buildDatePattern = /const buildDate = new Date\('.*?'\);/;
  const newBuildDateLine = `const buildDate = new Date('${dateTime.iso}'); // Actualizado automáticamente para deploy`;
  
  if (buildDatePattern.test(content)) {
    content = content.replace(buildDatePattern, newBuildDateLine);
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ ${fileName} actualizado a v${newVersion}`);
  return true;
}

// Función para agregar versión a páginas que no la tienen
function addVersionToPage(filePath, fileName, newVersion, dateTime) {
  const fullPath = path.join(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ Archivo no encontrado: ${fileName}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Verificar si ya tiene versión
  if (content.includes('v' + newVersion.split('.').join('.'))) {
    console.log(`ℹ️ ${fileName} ya tiene la versión actualizada`);
    return true;
  }
  
  // Buscar el patrón de header o título principal
  const headerPattern = /(<div className="[^"]*min-h-screen[^"]*"[^>]*>)/;
  const versionComponent = `
    {/* Versión de la plataforma */}
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full shadow-lg">
        v${newVersion} (${dateTime.full})
      </div>
    </div>
    
    $1`;
  
  if (headerPattern.test(content)) {
    content = content.replace(headerPattern, versionComponent);
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${fileName} - Versión agregada en centro superior`);
    return true;
  } else {
    console.log(`⚠️ ${fileName} - No se pudo agregar versión automáticamente`);
    return false;
  }
}

// Función principal
function updateAllPagesVersion(newVersion, dateTime) {
  console.log(`📦 Actualizando todas las páginas a versión ${newVersion}`);
  console.log(`📅 Fecha: ${dateTime.full}`);
  console.log(`🌐 ISO: ${dateTime.iso}\n`);
  
  // Lista de archivos a actualizar
  const filesToUpdate = [
    { path: 'src/components/VersionInfo.tsx', name: 'VersionInfo.tsx', hasVersion: true },
    { path: 'src/pages/MainMenu.tsx', name: 'MainMenu.tsx', hasVersion: true },
    { path: 'src/pages/Directorio.tsx', name: 'Directorio.tsx', hasVersion: true },
    { path: 'src/pages/MeetingView.tsx', name: 'MeetingView.tsx', hasVersion: false },
    { path: 'src/pages/Control.tsx', name: 'Control.tsx', hasVersion: false },
    { path: 'src/pages/Presenter.tsx', name: 'Presenter.tsx', hasVersion: false }
  ];
  
  let updatedCount = 0;
  
  filesToUpdate.forEach(file => {
    if (file.hasVersion) {
      // Actualizar archivos que ya tienen versión
      if (updatePageFile(file.path, file.name, newVersion, dateTime)) {
        updatedCount++;
      }
    } else {
      // Agregar versión a archivos que no la tienen
      if (addVersionToPage(file.path, file.name, newVersion, dateTime)) {
        updatedCount++;
      }
    }
  });
  
  console.log(`\n🎉 Actualización completada: ${updatedCount}/${filesToUpdate.length} archivos actualizados`);
  console.log(`✅ Todas las páginas ahora muestran la versión ${newVersion}`);
  console.log(`📅 Fecha y hora: ${dateTime.full}`);
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  // Obtener versión del package.json
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  
  const dateTime = getCurrentDateTime();
  updateAllPagesVersion(currentVersion, dateTime);
}

export { updateAllPagesVersion, getCurrentDateTime };
