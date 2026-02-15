'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
  // Outlet login
  async login(ctx) {
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      return ctx.badRequest('Username and password are required');
    }

    try {
      // Find outlet by username
      const outlet = await strapi.entityService.findOne('api::outlet.outlet', {
        filters: { username },
        populate: ['user_seller']
      });

      if (!outlet) {
        return ctx.badRequest('Invalid credentials');
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, outlet.password);
      if (!isValidPassword) {
        return ctx.badRequest('Invalid credentials');
      }

      // Generate JWT token
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

      ctx.send({
        jwt: token,
        outlet: outletData
      });

    } catch (error) {
      console.error('Outlet login error:', error);
      return ctx.badRequest('Login failed');
    }
  },

  // Create outlet with password hashing
  async create(ctx) {
    const { password, ...outletData } = ctx.request.body;

    if (!password) {
      return ctx.badRequest('Password is required');
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create outlet with hashed password
      const outlet = await strapi.entityService.create('api::outlet.outlet', {
        data: {
          ...outletData,
          password: hashedPassword
        },
        populate: ['user_seller']
      });

      // Remove password from response
      const { password: _, ...outletResponse } = outlet;

      ctx.send(outletResponse);

    } catch (error) {
      console.error('Outlet creation error:', error);
      return ctx.badRequest('Error creating outlet', { error: error.message });
    }
  },

  // Update outlet with password hashing if provided
  async update(ctx) {
    const { id } = ctx.params;
    const { password, ...updateData } = ctx.request.body;

    try {
      // If password is provided, hash it
      if (password) {
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
  },

  // Get current outlet profile (authenticated)
  async me(ctx) {
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
  }
};
