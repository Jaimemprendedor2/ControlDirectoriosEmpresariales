#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Ejecutando pre-push hook - Actualizando versión y fecha...\n');

// Función para verificar si hay cambios pendientes
function hasUncommittedChanges() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf8' });
    return output.trim().length > 0;
  } catch (error) {
    console.error('❌ Error verificando cambios pendientes:', error.message);
    return false;
  }
}

// Función para verificar si hay commits pendientes de push
function hasCommitsToPush() {
  try {
    const output = execSync('git log --oneline origin/master..HEAD 2>/dev/null || git log --oneline origin/main..HEAD 2>/dev/null', { encoding: 'utf8' });
    return output.trim().length > 0;
  } catch (error) {
    console.log('⚠️ No se pudo verificar commits pendientes, continuando...');
    return true; // Asumir que hay commits para ser seguro
  }
}

// Función principal
function prePushHook() {
  console.log('🔍 Verificando estado del repositorio...');
  
  // Verificar si hay cambios sin commitear
  if (hasUncommittedChanges()) {
    console.log('⚠️ Hay cambios sin commitear. Ejecutando sincronización...');
    try {
      execSync('npm run sync-version', { stdio: 'inherit' });
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('❌ Error en sincronización:', error.message);
    }
  } else {
    console.log('✅ No hay cambios pendientes');
  }
  
  // Verificar si hay commits para hacer push
  if (hasCommitsToPush()) {
    console.log('📤 Hay commits pendientes de push');
    
    // Ejecutar sincronización final antes del push
    try {
      console.log('🔄 Ejecutando sincronización final...');
      execSync('npm run sync-version', { stdio: 'inherit' });
      
      // Si hay cambios después de la sincronización, hacer commit
      if (hasUncommittedChanges()) {
        console.log('💾 Haciendo commit de cambios de sincronización...');
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Auto: Sincronizar versión y fecha de compilación"', { stdio: 'inherit' });
        console.log('✅ Commit de sincronización completado');
      }
      
      console.log('🎉 Pre-push hook completado exitosamente');
    } catch (error) {
      console.error('❌ Error en pre-push hook:', error.message);
      process.exit(1);
    }
  } else {
    console.log('ℹ️ No hay commits pendientes de push');
  }
}

// Ejecutar el hook
try {
  prePushHook();
} catch (error) {
  console.error('❌ Error en pre-push hook:', error.message);
  process.exit(1);
}
