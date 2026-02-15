'use strict';

module.exports = {
  // Update user's default outlet when user profile is updated
  async updateDefaultOutlet(userId, userData) {
    try {
      // Find the user's default outlet (first outlet created for this seller)
      const outlets = await strapi.entityService.findMany('api::outlet.outlet', {
        filters: {
          user_seller: userId
        },
        sort: ['createdAt:asc'] // Get the first created outlet
      });

      if (outlets.length === 0) {
        console.log('No outlets found for user:', userId);
        return null;
      }

      const defaultOutlet = outlets[0];
      
      // Update the default outlet with user's profile data
      const updatedOutlet = await strapi.entityService.update('api::outlet.outlet', defaultOutlet.id, {
        data: {
          name: userData.username ? `${userData.username}'s Outlet` : defaultOutlet.name,
          city: userData.city || defaultOutlet.city,
          state: userData.state || defaultOutlet.state,
          address: userData.address || defaultOutlet.address,
          pincode: userData.pincode || defaultOutlet.pincode
        }
      });

      console.log('Updated default outlet for user:', updatedOutlet);
      return updatedOutlet;

    } catch (error) {
      console.error('Error updating default outlet:', error);
      throw error;
    }
  },

  // Get user's default outlet
  async getDefaultOutlet(userId) {
    try {
      const outlets = await strapi.entityService.findMany('api::outlet.outlet', {
        filters: {
          user_seller: userId
        },
        sort: ['createdAt:asc'],
        limit: 1
      });

      return outlets.length > 0 ? outlets[0] : null;
    } catch (error) {
      console.error('Error getting default outlet:', error);
      return null;
    }
  }
};
