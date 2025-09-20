#!/usr/bin/env node

/**
 * Script de inicialización para sistema de versionado automático
 * Configura Git hooks y actualiza la versión inicial
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Inicializando sistema de versionado automático...\n');

// Función para verificar requisitos
function checkRequirements() {
  console.log('🔍 Verificando requisitos...');
  
  try {
    // Verificar Git
    execSync('git --version', { stdio: 'pipe' });
    console.log('✅ Git disponible');
    
    // Verificar Node.js
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    console.log(`✅ Node.js disponible: ${nodeVersion}`);
    
    // Verificar que estamos en un repositorio Git
    execSync('git rev-parse --git-dir', { cwd: projectRoot, stdio: 'pipe' });
    console.log('✅ Repositorio Git detectado');
    
    return true;
  } catch (error) {
    console.error('❌ Requisitos no cumplidos:', error.message);
    return false;
  }
}

// Función para configurar Git hooks
function setupGitHooks() {
  console.log('\n🔧 Configurando Git hooks...');
  
  try {
    execSync('node scripts/setup-git-hooks.js', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
    console.log('✅ Git hooks configurados');
    return true;
  } catch (error) {
    console.error('❌ Error configurando Git hooks:', error.message);
    return false;
  }
}

// Función para actualizar versión inicial
function updateInitialVersion() {
  console.log('\n📦 Actualizando versión inicial...');
  
  try {
    execSync('node scripts/auto-update-version.js', { 
      cwd: projectRoot, 
      stdio: 'inherit' 
    });
    console.log('✅ Versión inicial actualizada');
    return true;
  } catch (error) {
    console.error('❌ Error actualizando versión:', error.message);
    return false;
  }
}

// Función para crear archivo de documentación
function createDocumentation() {
  console.log('\n📚 Creando documentación...');
  
  const docContent = `# Sistema de Versionado Automático

## Descripción
Este proyecto incluye un sistema automático de versionado que actualiza la versión en cada commit de Git.

## Archivos Actualizados Automáticamente
- \`package.json\` - Versión principal
- \`VERSION.md\` - Historial de versiones
- \`VERSION.txt\` - Información de versión simple
- \`build-info.json\` - Información de build
- Archivos de interfaz (Directorio.tsx, MainMenu.tsx, MeetingView.tsx)

## Scripts Disponibles
- \`npm run auto-update-version\` - Actualizar versión manualmente
- \`npm run setup-git-hooks\` - Configurar Git hooks
- \`npm run commit-with-version\` - Commit con actualización de versión

## Git Hooks Configurados
- **pre-commit**: Actualiza automáticamente la versión antes de cada commit

## Funcionamiento
1. Cada vez que haces un commit, el hook pre-commit se ejecuta automáticamente
2. Se incrementa la versión patch (x.x.X)
3. Se actualiza la fecha de compilación
4. Se actualizan todos los archivos de versión
5. Los archivos se agregan automáticamente al commit

## Configuración
El sistema se configura automáticamente al ejecutar:
\`\`\`bash
node scripts/init-auto-versioning.js
\`\`\`

## Verificación
Para verificar que todo funciona:
\`\`\`bash
npm run verify-sync
\`\`\`

---
*Generado automáticamente el ${new Date().toLocaleString('es-ES')}*
`;

  const docPath = path.join(projectRoot, 'AUTO_VERSIONING.md');
  fs.writeFileSync(docPath, docContent);
  console.log('✅ Documentación creada: AUTO_VERSIONING.md');
}

// Función para mostrar resumen
function showSummary() {
  console.log('\n🎉 ¡Sistema de versionado automático configurado exitosamente!');
  console.log('\n📋 Resumen de la configuración:');
  console.log('   ✅ Git hooks configurados');
  console.log('   ✅ Versión inicial actualizada');
  console.log('   ✅ Scripts de versionado disponibles');
  console.log('   ✅ Documentación creada');
  
  console.log('\n🚀 Próximos pasos:');
  console.log('   1. Hacer un commit para probar la actualización automática:');
  console.log('      git add .');
  console.log('      git commit -m "Configuración de versionado automático"');
  console.log('   2. Verificar que la versión se actualiza automáticamente');
  console.log('   3. Los archivos de versión se incluirán automáticamente en cada commit');
  
  console.log('\n📚 Comandos útiles:');
  console.log('   - npm run auto-update-version  # Actualizar versión manualmente');
  console.log('   - npm run verify-sync          # Verificar sincronización');
  console.log('   - npm run setup-git-hooks      # Reconfigurar hooks');
  
  console.log('\n📖 Documentación: AUTO_VERSIONING.md');
}

// Función principal
function main() {
  console.log('🔧 Inicializando sistema de versionado automático...\n');
  
  // Verificar requisitos
  if (!checkRequirements()) {
    console.log('\n❌ No se pueden cumplir los requisitos. Abortando...');
    process.exit(1);
  }
  
  // Configurar Git hooks
  if (!setupGitHooks()) {
    console.log('\n❌ Error configurando Git hooks. Abortando...');
    process.exit(1);
  }
  
  // Actualizar versión inicial
  if (!updateInitialVersion()) {
    console.log('\n❌ Error actualizando versión inicial. Abortando...');
    process.exit(1);
  }
  
  // Crear documentación
  createDocumentation();
  
  // Mostrar resumen
  showSummary();
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    process.exit(1);
  }
}

export { main as initAutoVersioning };
