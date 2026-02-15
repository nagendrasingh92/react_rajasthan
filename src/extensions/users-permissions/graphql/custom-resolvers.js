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

    // If user is a seller, create a default outlet automatically
    let outlet = null;
    if (roleName === 'seller') {
      try {
        console.log('=== CREATING OUTLET FOR SELLER ===');
        console.log('User data:', user);
        console.log('Input data:', input);
        
        // Hash the password for outlet
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(input.password, 10);
        
        console.log('Password hashed successfully');

        // Generate unique outlet username
        let outletUsername = `outlet_${user.username}`;
        let counter = 1;
        
        while (true) {
          const existingOutlet = await strapi.entityService.findOne('api::outlet.outlet', {
            filters: { username: outletUsername }
          });
          
          if (!existingOutlet) break;
          
          outletUsername = `outlet_${user.username}_${counter}`;
          counter++;
        }

        const outletData = {
          name: `${user.username}'s Outlet`,
          username: outletUsername,
          password: hashedPassword, // Hashed password
          city: user.city || '',
          state: user.state || '',
          address: user.address || '',
          pincode: user.pincode || '',
          user_seller: user.id,
          totalProducts: 0,
          totalQuantity: 0,
          totalRevenue: 0
        };
        
        console.log('Outlet data to create:', JSON.stringify(outletData, null, 2));

        const outlet = await strapi.entityService.create('api::outlet.outlet', {
          data: {
            name: `${user.username}'s Outlet`,
            username: outletUsername,
            password: input.password, // Let Strapi handle password hashing
            city: user.city || '',
            state: user.state || '',
            address: user.address || '',
            pincode: user.pincode || '',
            user_seller: user.id,
            totalProducts: 0,
            totalQuantity: 0,
            totalRevenue: 0
          }
        });
        console.log('Created default outlet for seller:', outlet);
      } catch (error) {
        console.error('Error creating default outlet for seller:', error);
        if (error.details && error.details.errors) {
          console.error('Validation errors:', JSON.stringify(error.details.errors, null, 2));
        }
        console.error('Outlet data being created:', {
          name: `${user.username}'s Outlet`,
          username: outletUsername,
          password: '[HASHED]',
          city: user.city || '',
          state: user.state || '',
          address: user.address || '',
          pincode: user.pincode || '',
          user_seller: user.id,
          totalProducts: 0,
          totalQuantity: 0,
          totalRevenue: 0
        });
        // Don't fail the registration if outlet creation fails
      }
    }

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

      // Profile update input type
      nexus.inputType({
        name: 'ProfileUpdateInput',
        definition(t) {
          t.string('username');
          t.string('phone');
          t.string('address');
          t.string('city');
          t.string('state');
          t.string('pincode');
        },
      }),

      // Outlet registration input type
      nexus.inputType({
        name: 'OutletRegisterInput',
        definition(t) {
          t.string('name');
          t.string('username');
          t.string('password');
          t.string('city');
          t.string('state');
          t.string('address');
          t.string('pincode');
          t.int('totalProducts');
          t.int('totalQuantity');
          t.int('totalRevenue');
        },
      }),

      // Outlet login input type
      nexus.inputType({
        name: 'OutletLoginInput',
        definition(t) {
          t.string('username');
          t.string('password');
        },
      }),

      // Outlet response type
      nexus.objectType({
        name: 'OutletResponse',
        definition(t) {
          t.boolean('success');
          t.string('message');
          t.field('outlet', {
            type: 'Outlet',
            nullable: true
          });
        },
      }),

      // Outlet login response type
      nexus.objectType({
        name: 'OutletLoginResponse',
        definition(t) {
          t.boolean('success');
          t.string('message');
          t.string('jwt');
          t.field('outlet', {
            type: 'Outlet',
            nullable: true
          });
        },
      }),

      // Outlet type
      nexus.objectType({
        name: 'Outlet',
        definition(t) {
          t.id('id');
          t.string('name');
          t.string('username');
          t.string('city');
          t.string('state');
          t.string('address');
          t.string('pincode');
          t.string('phone');
          t.int('totalProducts');
          t.int('totalQuantity');
          t.int('totalRevenue');
          t.field('user_seller', {
            type: 'UsersPermissionsMe',
            nullable: true
          });
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
          }),

          // Update user profile mutation
          t.field('updateProfile', {
            type: 'UsersPermissionsLoginPayload',
            args: {
              input: nexus.nonNull('ProfileUpdateInput'),
            },
            async resolve(parent, args, context) {
              const { input } = args;
              const userId = context.state.user?.id;
              
              if (!userId) {
                throw new Error('Authentication required');
              }

              try {
                // Update user profile
                const updatedUser = await strapi.entityService.update('plugin::users-permissions.user', userId, {
                  data: input,
                  populate: ['role']
                });

                // Generate new JWT token
                const jwt = strapi.plugins['users-permissions'].services.jwt.issue({
                  id: updatedUser.id,
                });

                return {
                  jwt,
                  user: {
                    id: updatedUser.id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    blocked: updatedUser.blocked || false,
                    confirmed: updatedUser.confirmed || true,
                    documentId: updatedUser.documentId || null,
                    role: {
                      id: updatedUser.role?.id,
                      name: updatedUser.role?.name,
                      type: updatedUser.role?.type,
                      description: updatedUser.role?.description || ''
                    }
                  }
                };
              } catch (error) {
                console.error('Profile update error:', error);
                throw new Error(error.message || 'Error updating profile');
              }
            },
          }),

          // Outlet registration mutation
          t.field('outletRegister', {
            type: 'OutletResponse',
            args: {
              input: nexus.nonNull('OutletRegisterInput'),
            },
            async resolve(parent, args) {
              const { input } = args;
              
              try {
                // Check if username already exists
                const existingOutlet = await strapi.entityService.findOne('api::outlet.outlet', {
                  filters: { username: input.username }
                });

                if (existingOutlet) {
                  return {
                    success: false,
                    message: `Username '${input.username}' is already taken. Please choose a different username.`,
                    outlet: null
                  };
                }

                // Create outlet with password hashing
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(input.password, 10);

                const outlet = await strapi.entityService.create('api::outlet.outlet', {
                  data: {
                    ...input,
                    password: hashedPassword
                  },
                  populate: ['user_seller']
                });

                // Remove password from response
                const { password: _, ...outletResponse } = outlet;

                return {
                  success: true,
                  message: 'Outlet created successfully',
                  outlet: outletResponse
                };
              } catch (error) {
                console.error('Outlet registration error:', error);
                console.error('Error name:', error.name);
                console.error('Error details:', error.details);
                console.error('Error message:', error.message);
                
                // Handle specific validation errors
                if (error.details && error.details.errors) {
                  const usernameError = error.details.errors.find(err => 
                    err.message === 'This attribute must be unique'
                  );
                  
                  console.error('Username error found:', usernameError);
                  
                  if (usernameError) {
                    return {
                      success: false,
                      message: `Username '${input.username}' is already taken. Please choose a different username.`,
                      outlet: null
                    };
                  }
                }
                
                // Also check if the error message itself contains the uniqueness error
                if (error.message && error.message.includes('This attribute must be unique')) {
                  return {
                    success: false,
                    message: `Username '${input.username}' is already taken. Please choose a different username.`,
                    outlet: null
                  };
                }
                
                return {
                  success: false,
                  message: error.message || 'Error creating outlet',
                  outlet: null
                };
              }
            },
          }),

          // Outlet login mutation
          t.field('outletLogin', {
            type: 'OutletLoginResponse',
            args: {
              input: nexus.nonNull('OutletLoginInput'),
            },
            async resolve(parent, args) {
              console.log('=== OUTLET LOGIN DEBUG ===');
              console.log('Parent:', parent);
              console.log('Args:', JSON.stringify(args, null, 2));
              console.log('Args.input:', args.input);
              console.log('Args.input type:', typeof args.input);
              
              if (!args.input) {
                console.log('ERROR: args.input is missing');
                throw new Error('Input object is required');
              }
              
              const { username, password } = args.input;
              console.log('Extracted username:', username);
              console.log('Extracted password:', password ? '[PROVIDED]' : '[MISSING]');

              if (!username || !password) {
                console.log('VALIDATION FAILED - Username or password missing');
                throw new Error('Username and password are required');
              }
              
              console.log('VALIDATION PASSED');

              try {
                // Find outlet by username
                const outlet = await strapi.entityService.findOne('api::outlet.outlet', {
                  filters: { username },
                  populate: ['user_seller']
                });

                if (!outlet) {
                  throw new Error('Invalid credentials');
                }

                // Compare password
                const bcrypt = require('bcryptjs');
                const isValidPassword = await bcrypt.compare(password, outlet.password);
                if (!isValidPassword) {
                  throw new Error('Invalid credentials');
                }

                // Generate JWT token
                const jwt = require('jsonwebtoken');
                const token = jwt.sign(
                  { 
                    id: outlet.id,
                    type: 'outlet',
                    username: outlet.username 
                  },
                  process.env.JWT_SECRET || 'default-secret',
                  { expiresIn: '30d' }
                );

                // Remove password from response
                const { password: _, ...outletData } = outlet;

                return {
                  success: true,
                  message: 'Login successful',
                  jwt: token,
                  outlet: outletData
                };

              } catch (error) {
                console.error('Outlet login error:', error);
                throw new Error(error.message || 'Login failed');
              }
            },
          });
        },
      }),
    ],
  }));

  return plugin;
};
