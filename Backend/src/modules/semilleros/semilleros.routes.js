const express = require('express');
const router = express.Router();
const ctrl = require('./semilleros.controller');

router.get('/',    ctrl.getSemilleros);
router.get('/:id', ctrl.getSemilleroById);

module.exports = router;
