const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../../db/connection");

// Configuración de almacenamiento para formatos
const uploadDir = path.join(__dirname, "../../../uploads/formatos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Si viene req.body.codigo, podemos usarlo para el prefijo, o simplemente guardar el original o con un sufijo de tiempo
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}_${originalName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".pdf" && file.mimetype !== "application/pdf") {
    return cb(new Error("Solo se permiten archivos PDF."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
  },
});

const uploadMiddleware = (req, res, next) => {
  upload.single("archivo")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: "Error de subida: " + err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// GET /api/documentos/formatos
exports.obtenerFormatos = async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = `
      SELECT id, codigo, nombre, categoria, version, archivo_nombre_original, archivo_ruta, fecha_actualizacion, subido_por
      FROM formatos_institucionales
    `;
    const params = [];

    if (categoria) {
      query += ` WHERE categoria = ?`;
      params.push(categoria);
    }

    query += ` ORDER BY codigo ASC`;

    const [formatos] = await pool.query(query, params);
    res.json(formatos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener formatos" });
  }
};

// GET /api/documentos/formatos/:id/descargar
exports.descargarFormato = async (req, res) => {
  try {
    const { id } = req.params;
    const [[formato]] = await pool.query(`SELECT codigo, nombre, archivo_nombre_original FROM formatos_institucionales WHERE id = ?`, [id]);

    if (!formato) {
      return res.status(404).json({ error: "Formato no encontrado" });
    }

    const physicalPath = path.join(uploadDir, formato.archivo_nombre_original);
    
    if (!fs.existsSync(physicalPath)) {
      return res.status(404).json({ error: "Archivo físico no encontrado en el servidor" });
    }

    const downloadName = `${formato.codigo} - ${formato.nombre}.pdf`;
    res.download(physicalPath, downloadName);
  } catch (error) {
    res.status(500).json({ error: "Error al descargar el formato" });
  }
};

// POST /api/documentos/formatos
exports.subirFormato = [
  uploadMiddleware,
  async (req, res) => {
    try {
      const { codigo, nombre, categoria, version } = req.body;
      const usuarioId = req.usuario.id;
      const archivo = req.file;

      if (!codigo || !nombre || !categoria || !version) {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        return res.status(400).json({ error: "Faltan campos requeridos" });
      }

      // Buscar si ya existe el código
      const [[existente]] = await pool.query(`SELECT id, archivo_nombre_original FROM formatos_institucionales WHERE codigo = ?`, [codigo]);

      let archivo_nombre_original = existente ? existente.archivo_nombre_original : null;

      if (archivo) {
        // Se subió un archivo nuevo, actualizamos el nombre original y ruta
        archivo_nombre_original = archivo.filename;
        
        // Borramos el anterior si existía
        if (existente && existente.archivo_nombre_original) {
          const oldPath = path.join(uploadDir, existente.archivo_nombre_original);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
      }

      if (!archivo_nombre_original) {
        return res.status(400).json({ error: "Se requiere adjuntar un archivo PDF" });
      }

      const archivo_ruta = `/uploads/formatos/${archivo_nombre_original}`;

      if (existente) {
        // Update
        await pool.query(
          `UPDATE formatos_institucionales 
           SET nombre = ?, categoria = ?, version = ?, archivo_nombre_original = ?, archivo_ruta = ?, subido_por = ?
           WHERE codigo = ?`,
          [nombre, categoria, version, archivo_nombre_original, archivo_ruta, usuarioId, codigo]
        );
        res.json({ mensaje: "Formato actualizado exitosamente" });
      } else {
        // Insert
        await pool.query(
          `INSERT INTO formatos_institucionales (codigo, nombre, categoria, version, archivo_nombre_original, archivo_ruta, subido_por)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [codigo, nombre, categoria, version, archivo_nombre_original, archivo_ruta, usuarioId]
        );
        res.status(201).json({ mensaje: "Formato creado exitosamente" });
      }
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: "Error interno del servidor: " + error.message });
    }
  }
];

// DELETE /api/documentos/formatos/:id
exports.eliminarFormato = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [[formato]] = await pool.query(`SELECT archivo_nombre_original FROM formatos_institucionales WHERE id = ?`, [id]);
    
    if (!formato) {
      return res.status(404).json({ error: "Formato no encontrado" });
    }

    if (formato.archivo_nombre_original) {
      const physicalPath = path.join(uploadDir, formato.archivo_nombre_original);
      if (fs.existsSync(physicalPath)) {
        fs.unlinkSync(physicalPath);
      }
    }

    await pool.query(`DELETE FROM formatos_institucionales WHERE id = ?`, [id]);
    res.json({ mensaje: "Formato eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el formato" });
  }
};
