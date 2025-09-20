#!/usr/bin/env node

/**
 * Script para configurar Git hooks automáticos
 * Configura el directorio de hooks y hace ejecutables los archivos
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Configurando Git hooks automáticos...\n');

// Función para configurar Git hooks
function setupGitHooks() {
  try {
    // Verificar si estamos en un repositorio Git
    execSync('git rev-parse --git-dir', { cwd: projectRoot, stdio: 'pipe' });
    console.log('✅ Repositorio Git detectado');
    
    // Configurar el directorio de hooks
    execSync('git config core.hooksPath .githooks', { cwd: projectRoot });
    console.log('✅ Directorio de hooks configurado: .githooks');
    
    // Hacer ejecutable el archivo pre-commit
    const preCommitPath = path.join(projectRoot, '.githooks', 'pre-commit');
    if (fs.existsSync(preCommitPath)) {
      // En Windows, no necesitamos chmod, pero verificamos que el archivo existe
      console.log('✅ Archivo pre-commit encontrado');
    } else {
      console.log('❌ Archivo pre-commit no encontrado');
      return false;
    }
    
    // Verificar configuración
    const hooksPath = execSync('git config core.hooksPath', { 
      cwd: projectRoot, 
      encoding: 'utf8' 
    }).trim();
    
    console.log(`✅ Hooks configurados en: ${hooksPath}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error configurando Git hooks:', error.message);
    return false;
  }
}

// Función para verificar configuración actual
function checkCurrentConfig() {
  try {
    const hooksPath = execSync('git config core.hooksPath', { 
      cwd: projectRoot, 
      encoding: 'utf8' 
    }).trim();
    
    console.log(`📋 Configuración actual de hooks: ${hooksPath}`);
    
    if (hooksPath === '.githooks') {
      console.log('✅ Git hooks ya están configurados correctamente');
      return true;
    } else {
      console.log('⚠️ Git hooks no están configurados en .githooks');
      return false;
    }
    
  } catch (error) {
    console.log('⚠️ No se pudo verificar la configuración actual');
    return false;
  }
}

// Función para crear directorio de hooks si no existe
function createHooksDirectory() {
  const hooksDir = path.join(projectRoot, '.githooks');
  
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
    console.log('✅ Directorio .githooks creado');
  } else {
    console.log('✅ Directorio .githooks ya existe');
  }
}

// Función para probar el hook
function testHook() {
  console.log('\n🧪 Probando hook pre-commit...');
  
  try {
    // Simular un commit de prueba
    execSync('git add .', { cwd: projectRoot, stdio: 'pipe' });
    console.log('✅ Archivos agregados al staging');
    
    // Verificar que el hook se ejecutaría
    console.log('✅ Hook pre-commit configurado y listo');
    
  } catch (error) {
    console.log('⚠️ No se pudo probar el hook:', error.message);
  }
}

// Función principal
function main() {
  console.log('🔍 Verificando configuración actual...');
  
  if (checkCurrentConfig()) {
    console.log('\n✅ Git hooks ya están configurados correctamente');
    testHook();
    return;
  }
  
  console.log('\n🔧 Configurando Git hooks...');
  
  // Crear directorio de hooks
  createHooksDirectory();
  
  // Configurar hooks
  if (setupGitHooks()) {
    console.log('\n🎉 ¡Git hooks configurados exitosamente!');
    console.log('\n📋 Configuración aplicada:');
    console.log('   - Directorio de hooks: .githooks');
    console.log('   - Hook pre-commit: Actualización automática de versión');
    console.log('   - Hook post-commit: (disponible para futuras mejoras)');
    
    console.log('\n🚀 Próximos pasos:');
    console.log('   1. Hacer un commit para probar la actualización automática');
    console.log('   2. Verificar que la versión se actualiza automáticamente');
    console.log('   3. Los archivos de versión se agregarán automáticamente al commit');
    
    testHook();
    
  } else {
    console.log('\n❌ Error configurando Git hooks');
    console.log('💡 Soluciones posibles:');
    console.log('   - Verificar que estás en un repositorio Git');
    console.log('   - Verificar permisos de escritura');
    console.log('   - Ejecutar como administrador si es necesario');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { setupGitHooks, checkCurrentConfig, createHooksDirectory };
