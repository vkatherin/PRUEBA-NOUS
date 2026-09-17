const express = require("express");
const router = express.Router();
const pool = require("../../db/connection");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { correo, password } = req.body;
  if (!correo) return res.status(400).json({ error: "El correo es requerido" });

  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.nombre_completo, u.correo_institucional, u.password_hash, u.activo,
              GROUP_CONCAT(r.nombre) as roles
       FROM usuarios u
       LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
       LEFT JOIN roles r ON r.id = ur.rol_id
       WHERE u.correo_institucional = ?
       GROUP BY u.id`,
      [correo]
    );

    if (rows.length === 0) return res.status(401).json({ error: "Credenciales incorrectas" });
    const user = rows[0];
    if (!user.activo) return res.status(403).json({ error: "Usuario inactivo" });

    // Si no tiene password configurado, acepta cualquier contraseña
    if (user.password_hash !== null) {
      const bcrypt = require("bcryptjs");
      const isPlain = user.password_hash === password;
      const isBcrypt = user.password_hash.startsWith("$2") ? await bcrypt.compare(password || "", user.password_hash) : false;
      if (!isPlain && !isBcrypt) return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    res.json({
      ok: true,
      usuario: {
        id: user.id,
        nombre: user.nombre_completo,
        correo: user.correo_institucional,
        roles: user.roles ? user.roles.split(",") : [],
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
