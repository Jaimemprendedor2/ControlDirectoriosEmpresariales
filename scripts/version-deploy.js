#!/usr/bin/env node

/**
 * Script de versionado por tipo para deploy
 * Uso: node scripts/version-deploy.js [patch|minor|major]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const versionType = process.argv[2] || 'patch';
const projectRoot = path.join(process.cwd());

console.log(`🚀 Deploy con versionado ${versionType}`);

try {
  // Leer versión actual
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const currentVersion = packageJson.version;
  
  console.log(`📦 Versión actual: ${currentVersion}`);
  
  // Incrementar según el tipo
  let newVersion;
  const parts = currentVersion.split('.');
  const major = parseInt(parts[0]);
  const minor = parseInt(parts[1]);
  const patch = parseInt(parts[2]);
  
  switch (versionType) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }
  
  console.log(`🔄 Nueva versión: ${newVersion}`);
  
  // Actualizar package.json
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
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
      const versionPattern = /v\d+\.\d+\.\d+/g;
      content = content.replace(versionPattern, `v${newVersion}`);
      fs.writeFileSync(fullPath, content);
    }
  });
  
  // Hacer commit y push
  execSync('git add .', { cwd: projectRoot, stdio: 'inherit' });
  execSync(`git commit -m "Deploy: Versión ${newVersion} - ${versionType} update"`, { 
    cwd: projectRoot, 
    stdio: 'inherit' 
  });
  execSync('git push', { cwd: projectRoot, stdio: 'inherit' });
  
  console.log('\n🎉 ¡Deploy completado!');
  console.log(`✅ Versión ${newVersion} desplegada`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
