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

    // If user is a seller, create a default outlet automatically
    let outlet = null;
    if (roleName === 'seller') {
      try {
        console.log('Creating default outlet for seller:', user.username);
        
        // Generate unique outlet username
        let outletUsername = `outlet_${user.username}`;
        let counter = 1;
        
        while (true) {
          const existingOutlet = await strapi.entityService.findMany('api::outlet.outlet', {
            filters: { username: outletUsername }
          });
          
          if (existingOutlet.length === 0) break;
          
          outletUsername = `outlet_${user.username}_${counter}`;
          counter++;
        }

        outlet = await strapi.entityService.create('api::outlet.outlet', {
          data: {
            name: `${user.username}'s Outlet`,
            username: outletUsername,
            password: params.password, // Use the same password as the user
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
        console.log('Created default outlet for seller:', outlet.username);
      } catch (error) {
        console.error('Error creating default outlet for seller:', error);
        if (error.details && error.details.errors) {
          console.error('Validation errors:', JSON.stringify(error.details.errors, null, 2));
        }
        // Don't fail the registration if outlet creation fails
      }
    }

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

    // Create outlet for existing seller
    async createOutletForSeller(ctx) {
      const { userId } = ctx.params;
      
      try {
        // Check if user exists and is a seller
        const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId, {
          populate: ['role']
        });

        if (!user) {
          return ctx.badRequest('User not found');
        }

        if (user.role?.name !== 'seller') {
          return ctx.badRequest('User is not a seller');
        }

        // Check if user already has outlets
        const existingOutlets = await strapi.entityService.findMany('api::outlet.outlet', {
          filters: {
            user_seller: userId
          }
        });

        if (existingOutlets.length > 0) {
          return ctx.badRequest('User already has outlets');
        }

        // Create default outlet for seller
        // Hash the password for outlet
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(params.password, 10);

        const outlet = await strapi.entityService.create('api::outlet.outlet', {
          data: {
            name: `${user.username}'s Outlet`,
            username: `outlet_${user.username}`, // Prefix to avoid conflicts
            password: hashedPassword, // Hashed password
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

        ctx.send({
          message: 'Outlet created successfully',
          outlet
        });

      } catch (error) {
        console.error('Error creating outlet for seller:', error);
        ctx.badRequest('Error creating outlet', { error: error.message });
      }
    },

    // Create outlets for all sellers without outlets
    async createOutletsForAllSellers(ctx) {
      try {
        // Get all sellers
        const sellers = await strapi.entityService.findMany('plugin::users-permissions.user', {
          filters: {
            role: {
              name: 'seller'
            }
          },
          populate: ['role', 'outlets']
        });

        const results = [];
        
        for (const seller of sellers) {
          // Skip if already has outlets
          if (seller.outlets && seller.outlets.length > 0) {
            results.push({
              userId: seller.id,
              username: seller.username,
              message: 'Already has outlets',
              skipped: true
            });
            continue;
          }

          try {
            // Hash the password for outlet
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('tempPassword123', 10);

            const outlet = await strapi.entityService.create('api::outlet.outlet', {
              data: {
                name: `${seller.username}'s Outlet`,
                username: `outlet_${seller.username}`, // Prefix to avoid conflicts
                password: hashedPassword, // Hashed temporary password
                city: seller.city || '',
                state: seller.state || '',
                address: seller.address || '',
                pincode: seller.pincode || '',
                user_seller: seller.id,
                totalProducts: 0,
                totalQuantity: 0,
                totalRevenue: 0
              }
            });

            results.push({
              userId: seller.id,
              username: seller.username,
              outlet: outlet,
              message: 'Outlet created successfully',
              success: true
            });

          } catch (error) {
            results.push({
              userId: seller.id,
              username: seller.username,
              message: 'Error creating outlet',
              error: error.message,
              success: false
            });
          }
        }

        ctx.send({
          message: 'Processed all sellers',
          totalSellers: sellers.length,
          results
        });

      } catch (error) {
        console.error('Error creating outlets for all sellers:', error);
        ctx.badRequest('Error processing sellers', { error: error.message });
      }
    },

    // Outlet login
    async outletLogin(ctx) {
      const { username, password } = ctx.request.body;
      console.log('=== OUTLET LOGIN DEBUG ===');
      console.log('Username:', username);
      console.log('Password provided:', password ? '[YES]' : '[NO]');

      if (!username || !password) {
        return {
          success: false,
          message: 'Username and password are required',
          jwt: null,
          outlet: null
        };
      }

      try {
        // Find outlet by username
        console.log('Searching for outlet with username:', username);
        const outlets = await strapi.entityService.findMany('api::outlet.outlet', {
          filters: { username },
          populate: ['user_seller']
        });

        console.log('Found outlets:', outlets.length);
        const outlet = outlets[0]; // Get the first (and should be only) outlet with that username

        if (!outlet) {
          console.log('No outlet found with username:', username);
          return {
            success: false,
            message: 'Invalid credentials - outlet not found',
            jwt: null,
            outlet: null
          };
        }

        console.log('Outlet found:', outlet.username);
        console.log('Outlet has password:', outlet.password ? '[HASHED]' : '[MISSING]');
        console.log('Stored password hash (first 20 chars):', outlet.password ? outlet.password.substring(0, 20) + '...' : '[NONE]');

        // Compare password
        const bcrypt = require('bcryptjs');
        console.log('Comparing password with hash...');
        
        // Test with a simple password hash
        const testPassword = 'test123';
        const testHash = await bcrypt.hash(testPassword, 10);
        console.log('Test hash for "test123":', testHash);
        console.log('Test comparison result:', await bcrypt.compare(testPassword, testHash));
        
        const isValidPassword = await bcrypt.compare(password, outlet.password);
        console.log('Password comparison result:', isValidPassword);
        
        if (!isValidPassword) {
          console.log('Password mismatch for username:', username);
          console.log('The password you provided does not match the stored hash.');
          console.log('This outlet was likely created with a different password.');
          console.log('Try creating a new outlet with a known password, or check what password was used originally.');
          
          // Check if the password is stored as plain text (for debugging)
          if (password === outlet.password) {
            console.log('Password is stored as plain text - this is a security issue!');
            // Hash the plain text password for future use
            const hashedPassword = await bcrypt.hash(outlet.password, 10);
            await strapi.entityService.update('api::outlet.outlet', outlet.id, {
              data: { password: hashedPassword }
            });
            console.log('Password has been hashed and updated');
            // Continue with login since plain text matched
          } else {
            return {
              success: false,
              message: 'Invalid credentials - password incorrect',
              jwt: null,
              outlet: null
            };
          }
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

        // Return the response for GraphQL
        return {
          success: true,
          message: 'Login successful',
          jwt: token,
          outlet: outletData
        };

      } catch (error) {
        console.error('Outlet login error:', error);
        return ctx.badRequest('Login failed');
      }
    },

    // Create outlet with password hashing
    async outletCreate(ctx) {
      const { password, ...outletData } = ctx.request.body.input || ctx.request.body;

      console.log('=== OUTLET CREATION DEBUG ===');
      console.log('Outlet creation data:', { password: password ? '[PROVIDED]' : '[MISSING]', ...outletData });
      console.log('Raw password received:', password);

      if (!password) {
        return ctx.badRequest('Password is required');
      }

      try {
        // Check if Strapi auto-hashes passwords by trying without manual hashing first
        console.log('Testing if Strapi auto-hashes passwords...');
        
        let outlet;
        try {
          // Try creating without manual hashing first
          outlet = await strapi.entityService.create('api::outlet.outlet', {
            data: {
              ...outletData,
              password: password // Let Strapi handle password hashing
            },
            populate: ['user_seller']
          });
          console.log('Outlet created successfully with Strapi auto-hashing');
        } catch (autoHashError) {
          console.log('Auto-hashing failed, trying manual hashing...');
          // If auto-hashing fails, try manual hashing
          const bcrypt = require('bcryptjs');
          const hashedPassword = await bcrypt.hash(password, 10);
          console.log('Password hashed manually');
          console.log('Hash preview (first 20 chars):', hashedPassword.substring(0, 20) + '...');

          outlet = await strapi.entityService.create('api::outlet.outlet', {
            data: {
              ...outletData,
              password: hashedPassword
            },
            populate: ['user_seller']
          });
        }

        // Remove password from response
        const { password: _, ...outletResponse } = outlet;

        // Return the response for GraphQL
        return {
          success: true,
          message: 'Outlet created successfully',
          outlet: outletResponse
        };

      } catch (error) {
        console.error('Outlet creation error:', error);
        console.error('Error details:', error.details);
        if (error.details && error.details.errors) {
          console.error('Validation errors:', JSON.stringify(error.details.errors, null, 2));
          
          // Check for username uniqueness error
          const usernameError = error.details.errors.find(err => 
            err.message === 'This attribute must be unique'
          );
          
          if (usernameError) {
            // Return error response for GraphQL with specific message
            return {
              success: false,
              message: `Username '${outletData.username}' is already taken. Please choose a different username.`,
              outlet: null
            };
          }
        }
        
        // Also check if the error message itself contains the uniqueness error
        if (error.message && error.message.includes('This attribute must be unique')) {
          return {
            success: false,
            message: `Username '${outletData.username}' is already taken. Please choose a different username.`,
            outlet: null
          };
        }
        
        // Return error response for GraphQL
        return {
          success: false,
          message: error.message || 'Error creating outlet',
          outlet: null
        };
      }
    },

    // Get current outlet profile (authenticated)
    async outletMe(ctx) {
      const outletId = ctx.state.auth?.id;
      const authType = ctx.state.auth?.type;

      if (!outletId || authType !== 'outlet') {
        return ctx.unauthorized('Invalid outlet token');
      }

      try {
        const outlet = await strapi.entityService.findOne('api::outlet.outlet', outletId, {
          populate: ['user_seller', 'products', 'orders']
        });

        if (!outlet) {
          return ctx.notFound('Outlet not found');
        }

        // Remove password from response
        const { password: _, ...outletResponse } = outlet;

        ctx.send(outletResponse);

      } catch (error) {
        console.error('Get outlet profile error:', error);
        return ctx.badRequest('Error fetching outlet profile');
      }
    },

    // Update outlet with password hashing if provided
    async outletUpdate(ctx) {
      const { id } = ctx.params;
      const { password, ...updateData } = ctx.request.body;

      try {
        // If password is provided, hash it
        if (password) {
          const bcrypt = require('bcryptjs');
          updateData.password = await bcrypt.hash(password, 10);
        }

        const outlet = await strapi.entityService.update('api::outlet.outlet', id, {
          data: updateData,
          populate: ['user_seller']
        });

        // Remove password from response
        const { password: _, ...outletResponse } = outlet;

        ctx.send(outletResponse);

      } catch (error) {
        console.error('Outlet update error:', error);
        return ctx.badRequest('Error updating outlet', { error: error.message });
      }
    }
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
    },
    {
      method: 'POST',
      path: '/auth/create-outlet/:userId',
      handler: 'customAuth.createOutletForSeller',
      config: {
        middlewares: [],
        prefix: '',
        auth: false, // Set to true if authentication is required
      },
    },
    {
      method: 'POST',
      path: '/auth/create-outlets-for-all-sellers',
      handler: 'customAuth.createOutletsForAllSellers',
      config: {
        middlewares: [],
        prefix: '',
        auth: false, // Set to true if authentication is required
      },
    },
    {
      method: 'POST',
      path: '/outlet/login',
      handler: 'customAuth.outletLogin',
      config: {
        middlewares: [],
        prefix: '',
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/outlet/register',
      handler: 'customAuth.outletCreate',
      config: {
        middlewares: [],
        prefix: '',
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/outlet/me',
      handler: 'customAuth.outletMe',
      config: {
        middlewares: [],
        prefix: '',
        auth: {
          scope: ['outlet'],
        },
      },
    },
    {
      method: 'PUT',
      path: '/outlet/:id',
      handler: 'customAuth.outletUpdate',
      config: {
        middlewares: [],
        prefix: '',
        auth: {
          scope: ['outlet'],
        },
      },
    }
  );

  return plugin;
};
