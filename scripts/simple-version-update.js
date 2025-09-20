#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Actualizando versión...\n');

// Leer versión actual
const packagePath = path.join(projectRoot, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Versión actual: ${currentVersion}`);

// Incrementar versión
const parts = currentVersion.split('.');
const major = parseInt(parts[0]);
const minor = parseInt(parts[1]);
const patch = parseInt(parts[2]) + 1;
const newVersion = `${major}.${minor}.${patch}`;

console.log(`🔄 Nueva versión: ${newVersion}`);

// Actualizar package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ package.json actualizado a v${newVersion}`);

// Obtener fecha actual
const now = new Date();
const dateTime = now.toISOString().replace('T', ' ').substring(0, 19);

// Actualizar VERSION.md
const versionMdPath = path.join(projectRoot, 'VERSION.md');
if (fs.existsSync(versionMdPath)) {
  let content = fs.readFileSync(versionMdPath, 'utf8');
  const newEntry = `## v${newVersion} - ${dateTime}
- **ACTUALIZACIÓN AUTOMÁTICA**: Versión actualizada automáticamente
- **FECHA**: ${dateTime}

`;
  content = newEntry + content;
  fs.writeFileSync(versionMdPath, content);
  console.log(`✅ VERSION.md actualizado`);
}

// Actualizar archivos de interfaz
const interfaceFiles = ['src/pages/Directorio.tsx', 'src/pages/MainMenu.tsx', 'src/pages/MeetingView.tsx'];
interfaceFiles.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/v\d+\.\d+\.\d+/g, `v${newVersion}`);
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${filePath} actualizado`);
  }
});

console.log(`\n🎉 Versión actualizada de ${currentVersion} a ${newVersion}`);
