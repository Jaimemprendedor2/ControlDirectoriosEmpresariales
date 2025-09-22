#!/usr/bin/env node

/**
 * Script para configurar versionado automático solo en deploy
 * Se activa en pre-push (cuando haces push al repositorio)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Configurando versionado automático para deploy...\n');

// Función para crear el hook de pre-push
function createPrePushHook() {
  const hookPath = path.join(projectRoot, '.git', 'hooks', 'pre-push');
  const hookContent = `#!/bin/sh
# Hook de pre-push - Versionado automático solo en deploy

echo "🚀 Detectando deploy - Actualizando versión automáticamente..."

# Verificar si hay cambios para deploy
if git diff --name-only HEAD~1 HEAD | grep -q "src/\\|package.json\\|VERSION.md"; then
  echo "📦 Cambios detectados - Ejecutando versionado automático..."
  node scripts/deploy-version-update.js
  
  if [ $? -eq 0 ]; then
    echo "✅ Versión actualizada para deploy"
    echo "📝 Archivos preparados para push"
  else
    echo "❌ Error en versionado automático"
    exit 1
  fi
else
  echo "ℹ️ No hay cambios significativos - Saltando versionado automático"
fi

exit 0
`;

  fs.writeFileSync(hookPath, hookContent);
  
  // Hacer el hook ejecutable en sistemas Unix
  try {
    execSync(`chmod +x "${hookPath}"`, { cwd: projectRoot });
  } catch (error) {
    // En Windows no es necesario
  }
  
  console.log('✅ Hook de pre-push creado exitosamente');
}

// Función para crear script de deploy manual
function createDeployScript() {
  const scriptPath = path.join(projectRoot, 'scripts', 'deploy.js');
  const scriptContent = `#!/usr/bin/env node

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
  console.log('\\n📝 Paso 2: Haciendo commit de versión...');
  execSync('git commit -m "Deploy: Actualización automática de versión"', { 
    cwd: projectRoot,
    stdio: 'inherit' 
  });
  
  // 3. Hacer push
  console.log('\\n🚀 Paso 3: Haciendo push al repositorio...');
  execSync('git push', { 
    cwd: projectRoot,
    stdio: 'inherit' 
  });
  
  console.log('\\n🎉 ¡Deploy completado exitosamente!');
  console.log('✅ Versión actualizada y desplegada');
  
} catch (error) {
  console.error('❌ Error durante el deploy:', error.message);
  process.exit(1);
}
`;

  fs.writeFileSync(scriptPath, scriptContent);
  console.log('✅ Script de deploy manual creado');
}

// Función para crear script de versionado por tipo
function createVersionTypeScript() {
  const scriptPath = path.join(projectRoot, 'scripts', 'version-deploy.js');
  const scriptContent = `#!/usr/bin/env node

/**
 * Script de versionado por tipo para deploy
 * Uso: node scripts/version-deploy.js [patch|minor|major]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const versionType = process.argv[2] || 'patch';
const projectRoot = path.join(process.cwd());

console.log(\`🚀 Deploy con versionado \${versionType}\`);

try {
  // Leer versión actual
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  
  console.log(\`📦 Versión actual: \${currentVersion}\`);
  
  // Incrementar según el tipo
  let newVersion;
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]);
  
  switch (versionType) {
    case 'major':
      newVersion = \`\${major + 1}.0.0\`;
      break;
    case 'minor':
      newVersion = \`\${major}.\${minor + 1}.0\`;
      break;
    case 'patch':
    default:
      newVersion = \`\${major}.\${minor}.\${patch + 1}\`;
      break;
  }
  
  console.log(\`🔄 Nueva versión: \${newVersion}\`);
  
  // Actualizar package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\\n');
  
  // Actualizar archivos de interfaz
  const filesToUpdate = [
    'src/pages/Directorio.tsx',
    'src/pages/MainMenu.tsx',
    'src/pages/MeetingView.tsx'
  ];
  
  filesToUpdate.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const versionPattern = /v\\d+\\.\\d+\\.\\d+/g;
      content = content.replace(versionPattern, \`v\${newVersion}\`);
      fs.writeFileSync(fullPath, content);
    }
  });
  
  // Hacer commit y push
  execSync('git add .', { cwd: projectRoot, stdio: 'inherit' });
  execSync(\`git commit -m "Deploy: Versión \${newVersion} - \${versionType} update"\`, { 
    cwd: projectRoot, 
    stdio: 'inherit' 
  });
  execSync('git push', { cwd: projectRoot, stdio: 'inherit' });
  
  console.log('\\n🎉 ¡Deploy completado!');
  console.log(\`✅ Versión \${newVersion} desplegada\`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
`;

  fs.writeFileSync(scriptPath, scriptContent);
  console.log('✅ Script de versionado por tipo creado');
}

// Función principal
function setupDeployVersioning() {
  try {
    console.log('🔧 Configurando versionado automático para deploy...\n');
    
    // Crear hooks y scripts
    createPrePushHook();
    createDeployScript();
    createVersionTypeScript();
    
    console.log('\n🎉 ¡Sistema de versionado para deploy configurado exitosamente!');
    console.log('\n📋 Características:');
    console.log('  ✅ Versionado automático solo en deploy (pre-push)');
    console.log('  ✅ No interfiere con commits normales');
    console.log('  ✅ Scripts de deploy manual disponibles');
    console.log('  ✅ Versionado por tipo (patch/minor/major)');
    
    console.log('\n💡 Comandos disponibles:');
    console.log('  • git push (versionado automático en deploy)');
    console.log('  • node scripts/deploy.js (deploy completo)');
    console.log('  • node scripts/version-deploy.js patch (deploy con patch)');
    console.log('  • node scripts/version-deploy.js minor (deploy con minor)');
    console.log('  • node scripts/version-deploy.js major (deploy con major)');
    
  } catch (error) {
    console.error('❌ Error configurando versionado para deploy:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDeployVersioning();
}

export { setupDeployVersioning };
