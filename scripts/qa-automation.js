#!/usr/bin/env node

/**
 * Script de automatización para QA de Sincronización
 * Proporciona comandos y verificaciones automatizadas
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 QA de Sincronización - Herramientas de Automatización');
console.log('=======================================================\n');

// Verificar que el servidor esté ejecutándose
function checkServerRunning() {
  console.log('🌐 Verificando servidor de desarrollo...');
  console.log('   Asegúrate de tener "npm run dev" ejecutándose en http://localhost:5173');
  console.log('   Si no está ejecutándose, abre una nueva terminal y ejecuta: npm run dev\n');
}

// Generar datos de prueba
function generateTestData() {
  console.log('📊 Generando datos de prueba...');
  
  const testData = {
    directories: [
      {
        name: "QA Test Meeting 1",
        stages: [
          { title: "Presentación", duration: 5 },
          { title: "Discusión", duration: 10 },
          { title: "Conclusiones", duration: 3 }
        ]
      },
      {
        name: "QA Test Meeting 2", 
        stages: [
          { title: "Introducción", duration: 3 },
          { title: "Desarrollo", duration: 15 },
          { title: "Cierre", duration: 2 }
        ]
      }
    ]
  };
  
  console.log('✅ Datos de prueba generados:');
  console.log('   - Directorio 1: 3 etapas (5min, 10min, 3min)');
  console.log('   - Directorio 2: 3 etapas (3min, 15min, 2min)');
  console.log('   - Usa estos datos para configurar tus directorios de prueba\n');
  
  return testData;
}

// Verificaciones de consola
function generateConsoleChecks() {
  console.log('🔧 Comandos de verificación para DevTools Console:');
  console.log('==================================================\n');
  
  console.log('📋 Verificar estado del directorio:');
  console.log('```javascript');
  console.log('// Estado actual del directorio');
  console.log('console.log("Directorio ID:", localStorage.getItem("currentDirectoryId"));');
  console.log('console.log("Tiempo actual:", localStorage.getItem("currentTimeLeft"));');
  console.log('console.log("Etapa actual:", localStorage.getItem("currentStageIndex"));');
  console.log('console.log("Timer corriendo:", localStorage.getItem("isTimerRunning"));');
  console.log('```\n');
  
  console.log('📋 Verificar sincronización:');
  console.log('```javascript');
  console.log('// Verificar servicio de sincronización');
  console.log('console.log("Sync Service:", window.syncService?.isConnected());');
  console.log('console.log("Estado conexión:", window.syncService?.getState());');
  console.log('```\n');
  
  console.log('📋 Filtrar mensajes de sincronización:');
  console.log('```javascript');
  console.log('// En DevTools Console, filtrar por:');
  console.log('// - SYNC_REQUEST');
  console.log('// - SYNC_RESPONSE'); 
  console.log('// - syncAll');
  console.log('// - setTime');
  console.log('// - setStage');
  console.log('```\n');
}

// Simulador de pruebas
function generateTestScenarios() {
  console.log('🎯 Escenarios de Prueba Automatizados:');
  console.log('=====================================\n');
  
  const scenarios = [
    {
      name: "Sincronización Básica",
      steps: [
        "1. Abrir directorio QA Test Meeting 1",
        "2. Iniciar directorio (se abre popup automáticamente)",
        "3. Verificar que popup muestra 5:00 (primera etapa)",
        "4. Pausar en directorio → verificar pausa en popup",
        "5. Reanudar en popup → verificar reanudación en directorio"
      ]
    },
    {
      name: "Hidratación de Estado", 
      steps: [
        "1. Con popup abierto, cerrar popup completamente",
        "2. Reabrir popup desde directorio",
        "3. Verificar que se sincroniza automáticamente",
        "4. Buscar mensajes SYNC_REQUEST/SYNC_RESPONSE en consola"
      ]
    },
    {
      name: "Manejo de Popups Bloqueados",
      steps: [
        "1. Configurar navegador para bloquear popups",
        "2. Intentar abrir popup → verificar banner de error",
        "3. Permitir popups → hacer clic en 'Reintentar'",
        "4. Verificar que popup se abre y sincroniza"
      ]
    },
    {
      name: "Prueba de Drift",
      steps: [
        "1. Iniciar timer en directorio y popup",
        "2. Anotar tiempo inicial en ambos",
        "3. Cambiar a otra aplicación (60 segundos)",
        "4. Volver y verificar diferencia ≤ 1 segundo"
      ]
    },
    {
      name: "Aislamiento por Directorio",
      steps: [
        "1. Con directorio 1 iniciado y popup abierto",
        "2. Cambiar a directorio 2",
        "3. Verificar que popup se actualiza completamente",
        "4. Verificar que no hay interferencia entre directorios"
      ]
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`📋 ${index + 1}. ${scenario.name}:`);
    scenario.steps.forEach(step => {
      console.log(`   ${step}`);
    });
    console.log('');
  });
}

// Generar reporte de QA
function generateQAReport() {
  console.log('📊 Plantilla de Reporte de QA:');
  console.log('==============================\n');
  
  const reportTemplate = `
FECHA: ___________
TESTER: ___________
NAVEGADOR: ___________
VERSIÓN: ___________

RESULTADOS POR FASE:
===================

✅ FASE 1 - Sincronización Básica: [ ] APROBADO [ ] FALLIDO
   Observaciones: ___________

✅ FASE 2 - Hidratación: [ ] APROBADO [ ] FALLIDO  
   Observaciones: ___________

✅ FASE 3 - Popups Bloqueados: [ ] APROBADO [ ] FALLIDO
   Observaciones: ___________

✅ FASE 4 - Prueba de Drift: [ ] APROBADO [ ] FALLIDO
   Observaciones: ___________

✅ FASE 5 - Aislamiento: [ ] APROBADO [ ] FALLIDO
   Observaciones: ___________

PROBLEMAS ENCONTRADOS:
=====================
- [ ] Ninguno
- [ ] Sincronización lenta (> 1 segundo)
- [ ] Popup no se sincroniza al reabrir
- [ ] Banner de popup bloqueado no aparece
- [ ] Drift excesivo (> 1 segundo)
- [ ] Interferencia entre directorios
- [ ] Otros: ___________

SOLUCIONES APLICADAS:
====================
- [ ] Ninguna requerida
- [ ] Recarga de página
- [ ] Limpieza de localStorage
- [ ] Reinicio de servidor
- [ ] Otros: ___________

ESTADO FINAL: [ ] ✅ APROBADO [ ] ❌ REQUIERE CORRECCIONES

OBSERVACIONES ADICIONALES:
=========================
___________
  `;
  
  console.log(reportTemplate);
}

// Función principal
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node scripts/qa-automation.js [opciones]');
    console.log('');
    console.log('Opciones:');
    console.log('  --check-server    Verificar servidor');
    console.log('  --test-data       Generar datos de prueba');
    console.log('  --console-checks  Mostrar comandos de consola');
    console.log('  --scenarios       Mostrar escenarios de prueba');
    console.log('  --report          Generar plantilla de reporte');
    console.log('  --all             Ejecutar todas las opciones');
    console.log('');
    return;
  }
  
  if (args.includes('--all') || args.length === 0) {
    checkServerRunning();
    generateTestData();
    generateConsoleChecks();
    generateTestScenarios();
    generateQAReport();
  }
  
  if (args.includes('--check-server')) {
    checkServerRunning();
  }
  
  if (args.includes('--test-data')) {
    generateTestData();
  }
  
  if (args.includes('--console-checks')) {
    generateConsoleChecks();
  }
  
  if (args.includes('--scenarios')) {
    generateTestScenarios();
  }
  
  if (args.includes('--report')) {
    generateQAReport();
  }
  
  console.log('🎯 Para ejecutar QA completo:');
  console.log('   1. npm run dev (en terminal separada)');
  console.log('   2. npm run qa-sync');
  console.log('   3. Seguir pasos en scripts/qa-sync.md');
  console.log('');
  console.log('📋 Para más opciones: node scripts/qa-automation.js --help');
}

// Ejecutar si es llamado directamente
main();

export {
  checkServerRunning,
  generateTestData,
  generateConsoleChecks,
  generateTestScenarios,
  generateQAReport
};
