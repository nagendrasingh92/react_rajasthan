'use strict';

module.exports = {
  // After product is created
  async afterCreate(event) {
    console.log('After create result:', event);
    
    if (!event.result || !event.result.id) {
      console.log('No valid result or ID in afterCreate');
      return;
    }

    try {
      // Fetch the product with outlet relationship
      const product = await strapi.entityService.findOne('api::product.product', event.result.id, {
        populate: ['outlet']
      });
      
      const outletId = product.outlet?.id || product.outlet;
      console.log('Product created - outlet ID:', outletId);
      await updateOutletStats(outletId);
    } catch (error) {
      console.error('Error in afterCreate:', error);
    }
  },

  // After product is updated
  async afterUpdate(event) {
    console.log('After update result:', event);
    
    if (!event.result || !event.result.id) {
      console.log('No valid result or ID in afterUpdate');
      return;
    }

    try {
      // Fetch the product with outlet relationship
      const product = await strapi.entityService.findOne('api::product.product', event.result.id, {
        populate: ['outlet']
      });
      
      const outletId = product.outlet?.id || product.outlet;
      console.log('Product updated - outlet ID:', outletId);
      await updateOutletStats(outletId);
    } catch (error) {
      console.error('Error in afterUpdate:', error);
    }
  },

  // After product is deleted
  async afterDelete(event) {
    console.log('After delete result:', event);
    
    if (!event.result || !event.result.id) {
      console.log('No valid result or ID in afterDelete');
      return;
    }

    try {
      // Fetch the product with outlet relationship before deletion
      const outletId = event.params?.data?.outlet?.id || event.params?.data?.outlet;
      console.log('Product deleted - outlet ID:', outletId);
      await updateOutletStats(outletId);
    } catch (error) {
      console.error('Error in afterDelete:', error);
    }
  },
};

// Helper function to update outlet statistics
async function updateOutletStats(outletId) {
  if (!outletId) {
    console.log('No outlet ID provided, skipping update');
    return;
  }

  console.log(`Updating stats for outlet ${outletId}...`);

  try {
    // Get all products for this outlet
    const products = await strapi.entityService.findMany('api::product.product', {
      filters: {
        outlet: outletId
      },
      populate: ['outlet']
    });

    console.log(`Found ${products.length} products for outlet ${outletId}`);

    // Calculate statistics
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, product) => sum + (product.stockQuantity || 0), 0);
    const totalRevenue = products.reduce((sum, product) => {
      const soldQuantity = (product.totalProduct || 0) - (product.stockQuantity || 0);
      return sum + (soldQuantity * (product.price || 0));
    }, 0);

    console.log(`Calculated stats:`, {
      totalProducts,
      totalQuantity,
      totalRevenue
    });

    // Update the outlet with new statistics
    const updatedOutlet = await strapi.entityService.update('api::outlet.outlet', outletId, {
      data: {
        totalProducts,
        totalQuantity,
        totalRevenue
      }
    });

    console.log(`Successfully updated outlet ${outletId}:`, updatedOutlet);

  } catch (error) {
    console.error('Error updating outlet statistics:', error);
  }
}
