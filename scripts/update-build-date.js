#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Función para actualizar la fecha de build en Home.tsx
function updateBuildDate() {
  const homePath = path.join(process.cwd(), 'src', 'pages', 'Home.tsx');
  
  if (!fs.existsSync(homePath)) {
    console.error('❌ No se encontró el archivo Home.tsx');
    return;
  }

  let content = fs.readFileSync(homePath, 'utf8');
  
  // Obtener fecha actual
  const now = new Date();
  const dateString = now.toISOString();
  
  // Reemplazar la línea con la fecha hardcodeada
  const oldPattern = /const buildDate = new Date\('.*?'\);/;
  const newLine = `const buildDate = new Date('${dateString}'); // Fecha actualizada automáticamente`;
  
  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newLine);
    fs.writeFileSync(homePath, content, 'utf8');
    console.log('✅ Fecha de build actualizada en Home.tsx');
  } else {
    console.log('⚠️ No se encontró la línea de fecha hardcodeada');
  }
}

// Función para actualizar VERSION.md
function updateVersionFile() {
  const versionPath = path.join(process.cwd(), 'VERSION.md');
  
  if (!fs.existsSync(versionPath)) {
    console.error('❌ No se encontró el archivo VERSION.md');
    return;
  }

  let content = fs.readFileSync(versionPath, 'utf8');
  
  // Obtener fecha actual
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
  
  // Actualizar la fecha de la versión actual
  const versionPattern = /## 🚀 Versión 1\.6\.1 - \[.*?\]/;
  const newVersionLine = `## 🚀 Versión 1.6.1 - [${dateString} ${timeString}]`;
  
  if (versionPattern.test(content)) {
    content = content.replace(versionPattern, newVersionLine);
  }
  
  // Actualizar la última actualización
  const updatePattern = /\*Última actualización: .*?\*/;
  const newUpdateLine = `*Última actualización: ${dateString} ${timeString}*`;
  
  if (updatePattern.test(content)) {
    content = content.replace(updatePattern, newUpdateLine);
  }
  
  fs.writeFileSync(versionPath, content, 'utf8');
  console.log('✅ Fecha actualizada en VERSION.md');
}

// Ejecutar las actualizaciones
try {
  updateBuildDate();
  updateVersionFile();
  console.log('🎉 Fechas actualizadas correctamente');
} catch (error) {
  console.error('❌ Error actualizando fechas:', error.message);
}
