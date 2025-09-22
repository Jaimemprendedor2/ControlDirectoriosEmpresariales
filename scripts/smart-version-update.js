#!/usr/bin/env node

/**
 * Script inteligente para actualización de versión que evita bucles infinitos
 * Solo actualiza la versión cuando es necesario y detecta cambios reales
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Iniciando actualización inteligente de versión...\n');

// Función para verificar si hay cambios pendientes
function hasUncommittedChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: projectRoot });
    return status.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Función para verificar si el commit actual es de versionado automático
function isAutoVersionCommit() {
  try {
    const lastCommit = execSync('git log -1 --pretty=%B', { encoding: 'utf8', cwd: projectRoot });
    return lastCommit.includes('ACTUALIZACIÓN AUTOMÁTICA') || 
           lastCommit.includes('Actualización automática') ||
           lastCommit.includes('auto-update-version');
  } catch (error) {
    return false;
  }
}

// Función para obtener la fecha y hora actual
function getCurrentDateTime() {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0]; // HH:MM:SS
  return { date, time, full: `${date} ${time}` };
}

// Función para incrementar versión
function incrementVersion(currentVersion) {
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]) + 1;
  return `${major}.${minor}.${patch}`;
}

// Función para actualizar package.json
function updatePackageJson(newVersion) {
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.version = newVersion;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ package.json actualizado a v${newVersion}`);
}

// Función para actualizar VERSION.md
function updateVersionMd(newVersion, dateTime) {
  const versionMdPath = path.join(projectRoot, 'VERSION.md');
  
  if (!fs.existsSync(versionMdPath)) {
    console.log('⚠️ VERSION.md no encontrado, creando...');
    fs.writeFileSync(versionMdPath, '');
  }
  
  let content = fs.readFileSync(versionMdPath, 'utf8');
  
  // Crear nueva entrada de versión
  const newVersionEntry = `## v${newVersion} - [${dateTime.full}]

- **ACTUALIZACIÓN AUTOMÁTICA**: Versión actualizada automáticamente
- **FECHA**: ${dateTime.date}
- **HORA**: ${dateTime.time}
- **TIMESTAMP**: ${new Date().toISOString()}

`;

  // Insertar al principio del archivo
  content = newVersionEntry + content;
  
  fs.writeFileSync(versionMdPath, content);
  console.log(`✅ VERSION.md actualizado a v${newVersion}`);
}

// Función para actualizar archivos de interfaz
function updateInterfaceFiles(newVersion, dateTime) {
  const filesToUpdate = [
    'src/pages/Directorio.tsx',
    'src/pages/MainMenu.tsx',
    'src/pages/MeetingView.tsx'
  ];
  
  filesToUpdate.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Actualizar versión en la interfaz
      const versionPattern = /v\d+\.\d+\.\d+/g;
      content = content.replace(versionPattern, `v${newVersion}`);
      
      // Actualizar fecha de compilación si existe
      const buildDatePattern = /const buildDate = new Date\('.*?'\);/;
      const newBuildDateLine = `const buildDate = new Date('${dateTime.date}T${dateTime.time}.000Z'); // Actualizado automáticamente`;
      
      if (buildDatePattern.test(content)) {
        content = content.replace(buildDatePattern, newBuildDateLine);
      }
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ ${filePath} actualizado a v${newVersion}`);
    } else {
      console.log(`⚠️ Archivo no encontrado: ${filePath}`);
    }
  });
}

// Función principal con lógica anti-bucle
function smartUpdateVersion() {
  try {
    // Verificar si ya hay cambios pendientes
    if (hasUncommittedChanges()) {
      console.log('⚠️ Hay cambios pendientes en el repositorio');
      console.log('🔄 Verificando si es un commit de versionado automático...');
      
      if (isAutoVersionCommit()) {
        console.log('🚫 Detectado commit de versionado automático - evitando bucle infinito');
        console.log('✅ No se realizará actualización automática');
        return;
      }
    }

    // Obtener versión actual
    const packagePath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageJson.version;
    
    console.log(`📦 Versión actual: ${currentVersion}`);
    
    // Incrementar versión
    const newVersion = incrementVersion(currentVersion);
    console.log(`🔄 Nueva versión: ${newVersion}`);
    
    // Obtener fecha y hora actual
    const dateTime = getCurrentDateTime();
    console.log(`📅 Fecha: ${dateTime.date}`);
    console.log(`🕐 Hora: ${dateTime.time}`);
    console.log(`🌐 ISO: ${new Date().toISOString()}`);
    
    // Actualizar todos los archivos
    updatePackageJson(newVersion);
    updateVersionMd(newVersion, dateTime);
    updateInterfaceFiles(newVersion, dateTime);
    
    console.log('\n🎉 Versión actualizada de ' + currentVersion + ' a ' + newVersion);
    console.log(`📅 Fecha y hora: ${dateTime.full}`);
    console.log(`🕐 Timestamp ISO: ${new Date().toISOString()}`);
    console.log('✅ Pre-commit hook completado exitosamente');
    console.log('📝 Archivos de versión actualizados y agregados al commit');
    
  } catch (error) {
    console.error('❌ Error durante la actualización de versión:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  smartUpdateVersion();
}

export { smartUpdateVersion, incrementVersion, getCurrentDateTime };
