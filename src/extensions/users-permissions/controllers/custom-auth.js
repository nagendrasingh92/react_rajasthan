'use strict';

const { sanitize } = require('@strapi/utils');
const { ApplicationError } = require('@strapi/utils').errors;

// Helper function to get role ID by name
async function getRoleId(roleName) {
  const role = await strapi.query('plugin::users-permissions.role').findOne({
    where: { name: roleName },
  });

  if (!role) {
    throw new Error(`Role '${roleName}' not found`);
  }

  return role.id;
}

// Custom registration logic
async function customRegister(ctx, roleName) {
  try {
    const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
    const settings = await pluginStore.get({ key: 'advanced' });

    if (!settings.allow_register) {
      throw new ApplicationError('Register action is currently disabled');
    }

    // Handle both REST and GraphQL inputs
    const params = ctx.request?.body?.input || ctx.request?.body || {};
    params.provider = 'local';

    // Check if email already exists
    const existingEmail = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: params.email }
    });

    if (existingEmail) {
      throw new ApplicationError('Email is already registered');
    }

    // Check if username already exists
    const existingUsername = await strapi.query('plugin::users-permissions.user').findOne({
      where: { username: params.username }
    });

    if (existingUsername) {
      throw new ApplicationError('Username is already taken');
    }

    // Get the role ID for the specified role
    const roleId = await getRoleId(roleName);

    // Add the role to the user data
    params.role = roleId;

    // Use the default register controller
    const user = await strapi.plugins['users-permissions'].services.user.add(params);

    // Sanitize the user output
    const sanitizedUser = await strapi.contentAPI.sanitize.output(
      user,
      strapi.getModel('plugin::users-permissions.user'),
      { auth: ctx.state.auth }
    );

    // Generate JWT token
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    const response = {
      jwt,
      user: sanitizedUser,
    };

    // Handle GraphQL response
    if (ctx.request?.body?.input || ctx.request?.body?.input !== undefined) {
      return response;
    }

    // Handle REST response
    ctx.send(response);
  } catch (error) {
    // Handle GraphQL error
    if (ctx.request?.body?.input !== undefined) {
      throw new ApplicationError(error.message);
    }
    // Handle REST error
    ctx.badRequest(error.message);
  }
}

module.exports = (plugin) => {
  // Register a new custom controller
  plugin.controllers.customAuth = {
    async customerRegister(ctx) {
      return customRegister(ctx, 'customer');
    },
    async sellerRegister(ctx) {
      return customRegister(ctx, 'seller');
    },
  };

  // Add the new routes
  plugin.routes['content-api'].routes.push(
    {
      method: 'POST',
      path: '/auth/local/customer/register',
      handler: 'customAuth.customerRegister',
      config: {
        middlewares: ['plugin::users-permissions.rateLimit'],
        prefix: '',
      },
    },
    {
      method: 'POST',
      path: '/auth/local/seller/register',
      handler: 'customAuth.sellerRegister',
      config: {
        middlewares: ['plugin::users-permissions.rateLimit'],
        prefix: '',
      },
    }
  );

  return plugin;
};
