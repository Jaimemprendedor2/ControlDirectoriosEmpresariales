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

// Obtener fecha y hora actual en formato correcto
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hours = String(now.getHours()).padStart(2, '0');
const minutes = String(now.getMinutes()).padStart(2, '0');
const seconds = String(now.getSeconds()).padStart(2, '0');

const dateString = `${year}-${month}-${day}`;
const timeString = `${hours}:${minutes}:${seconds}`;
const fullDateTime = `${dateString} ${timeString}`;
const isoDateTime = now.toISOString();

console.log(`📅 Fecha: ${dateString}`);
console.log(`🕐 Hora: ${timeString}`);
console.log(`🌐 ISO: ${isoDateTime}`);

// Actualizar package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ package.json actualizado a v${newVersion}`);

// Actualizar VERSION.md
const versionMdPath = path.join(projectRoot, 'VERSION.md');
if (fs.existsSync(versionMdPath)) {
  let content = fs.readFileSync(versionMdPath, 'utf8');
  
  // Crear nueva entrada con formato mejorado
  const newEntry = `## v${newVersion} - [${dateString} ${timeString}]

- **ACTUALIZACIÓN AUTOMÁTICA**: Versión actualizada automáticamente
- **FECHA**: ${dateString}
- **HORA**: ${timeString}
- **TIMESTAMP**: ${isoDateTime}

`;

  // Agregar nueva entrada al inicio
  content = newEntry + content;
  
  // Actualizar línea "Última actualización" al final del archivo
  const lastUpdatePattern = /\*Última actualización: .*?\*/;
  const newLastUpdateLine = `*Última actualización: ${dateString} ${timeString}*`;
  
  if (lastUpdatePattern.test(content)) {
    content = content.replace(lastUpdatePattern, newLastUpdateLine);
  } else {
    // Si no existe la línea, agregarla al final
    content += `\n${newLastUpdateLine}\n`;
  }
  
  fs.writeFileSync(versionMdPath, content);
  console.log(`✅ VERSION.md actualizado con fecha y hora correctas`);
}

// Actualizar archivos de interfaz con fecha de compilación
const interfaceFiles = ['src/pages/Directorio.tsx', 'src/pages/MainMenu.tsx', 'src/pages/MeetingView.tsx'];
interfaceFiles.forEach(filePath => {
  const fullPath = path.join(projectRoot, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Actualizar versión
    content = content.replace(/v\d+\.\d+\.\d+/g, `v${newVersion}`);
    
    // Actualizar fecha de compilación si existe
    const buildDatePattern = /const buildDate = new Date\('.*?'\);/;
    const newBuildDateLine = `const buildDate = new Date('${isoDateTime}'); // Actualizado automáticamente`;
    
    if (buildDatePattern.test(content)) {
      content = content.replace(buildDatePattern, newBuildDateLine);
    }
    
    // Buscar y actualizar cualquier referencia a fecha de compilación
    const datePattern = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/g;
    content = content.replace(datePattern, fullDateTime);
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ ${filePath} actualizado con versión y fecha`);
  }
});

// Actualizar archivo de versión en componentes si existe
const versionComponentPath = path.join(projectRoot, 'src/components/TimerNavigationBar.tsx');
if (fs.existsSync(versionComponentPath)) {
  let content = fs.readFileSync(versionComponentPath, 'utf8');
  content = content.replace(/v\d+\.\d+\.\d+/g, `v${newVersion}`);
  fs.writeFileSync(versionComponentPath, content);
  console.log(`✅ TimerNavigationBar.tsx actualizado`);
}

console.log(`\n🎉 Versión actualizada de ${currentVersion} a ${newVersion}`);
console.log(`📅 Fecha y hora: ${fullDateTime}`);
console.log(`🕐 Timestamp ISO: ${isoDateTime}`);
