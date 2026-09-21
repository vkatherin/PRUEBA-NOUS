'use strict';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const pool = require('./connection');

const FORMATOS = [
  { codigo: 'F-GIV001', nombre: 'Anteproyecto de Investigación', categoria: 'Investigación', version: '02', archivo_nombre_original: 'F-GIV001_anteproyecto_investigacion.pdf' },
  { codigo: 'F-GIV003', nombre: 'Protocolo de Investigación Formativa - Programas de Salud', categoria: 'Investigación Formativa', version: '01', archivo_nombre_original: 'F-GIV003_protocolo_investigacion_formativa_salud.pdf' },
  { codigo: 'F-GIV006', nombre: 'Acta de Sustentación de Trabajo de Grado', categoria: 'Semilleros', version: '01', archivo_nombre_original: 'F-GIV006_acta_sustentacion_trabajo_grado.pdf' },
  { codigo: 'F-GIV007', nombre: 'Protocolo de Investigación Formativa', categoria: 'Investigación Formativa', version: '04', archivo_nombre_original: 'F-GIV007_protocolo_investigacion_formativa.pdf' },
  { codigo: 'F-GIV008', nombre: 'Consentimiento Informado - Vicerrectoría de Investigación, Innovación y Creación Artística y Cultural', categoria: 'Ético/Legal', version: '01', archivo_nombre_original: 'F-GIV008_consentimiento_informado.pdf' },
  { codigo: 'F-GIV009', nombre: 'Proyecto de Investigación Formal', categoria: 'Investigación', version: '02', archivo_nombre_original: 'F-GIV009_proyecto_investigacion_formal.pdf' },
  { codigo: 'F-GIV010', nombre: 'Acuerdo de Confidencialidad de Proyecto de Investigación', categoria: 'Ético/Legal', version: '01', archivo_nombre_original: 'F-GIV010_acuerdo_confidencialidad.pdf' },
  { codigo: 'F-GIV015', nombre: 'Protocolo de Emprendimiento como Opción de Grado', categoria: 'Emprendimiento', version: '01', archivo_nombre_original: 'F-GIV015_protocolo_emprendimiento_opcion_grado.pdf' },
  { codigo: 'F-GIV016', nombre: 'Guía Modelo de Negocio', categoria: 'Emprendimiento', version: '01', archivo_nombre_original: 'F-GIV016_guia_modelo_negocio.pdf' }
];

async function seedFormatos() {
  console.log('\n🌱  Seeding Formatos Institucionales...\n');

  let inserted = 0;
  for (const formato of FORMATOS) {
    const archivo_ruta = '/uploads/formatos/' + formato.archivo_nombre_original;

    const [result] = await pool.query(
      `INSERT IGNORE INTO formatos_institucionales 
        (codigo, nombre, categoria, version, archivo_nombre_original, archivo_ruta) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [formato.codigo, formato.nombre, formato.categoria, formato.version, formato.archivo_nombre_original, archivo_ruta]
    );

    if (result.affectedRows > 0) {
      console.log(`  ✅ Insertado: ${formato.codigo} - ${formato.nombre}`);
      inserted++;
    } else {
      console.log(`  ℹ️  Omitido (ya existe): ${formato.codigo} - ${formato.nombre}`);
    }
  }

  console.log(`\n✅  Proceso completado. ${inserted} formatos insertados.\n`);
  await pool.end();
}

seedFormatos().catch((err) => {
  console.error('\n❌  Error al sembrar formatos:', err.message);
  process.exit(1);
});
