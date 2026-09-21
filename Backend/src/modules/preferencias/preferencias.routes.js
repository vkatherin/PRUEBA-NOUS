const express = require('express');
const router = express.Router();
const ctrl = require('./preferencias.controller');
const { verificarAutenticacion } = require('../auth/auth.middleware');

router.get('/', verificarAutenticacion, ctrl.getPreferencias);
router.put('/', verificarAutenticacion, ctrl.updatePreferencias);

module.exports = router;
