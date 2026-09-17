const svc = require("./proyectos.service");

const ok  = (res, data, status = 200) => res.status(status).json(data);
const err = (res, msg, status = 500) => res.status(status).json({ error: msg });

// GET /api/proyectos
async function listar(req, res) {
  try {
    const { estado, tipo, q, convocatoria_id } = req.query;
    const data = await svc.listarProyectos({ estado, tipo, q, convocatoria_id });
    ok(res, data);
  } catch (e) {
    console.error(e);
    err(res, "Error al listar proyectos");
  }
}

// GET /api/proyectos/:id
async function detalle(req, res) {
  try {
    const proyecto = await svc.obtenerProyecto(req.params.id);
    if (!proyecto) return err(res, "Proyecto no encontrado", 404);
    ok(res, proyecto);
  } catch (e) {
    err(res, "Error al obtener proyecto");
  }
}

// POST /api/proyectos
async function crear(req, res) {
  try {
    const { titulo, fecha_inicio, investigador_principal_id } = req.body;
    if (!titulo || !fecha_inicio || !investigador_principal_id) {
      return err(res, "título, fecha_inicio e investigador_principal_id son obligatorios", 400);
    }
    const proyecto = await svc.crearProyecto(req.body);
    ok(res, { ok: true, proyecto }, 201);
  } catch (e) {
    console.error(e);
    err(res, "Error al crear proyecto");
  }
}

// PUT /api/proyectos/:id
async function actualizar(req, res) {
  try {
    const proyecto = await svc.actualizarProyecto(req.params.id, req.body);
    ok(res, { ok: true, proyecto });
  } catch (e) {
    err(res, e.message || "Error al actualizar proyecto");
  }
}

// PATCH /api/proyectos/:id/estado
async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    if (!estado) return err(res, "El campo estado es obligatorio", 400);
    const proyecto = await svc.cambiarEstado(req.params.id, estado);
    ok(res, { ok: true, proyecto });
  } catch (e) {
    err(res, e.message || "Error al cambiar estado");
  }
}

// DELETE /api/proyectos/:id
async function eliminar(req, res) {
  try {
    const result = await svc.eliminarProyecto(req.params.id);
    ok(res, result);
  } catch (e) {
    err(res, e.message || "Error al eliminar proyecto");
  }
}

// GET /api/proyectos/:id/equipo
async function equipo(req, res) {
  try {
    const data = await svc.obtenerEquipo(req.params.id);
    ok(res, data);
  } catch (e) {
    err(res, "Error al obtener equipo");
  }
}

// GET /api/proyectos/:id/avance
async function avance(req, res) {
  try {
    const data = await svc.obtenerAvance(req.params.id);
    ok(res, data);
  } catch (e) {
    err(res, "Error al obtener avance");
  }
}

module.exports = { listar, detalle, crear, actualizar, cambiarEstado, eliminar, equipo, avance };
