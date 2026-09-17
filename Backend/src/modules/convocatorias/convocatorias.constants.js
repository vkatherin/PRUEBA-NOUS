/**
 * Equivalencia oficial centralizada de tipos de investigación a códigos de convocatoria externa
 */
const TIPOS_INVESTIGACION = [
  { label: "Investigación de creación", codigo: "IC" },
  { label: "Investigación formal", codigo: "IPD" },
  { label: "Investigación formativa", codigo: "IF" },
  { label: "Emprendimiento", codigo: "UE" },
  { label: "Semilleros", codigo: "SEM" },
];

const MAPA_TIPO_INVESTIGACION = {
  "Investigación de creación": "IC",
  "Investigación formal": "IPD",
  "Investigación formativa": "IF",
  "Emprendimiento": "UE",
  "Semilleros": "SEM",
};

function obtenerSiglaTipoInvestigacion(tipo) {
  if (!tipo) return null;
  const limpio = tipo.trim();
  return MAPA_TIPO_INVESTIGACION[limpio] || null;
}

module.exports = {
  TIPOS_INVESTIGACION,
  MAPA_TIPO_INVESTIGACION,
  obtenerSiglaTipoInvestigacion,
};
