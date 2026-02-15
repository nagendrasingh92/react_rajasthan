/**
 * outlet controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::outlet.outlet', ({ strapi }) => ({
  // Custom action to update outlet statistics
  async updateStats(ctx) {
    const { id } = ctx.params;
    
    try {
      const updatedOutlet = await strapi.service('api::outlet.outlet').updateOutletStats(id);
      
      ctx.send({
        message: 'Outlet statistics updated successfully',
        data: updatedOutlet
      });
    } catch (error) {
      ctx.badRequest('Error updating outlet statistics', { error: error.message });
    }
  },

  // Custom action to recalculate all outlet statistics
  async recalculateAllStats(ctx) {
    try {
      const results = await strapi.service('api::outlet.outlet').recalculateAllOutletStats();
      
      ctx.send({
        message: 'All outlet statistics recalculated',
        results
      });
    } catch (error) {
      ctx.badRequest('Error recalculating outlet statistics', { error: error.message });
    }
  }
}));
