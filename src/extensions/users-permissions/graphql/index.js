'use strict';

const { register } = require('@strapi/plugin-graphql');

module.exports = (plugin) => {
  // Register the GraphQL plugin
  register(plugin);
  
  // Import and register our schema
  require('./schema.graphql')(plugin);
  
  return plugin;
};
