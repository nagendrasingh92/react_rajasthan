'use strict';

const customTypes = require('./custom-types');

module.exports = (plugin) => {
  const { service: extensionService } = strapi.plugin('graphql');

  // Clear any cached schema
  if (extensionService.shadowCRUD) {
    extensionService.shadowCRUD('plugin::users-permissions.user').disableMutations();
  }

  // Register the schema extension using custom-types
  extensionService.use(customTypes);

  return plugin;
};
