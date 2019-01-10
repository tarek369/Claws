'use strict';

const os = require('os-utils');
const generalRoutes = require('express').Router();

generalRoutes.get('/status', async (req, res) => {
  os.cpuUsage((usage) => {
    res.json({
      online: true,
      load: Number(usage * 100).toFixed(2)
    });
  });
});

module.exports = generalRoutes;
