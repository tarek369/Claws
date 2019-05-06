'use strict';

const os = require('os-utils');
const generalRoutes = require('express').Router();
const { providerList } = require('../scrapers/providers/index');

generalRoutes.get('/status', async (req, res) => {
  os.cpuUsage((usage) => {
    res.json({
      online: true,
      load: Number(usage * 100).toFixed(2)
    });
  });
});

generalRoutes.get('/providers', (req, res) => {
  res.json(providerList)
})

module.exports = generalRoutes;
