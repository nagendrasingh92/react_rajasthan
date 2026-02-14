'use strict';

module.exports = async (plugin) => {
  // Import and register custom controllers and routes
  plugin = require('./controllers/custom-auth')(plugin);

  return plugin;
};
