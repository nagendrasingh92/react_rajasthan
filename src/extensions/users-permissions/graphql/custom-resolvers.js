'use strict';

const { toEntityResponse } = require('@strapi/utils').transform;
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
const registerUser = async (input, roleName) => {
  try {
    // Check if email already exists
    const existingEmail = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: input.email }
    });

    if (existingEmail) {
      throw new Error('Email is already registered');
    }

    // Check if username already exists
    const existingUsername = await strapi.query('plugin::users-permissions.user').findOne({
      where: { username: input.username }
    });

    if (existingUsername) {
      throw new Error('Username is already taken');
    }
    // Get the role ID
    const roleId = await getRoleId(roleName);

    // Create the user with the specified role
    const user = await strapi
      .query('plugin::users-permissions.user')
      .create({
        data: {
          ...input,
          role: roleId,
          confirmed: true, // Auto-confirm the user
        },
        populate: ['role'] // Make sure to populate the role
      });

    // Generate JWT token
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    // Return the expected format for UsersPermissionsLoginPayload
    return {
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        blocked: user.blocked || false,
        confirmed: user.confirmed || true,
        documentId: user.documentId || null,
        role: {
          id: user.role?.id,
          name: user.role?.name,
          type: user.role?.type,
          description: user.role?.description || ''
        }
      }
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Error during registration');
  }
};

module.exports = (plugin) => {
  const extensionService = strapi.plugin('graphql').service('extension');
  
  // Customer registration mutation
  extensionService.use(({ nexus }) => ({
    types: [
      nexus.extendInputType({
        type: 'UsersPermissionsRegisterInput',
        definition(t) {
          t.string('phone');
          t.string('address');
        },
      }),
      nexus.extendType({
        type: 'Mutation',
        definition(t) {
          t.field('customerRegister', {
            type: 'UsersPermissionsLoginPayload',
            args: {
              input: nexus.nonNull('UsersPermissionsRegisterInput'),
            },
            async resolve(parent, args) {
              return registerUser(args.input, 'customer');
            },
          });

          t.field('sellerRegister', {
            type: 'UsersPermissionsLoginPayload',
            args: {
              input: nexus.nonNull('UsersPermissionsRegisterInput'),
            },
            async resolve(parent, args) {
              return registerUser(args.input, 'seller');
            },
          });
        },
      }),
    ],
  }));

  return plugin;
};
