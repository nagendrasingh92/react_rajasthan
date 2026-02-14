'use strict';

const { register } = require('@strapi/plugin-graphql/server/register');
const customTypes = require('./graphql/custom-types');

module.exports = async ({ strapi }) => {
  // Register the GraphQL plugin
  await register({ strapi });
  
  // Register our custom types and resolvers
  const extensionService = strapi.plugin('graphql').service('extension');
  extensionService.use(() => customTypes);
};
