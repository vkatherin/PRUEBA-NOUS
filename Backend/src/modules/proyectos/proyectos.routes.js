const express = require('express');
const router = express.Router();
const ctrl = require('./proyectos.controller');

router.get('/',    ctrl.getProyectos);
router.get('/:id', ctrl.getProyectoById);

module.exports = router;
