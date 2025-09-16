#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔧 Configurando Git hooks para sincronización automática...\n');

try {
  // Verificar que estamos en un repositorio git
  if (!fs.existsSync('.git')) {
    console.error('❌ No se detectó un repositorio Git');
    process.exit(1);
  }

  // Configurar el directorio de hooks personalizado
  console.log('📁 Configurando directorio de hooks...');
  execSync('git config core.hooksPath .githooks', { stdio: 'inherit' });
  console.log('✅ Directorio de hooks configurado: .githooks');

  // Hacer ejecutable el hook de pre-commit (en sistemas Unix)
  const preCommitPath = '.githooks/pre-commit';
  if (fs.existsSync(preCommitPath)) {
    try {
      execSync(`chmod +x ${preCommitPath}`);
      console.log('✅ Hook pre-commit configurado como ejecutable');
    } catch (error) {
      console.log('⚠️ No se pudo hacer ejecutable el hook (probablemente Windows)');
    }
  }

  console.log('\n🎉 ¡Git hooks configurados exitosamente!');
  console.log('\n📋 Hooks activos:');
  console.log('   - pre-commit: Sincronización automática de versión');
  console.log('\n💡 Uso:');
  console.log('   - git commit: Se ejecutará automáticamente la sincronización');
  console.log('   - npm run auto-version: Detección manual de versión');
  console.log('   - npm run sync-version: Sincronización manual');

} catch (error) {
  console.error('❌ Error configurando hooks:', error.message);
  process.exit(1);
}
