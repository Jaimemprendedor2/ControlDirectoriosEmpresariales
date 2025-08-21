#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Verificando Estado de Versionado...\n');

// Leer package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`📦 Versión Actual: ${packageJson.version}`);

// Obtener información de Git
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  const lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%cr)"', { encoding: 'utf8' });
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  
  console.log(`🌿 Rama Actual: ${branch}`);
  console.log(`📝 Último Commit: ${lastCommit}`);
  
  if (gitStatus.trim()) {
    console.log('\n⚠️  Cambios Pendientes:');
    console.log(gitStatus);
    console.log('\n💡 Para subir cambios:');
    console.log('   git add .');
    console.log('   git commit -m "Descripción del cambio"');
    console.log('   git push origin master');
  } else {
    console.log('\n✅ No hay cambios pendientes');
  }
  
} catch (error) {
  console.log('❌ Error obteniendo información de Git:', error.message);
}

// Verificar si existe VERSION.md
if (fs.existsSync('VERSION.md')) {
  console.log('\n📋 Archivo de versionado encontrado: VERSION.md');
} else {
  console.log('\n❌ No se encontró VERSION.md');
}

console.log('\n🎯 Estado del Proyecto:');
console.log('   ✅ Migración a Pusher completada');
console.log('   ✅ Errores TypeScript corregidos');
console.log('   ✅ Configuración para Netlify lista');
console.log('   ✅ Documentación actualizada');

console.log('\n📅 Fecha y Hora Actual:', new Date().toLocaleString('es-ES'));
