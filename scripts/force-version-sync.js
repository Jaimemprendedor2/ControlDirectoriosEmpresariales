#!/usr/bin/env node

/**
 * Script robusto para forzar sincronización de versiones al 100%
 * Garantiza que package.json, Directorio.tsx y VERSION.md estén sincronizados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Iniciando sincronización forzada de versiones...\n');

// Función para leer archivo JSON
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error leyendo ${filePath}:`, error.message);
    return null;
  }
}

// Función para escribir archivo JSON
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    return true;
  } catch (error) {
    console.error(`❌ Error escribiendo ${filePath}:`, error.message);
    return false;
  }
}

// Función para actualizar versión en Directorio.tsx
function updateDirectorioVersion(version) {
  const directorioPath = path.join(projectRoot, 'src', 'pages', 'Directorio.tsx');
  
  try {
    let content = fs.readFileSync(directorioPath, 'utf8');
    
    // Buscar y reemplazar la versión en el badge
    const versionRegex = /v\d+\.\d+\.\d+/g;
    content = content.replace(versionRegex, `v${version}`);
    
    fs.writeFileSync(directorioPath, content);
    console.log(`✅ Directorio.tsx actualizado a v${version}`);
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando Directorio.tsx:`, error.message);
    return false;
  }
}

// Función para actualizar VERSION.md
function updateVersionMd(version) {
  const versionMdPath = path.join(projectRoot, 'VERSION.md');
  
  try {
    let content = fs.readFileSync(versionMdPath, 'utf8');
    
    // Buscar la primera línea que contiene la versión más reciente
    const lines = content.split('\n');
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    
    // Crear nueva entrada de versión
    const newVersionEntry = `## v${version} - ${timestamp}\n- Sincronización forzada de versiones\n- Garantía 100% de sincronización entre archivos\n\n`;
    
    // Insertar al principio del archivo
    content = newVersionEntry + content;
    
    fs.writeFileSync(versionMdPath, content);
    console.log(`✅ VERSION.md actualizado a v${version}`);
    return true;
  } catch (error) {
    console.error(`❌ Error actualizando VERSION.md:`, error.message);
    return false;
  }
}

// Función principal
function forceVersionSync() {
  console.log('📦 Leyendo package.json...');
  const packageJson = readJsonFile(path.join(projectRoot, 'package.json'));
  
  if (!packageJson) {
    console.error('❌ No se pudo leer package.json');
    process.exit(1);
  }
  
  const currentVersion = packageJson.version;
  console.log(`📋 Versión actual en package.json: ${currentVersion}`);
  
  // Incrementar versión patch
  const versionParts = currentVersion.split('.');
  const major = parseInt(versionParts[0]);
  const minor = parseInt(versionParts[1]);
  const patch = parseInt(versionParts[2]) + 1;
  const newVersion = `${major}.${minor}.${patch}`;
  
  console.log(`🔄 Incrementando versión a: ${newVersion}\n`);
  
  // Actualizar package.json
  packageJson.version = newVersion;
  if (!writeJsonFile(path.join(projectRoot, 'package.json'), packageJson)) {
    console.error('❌ Error actualizando package.json');
    process.exit(1);
  }
  console.log(`✅ package.json actualizado a v${newVersion}`);
  
  // Actualizar Directorio.tsx
  if (!updateDirectorioVersion(newVersion)) {
    console.error('❌ Error actualizando Directorio.tsx');
    process.exit(1);
  }
  
  // Actualizar VERSION.md
  if (!updateVersionMd(newVersion)) {
    console.error('❌ Error actualizando VERSION.md');
    process.exit(1);
  }
  
  console.log('\n🎉 ¡Sincronización forzada completada exitosamente!');
  console.log(`✅ Todas las versiones sincronizadas a: v${newVersion}`);
  console.log('📁 Archivos actualizados:');
  console.log('   - package.json');
  console.log('   - src/pages/Directorio.tsx');
  console.log('   - VERSION.md');
  console.log('\n🚀 Listo para commit y push');
}

// Ejecutar script
forceVersionSync();
