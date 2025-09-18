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

  // Crear el directorio .githooks si no existe
  if (!fs.existsSync('.githooks')) {
    fs.mkdirSync('.githooks');
    console.log('✅ Directorio .githooks creado');
  }

  // Crear hook de pre-commit
  const preCommitContent = `#!/bin/sh
# Hook de pre-commit para sincronización automática
echo "🔄 Ejecutando sincronización automática..."
npm run sync-version
`;
  fs.writeFileSync('.githooks/pre-commit', preCommitContent);
  console.log('✅ Hook pre-commit creado');

  // Crear hook de pre-push
  const prePushContent = `#!/bin/sh
# Hook de pre-push para actualización automática de versión y fecha
echo "🚀 Ejecutando pre-push hook..."
node scripts/pre-push-hook.js
`;
  fs.writeFileSync('.githooks/pre-push', prePushContent);
  console.log('✅ Hook pre-push creado');

  // Hacer ejecutables los hooks (en sistemas Unix)
  const hooks = ['.githooks/pre-commit', '.githooks/pre-push'];
  hooks.forEach(hookPath => {
    if (fs.existsSync(hookPath)) {
      try {
        execSync(`chmod +x ${hookPath}`);
        console.log(`✅ Hook ${hookPath} configurado como ejecutable`);
      } catch (error) {
        console.log(`⚠️ No se pudo hacer ejecutable ${hookPath} (probablemente Windows)`);
      }
    }
  });

  console.log('\n🎉 ¡Git hooks configurados exitosamente!');
  console.log('\n📋 Hooks activos:');
  console.log('   - pre-commit: Sincronización automática de versión');
  console.log('   - pre-push: Actualización automática de versión y fecha');
  console.log('\n💡 Uso:');
  console.log('   - git commit: Se ejecutará automáticamente la sincronización');
  console.log('   - git push: Se actualizará automáticamente la versión y fecha');
  console.log('   - npm run auto-version: Detección manual de versión');
  console.log('   - npm run sync-version: Sincronización manual');

} catch (error) {
  console.error('❌ Error configurando hooks:', error.message);
  process.exit(1);
}
