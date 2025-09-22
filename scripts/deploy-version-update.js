#!/usr/bin/env node

/**
 * Script de versionado automático para deploy
 * Se ejecuta solo cuando se hace deploy de la aplicación
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Iniciando versionado automático para deploy...\n');

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

- **DEPLOY AUTOMÁTICO**: Versión actualizada automáticamente para deploy
- **FECHA**: ${dateTime.date}
- **HORA**: ${dateTime.time}
- **TIMESTAMP**: ${new Date().toISOString()}
- **TIPO**: Deploy de aplicación web

`;

  // Insertar al principio del archivo
  content = newVersionEntry + content;
  
  fs.writeFileSync(versionMdPath, content);
  console.log(`✅ VERSION.md actualizado a v${newVersion}`);
}

// Función para actualizar el componente VersionInfo centralizado
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
  const newBuildDateLine = `const buildDate = new Date('${dateTime.date}T${dateTime.time}.000Z'); // Actualizado automáticamente para deploy`;
  
  if (buildDatePattern.test(content)) {
    content = content.replace(buildDatePattern, newBuildDateLine);
  }
  
  fs.writeFileSync(versionInfoPath, content);
  console.log(`✅ VersionInfo.tsx actualizado a v${newVersion}`);
}

// Función para actualizar archivos de interfaz usando el script centralizado
function updateInterfaceFiles(newVersion, dateTime) {
  try {
    // Importar y ejecutar el script de actualización de todas las páginas
    const { updateAllPagesVersion } = await import('./update-all-pages-version.js');
    updateAllPagesVersion(newVersion, dateTime);
  } catch (error) {
    console.log('⚠️ No se pudo usar el script centralizado, actualizando archivos individualmente...');
    
    // Fallback: actualizar archivos individualmente
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
        const newBuildDateLine = `const buildDate = new Date('${dateTime.date}T${dateTime.time}.000Z'); // Actualizado automáticamente para deploy`;
        
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
}

// Función principal
function deployVersionUpdate() {
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
    console.log(`📅 Fecha: ${dateTime.date}`);
    console.log(`🕐 Hora: ${dateTime.time}`);
    console.log(`🌐 ISO: ${new Date().toISOString()}`);
    
    // Actualizar todos los archivos
    updatePackageJson(newVersion);
    updateVersionMd(newVersion, dateTime);
    updateInterfaceFiles(newVersion, dateTime);
    
    // Actualizar el componente VersionInfo centralizado
    updateVersionInfoComponent(newVersion, dateTime);
    
    console.log('\n🎉 Versión actualizada para deploy:');
    console.log(`✅ De ${currentVersion} a ${newVersion}`);
    console.log(`📅 Fecha y hora: ${dateTime.full}`);
    console.log(`🕐 Timestamp ISO: ${new Date().toISOString()}`);
    console.log('✅ Archivos actualizados para deploy');
    
    // Agregar archivos al staging
    try {
      execSync('git add package.json VERSION.md src/components/VersionInfo.tsx src/pages/Directorio.tsx src/pages/MainMenu.tsx src/pages/MeetingView.tsx src/pages/Control.tsx src/pages/Presenter.tsx', { 
        cwd: projectRoot,
        stdio: 'inherit' 
      });
      console.log('\n📝 Archivos agregados al staging para commit de deploy');
    } catch (error) {
      console.log('\n⚠️ No se pudieron agregar archivos al staging:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error durante la actualización de versión para deploy:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  deployVersionUpdate();
}

export { deployVersionUpdate, incrementVersion, getCurrentDateTime };
