#!/usr/bin/env node

/**
 * Script para actualizar automáticamente la versión en cada commit
 * Actualiza package.json, VERSION.md y archivos de interfaz
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Iniciando actualización automática de versión...\n');

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
  const newVersionEntry = `## v${newVersion} - ${dateTime.full}
- **ACTUALIZACIÓN AUTOMÁTICA**: Versión actualizada automáticamente por Git hook
- **FECHA DE COMPILACIÓN**: ${dateTime.full}
- **MEJORAS IMPLEMENTADAS**: 
  - Barra de navegación en ventana de cronómetro
  - Plugins para modo segundo plano
  - Sistema de notificaciones mejorado
  - Configuración personalizable
  - Persistencia de estado avanzada

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

// Función para crear archivo de información de build
function createBuildInfo(newVersion, dateTime) {
  const buildInfo = {
    version: newVersion,
    buildDate: dateTime.full,
    buildTimestamp: Date.now(),
    gitCommit: getGitCommitHash(),
    gitBranch: getGitBranch()
  };
  
  const buildInfoPath = path.join(projectRoot, 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  console.log(`✅ build-info.json creado`);
}

// Función para obtener hash del commit actual
function getGitCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 7);
  } catch (error) {
    return 'unknown';
  }
}

// Función para obtener rama actual
function getGitBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

// Función para actualizar archivo de versión simple
function updateVersionFile(newVersion, dateTime) {
  const versionContent = `# Información de Versión

## Versión Actual
**v${newVersion}**

## Fecha de Compilación
**${dateTime.full}**

## Información de Build
- **Commit**: ${getGitCommitHash()}
- **Rama**: ${getGitBranch()}
- **Timestamp**: ${Date.now()}

## Última Actualización
${new Date().toLocaleString('es-ES')}
`;

  const versionFilePath = path.join(projectRoot, 'VERSION.txt');
  fs.writeFileSync(versionFilePath, versionContent);
  console.log(`✅ VERSION.txt actualizado`);
}

// Función principal
function autoUpdateVersion() {
  try {
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
    console.log(`📅 Fecha y hora: ${dateTime.full}\n`);
    
    // Actualizar todos los archivos
    updatePackageJson(newVersion);
    updateVersionMd(newVersion, dateTime);
    updateInterfaceFiles(newVersion, dateTime);
    createBuildInfo(newVersion, dateTime);
    updateVersionFile(newVersion, dateTime);
    
    console.log('\n🎉 ¡Actualización de versión completada exitosamente!');
    console.log(`✅ Versión actualizada de ${currentVersion} a ${newVersion}`);
    console.log(`📅 Fecha de compilación: ${dateTime.full}`);
    console.log(`🔧 Commit: ${getGitCommitHash()}`);
    console.log(`🌿 Rama: ${getGitBranch()}`);
    
    // Agregar archivos actualizados al staging
    try {
      execSync('git add package.json VERSION.md VERSION.txt build-info.json src/pages/Directorio.tsx src/pages/MainMenu.tsx src/pages/MeetingView.tsx', { 
        cwd: projectRoot,
        stdio: 'inherit' 
      });
      console.log('\n📝 Archivos agregados al staging de Git');
    } catch (error) {
      console.log('\n⚠️ No se pudieron agregar archivos al staging:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error durante la actualización de versión:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  autoUpdateVersion();
}

export { autoUpdateVersion, incrementVersion, getCurrentDateTime };
