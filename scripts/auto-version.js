#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🤖 Detección automática de versión basada en cambios...\n');

// Función para obtener los cambios en git
function getGitChanges() {
  try {
    // Obtener archivos modificados desde el último commit
    const output = execSync('git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only --cached', { encoding: 'utf8' });
    return output.trim().split('\n').filter(line => line.length > 0);
  } catch (error) {
    console.log('⚠️ No se pudieron obtener cambios de git, usando archivos en staging...');
    try {
      const output = execSync('git diff --name-only --cached', { encoding: 'utf8' });
      return output.trim().split('\n').filter(line => line.length > 0);
    } catch (e) {
      console.error('❌ Error obteniendo cambios de git:', e.message);
      return [];
    }
  }
}

// Función para detectar el tipo de cambio
function detectChangeType(changedFiles) {
  const majorPatterns = [
    /package\.json$/,
    /src\/App\.tsx$/,
    /src\/main\.tsx$/,
    /vite\.config\.ts$/,
    /tsconfig\.json$/
  ];

  const minorPatterns = [
    /src\/pages\/.*\.tsx$/,
    /src\/components\/.*\.tsx$/,
    /src\/services\/.*\.ts$/,
    /scripts\/.*\.js$/
  ];

  const patchPatterns = [
    /src\/.*\.tsx?$/,
    /.*\.md$/,
    /.*\.css$/,
    /.*\.json$/
  ];

  console.log('📂 Archivos modificados:');
  changedFiles.forEach(file => console.log(`   - ${file}`));
  console.log('');

  // Detectar cambios mayores
  const hasMajorChanges = changedFiles.some(file => 
    majorPatterns.some(pattern => pattern.test(file))
  );

  // Detectar cambios menores
  const hasMinorChanges = changedFiles.some(file => 
    minorPatterns.some(pattern => pattern.test(file))
  );

  // Detectar si hay nuevos archivos importantes
  const hasNewComponents = changedFiles.some(file => 
    file.includes('src/pages/') || file.includes('src/components/')
  );

  if (hasMajorChanges) {
    return 'major';
  } else if (hasMinorChanges || hasNewComponents) {
    return 'minor';
  } else {
    return 'patch';
  }
}

// Función principal
function autoVersion() {
  const changedFiles = getGitChanges();
  
  if (changedFiles.length === 0) {
    console.log('ℹ️ No se detectaron cambios, sincronizando versión actual...');
    execSync('npm run sync-version', { stdio: 'inherit' });
    return;
  }

  const changeType = detectChangeType(changedFiles);
  
  console.log(`🔍 Tipo de cambio detectado: ${changeType.toUpperCase()}`);
  console.log(`🚀 Actualizando versión ${changeType}...\n`);

  try {
    // Ejecutar actualización de versión correspondiente
    execSync(`npm run version-${changeType}`, { stdio: 'inherit' });
    console.log(`\n✅ Versión ${changeType} actualizada exitosamente!`);
  } catch (error) {
    console.error(`❌ Error actualizando versión ${changeType}:`, error.message);
    console.log('🔄 Intentando sincronización manual...');
    execSync('npm run sync-version', { stdio: 'inherit' });
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    autoVersion();
  } catch (error) {
    console.error('❌ Error en auto-versión:', error.message);
    process.exit(1);
  }
}

export { autoVersion, detectChangeType, getGitChanges };
