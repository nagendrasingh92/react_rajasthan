'use strict';

module.exports = {
  async beforeCreate(event) {
    console.log('=== USER BEFORECREATE HOOK TRIGGERED ===');
    console.log('Before create event:', event);
  },

  async afterCreate(event) {
    console.log('=== USER AFTERCREATE HOOK TRIGGERED ===');
    console.log('After create event:', event);
    
    // Simple test - just log and return
    console.log('Hook is working!');
  },

  async beforeUpdate(event) {
    console.log('=== USER BEFOREUPDATE HOOK TRIGGERED ===');
  },

  async afterUpdate(event) {
    console.log('=== USER AFTERUPDATE HOOK TRIGGERED ===');
  },
};
