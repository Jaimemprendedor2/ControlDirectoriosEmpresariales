#!/usr/bin/env node

/**
 * Script para configurar hooks de Git inteligentes que evitan bucles infinitos
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔧 Configurando hooks de Git inteligentes...\n');

// Función para crear el hook de pre-commit
function createPreCommitHook() {
  const hookPath = path.join(projectRoot, '.git', 'hooks', 'pre-commit');
  const hookContent = `#!/bin/sh
# Hook de pre-commit inteligente que evita bucles infinitos

# Verificar si el commit es de versionado automático
LAST_COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")

if echo "$LAST_COMMIT_MSG" | grep -q "ACTUALIZACIÓN AUTOMÁTICA\\|Actualización automática\\|auto-update-version"; then
  echo "🚫 Detectado commit de versionado automático - evitando bucle infinito"
  echo "✅ No se ejecutará actualización automática"
  exit 0
fi

# Verificar si hay cambios en archivos de versión
if git diff --cached --name-only | grep -q "package.json\\|VERSION.md\\|src/pages/.*\\.tsx"; then
  echo "🚀 Ejecutando actualización inteligente de versión..."
  node scripts/smart-version-update.js
  
  # Agregar archivos actualizados al staging
  git add package.json VERSION.md src/pages/Directorio.tsx src/pages/MainMenu.tsx src/pages/MeetingView.tsx 2>/dev/null || true
else
  echo "ℹ️ No hay cambios en archivos de versión - saltando actualización automática"
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
  
  console.log('✅ Hook de pre-commit creado exitosamente');
}

// Función para crear el hook de post-commit
function createPostCommitHook() {
  const hookPath = path.join(projectRoot, '.git', 'hooks', 'post-commit');
  const hookContent = `#!/bin/sh
# Hook de post-commit para verificar versionado

echo "🔍 Verificando estado del versionado..."
echo "📦 Versión actual: $(node -p "require('./package.json').version")"
echo "✅ Hook de post-commit completado"
`;

  fs.writeFileSync(hookPath, hookContent);
  
  // Hacer el hook ejecutable en sistemas Unix
  try {
    execSync(`chmod +x "${hookPath}"`, { cwd: projectRoot });
  } catch (error) {
    // En Windows no es necesario
  }
  
  console.log('✅ Hook de post-commit creado exitosamente');
}

// Función para crear script de versionado manual
function createManualVersionScript() {
  const scriptPath = path.join(projectRoot, 'scripts', 'manual-version-update.js');
  const scriptContent = `#!/usr/bin/env node

/**
 * Script para actualización manual de versión
 * Uso: node scripts/manual-version-update.js [patch|minor|major]
 */

import { smartUpdateVersion, incrementVersion } from './smart-version-update.js';
import fs from 'fs';
import path from 'path';

const versionType = process.argv[2] || 'patch';
const projectRoot = path.join(process.cwd());

console.log(\`🚀 Actualización manual de versión: \${versionType}\`);

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
  
  console.log('✅ Versión actualizada manualmente');
  console.log('💡 Recuerda hacer commit de los cambios');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
`;

  fs.writeFileSync(scriptPath, scriptContent);
  console.log('✅ Script de versionado manual creado');
}

// Función principal
function setupSmartHooks() {
  try {
    console.log('🔧 Configurando sistema de versionado inteligente...\n');
    
    // Crear hooks
    createPreCommitHook();
    createPostCommitHook();
    createManualVersionScript();
    
    console.log('\n🎉 ¡Sistema de versionado inteligente configurado exitosamente!');
    console.log('\n📋 Características:');
    console.log('  ✅ Evita bucles infinitos de versionado');
    console.log('  ✅ Solo actualiza cuando es necesario');
    console.log('  ✅ Detecta commits de versionado automático');
    console.log('  ✅ Script de versionado manual disponible');
    
    console.log('\n💡 Comandos disponibles:');
    console.log('  • git commit -m "mensaje" (versionado automático inteligente)');
    console.log('  • node scripts/manual-version-update.js patch');
    console.log('  • node scripts/manual-version-update.js minor');
    console.log('  • node scripts/manual-version-update.js major');
    
  } catch (error) {
    console.error('❌ Error configurando hooks:', error.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSmartHooks();
}

export { setupSmartHooks };
