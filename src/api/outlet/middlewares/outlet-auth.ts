export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Skip authentication for public routes
    if (config.auth === false) {
      return await next();
    }

    const token = ctx.request.header.authorization?.replace('Bearer ', '');

    if (!token) {
      return ctx.unauthorized('No token provided');
    }

    try {
      // Verify JWT token
      const decoded = require('jsonwebtoken').verify(
        token,
        process.env.JWT_SECRET || 'default-secret'
      );

      // Check if it's an outlet token
      if (decoded.type !== 'outlet') {
        return ctx.unauthorized('Invalid token type');
      }

      // Get outlet from database
      const outlet = await strapi.entityService.findOne('api::outlet.outlet', decoded.id);

      if (!outlet) {
        return ctx.unauthorized('Outlet not found');
      }

      // Set auth state
      ctx.state.auth = decoded;

      await next();

    } catch (error) {
      return ctx.unauthorized('Invalid token');
    }
  };
};
