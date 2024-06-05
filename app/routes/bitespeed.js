'use strict';
const express = require('express');

const router = express.Router();

const bitespeed = require('../controllers/bitespeed');

router.post('/identify', bitespeed.identify);

module.exports = router;
