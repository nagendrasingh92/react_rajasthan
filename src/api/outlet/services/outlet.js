'use strict';

module.exports = {
  // Update statistics for a specific outlet
  async updateOutletStats(outletId) {
    if (!outletId) {
      throw new Error('Outlet ID is required');
    }

    try {
      // Get all products for this outlet
      const products = await strapi.entityService.findMany('api::product.product', {
        filters: {
          outlet: outletId
        }
      });

      // Calculate statistics
      const totalProducts = products.length;
      const totalQuantity = products.reduce((sum, product) => sum + (product.stockQuantity || 0), 0);
      const totalRevenue = products.reduce((sum, product) => {
        const soldQuantity = (product.totalProduct || 0) - (product.stockQuantity || 0);
        return sum + (soldQuantity * (product.price || 0));
      }, 0);

      // Update the outlet with new statistics
      const updatedOutlet = await strapi.entityService.update('api::outlet.outlet', outletId, {
        data: {
          totalProducts,
          totalQuantity,
          totalRevenue
        }
      });

      return updatedOutlet;

    } catch (error) {
      console.error('Error updating outlet statistics:', error);
      throw error;
    }
  },

  // Recalculate statistics for all outlets
  async recalculateAllOutletStats() {
    try {
      // Get all outlets
      const outlets = await strapi.entityService.findMany('api::outlet.outlet');

      const results = [];
      for (const outlet of outlets) {
        try {
          const updated = await this.updateOutletStats(outlet.id);
          results.push({
            outletId: outlet.id,
            outletName: outlet.name,
            success: true,
            data: updated
          });
        } catch (error) {
          results.push({
            outletId: outlet.id,
            outletName: outlet.name,
            success: false,
            error: error.message
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Error recalcuating all outlet statistics:', error);
      throw error;
    }
  }
};
