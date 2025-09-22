#!/usr/bin/env node

/**
 * Script de deploy completo
 * Actualiza versión y hace push automáticamente
 */

import { deployVersionUpdate } from './deploy-version-update.js';
import { execSync } from 'child_process';
import path from 'path';

const projectRoot = path.join(process.cwd());

console.log('🚀 Iniciando deploy completo...');

try {
  // 1. Actualizar versión
  console.log('📦 Paso 1: Actualizando versión...');
  deployVersionUpdate();
  
  // 2. Hacer commit de la versión
  console.log('\n📝 Paso 2: Haciendo commit de versión...');
  execSync('git commit -m "Deploy: Actualización automática de versión"', { 
    cwd: projectRoot,
    stdio: 'inherit' 
  });
  
  // 3. Hacer push
  console.log('\n🚀 Paso 3: Haciendo push al repositorio...');
  execSync('git push', { 
    cwd: projectRoot,
    stdio: 'inherit' 
  });
  
  console.log('\n🎉 ¡Deploy completado exitosamente!');
  console.log('✅ Versión actualizada y desplegada');
  
} catch (error) {
  console.error('❌ Error durante el deploy:', error.message);
  process.exit(1);
}
