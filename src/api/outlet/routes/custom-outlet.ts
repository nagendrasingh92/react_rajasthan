/**
 * custom outlet router for additional routes
 */

export default {
  type: 'custom',
  routes: [
    {
      method: 'POST',
      path: '/outlets/:id/update-stats',
      handler: 'outlet.updateStats',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Set to true if authentication is required
      }
    },
    {
      method: 'POST', 
      path: '/outlets/recalculate-all-stats',
      handler: 'outlet.recalculateAllStats',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Set to true if authentication is required
      }
    }
  ]
};
