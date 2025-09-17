#!/usr/bin/env node

/**
 * Script de verificación de sincronización de versiones
 * Verifica que todos los archivos tengan la misma versión
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Verificando sincronización de versiones...\n');

// Función para extraer versión de package.json
function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('❌ Error leyendo package.json:', error.message);
    return null;
  }
}

// Función para extraer versión de Directorio.tsx
function getDirectorioVersion() {
  try {
    const content = fs.readFileSync(path.join(projectRoot, 'src', 'pages', 'Directorio.tsx'), 'utf8');
    const match = content.match(/v(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('❌ Error leyendo Directorio.tsx:', error.message);
    return null;
  }
}

// Función para extraer versión de VERSION.md
function getVersionMdVersion() {
  try {
    const content = fs.readFileSync(path.join(projectRoot, 'VERSION.md'), 'utf8');
    const match = content.match(/## v(\d+\.\d+\.\d+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('❌ Error leyendo VERSION.md:', error.message);
    return null;
  }
}

// Función principal de verificación
function verifySync() {
  const packageVersion = getPackageVersion();
  const directorioVersion = getDirectorioVersion();
  const versionMdVersion = getVersionMdVersion();
  
  console.log('📋 Versiones encontradas:');
  console.log(`   package.json: ${packageVersion || 'ERROR'}`);
  console.log(`   Directorio.tsx: ${directorioVersion || 'ERROR'}`);
  console.log(`   VERSION.md: ${versionMdVersion || 'ERROR'}\n`);
  
  if (!packageVersion || !directorioVersion || !versionMdVersion) {
    console.error('❌ Error: No se pudieron leer todas las versiones');
    process.exit(1);
  }
  
  const allVersions = [packageVersion, directorioVersion, versionMdVersion];
  const uniqueVersions = [...new Set(allVersions)];
  
  if (uniqueVersions.length === 1) {
    console.log('✅ ¡Sincronización perfecta!');
    console.log(`🎉 Todas las versiones están sincronizadas en: v${packageVersion}`);
    console.log('\n📊 Estado de sincronización:');
    console.log('   ✅ package.json');
    console.log('   ✅ Directorio.tsx');
    console.log('   ✅ VERSION.md');
    console.log('\n🚀 Listo para producción');
    return true;
  } else {
    console.error('❌ ¡DESINCRONIZACIÓN DETECTADA!');
    console.error('🔧 Versiones diferentes encontradas:');
    uniqueVersions.forEach(version => {
      const count = allVersions.filter(v => v === version).length;
      console.error(`   v${version}: ${count} archivo(s)`);
    });
    console.error('\n💡 Ejecuta: npm run force-version-sync');
    process.exit(1);
  }
}

// Ejecutar verificación
verifySync();
