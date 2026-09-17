const express = require('express');
const router = express.Router();
const ctrl = require('./convocatorias.controller');

router.get('/',    ctrl.getConvocatorias);
router.get('/:id', ctrl.getConvocatoriaById);

module.exports = router;
