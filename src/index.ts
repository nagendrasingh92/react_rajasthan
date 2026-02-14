// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: any }) {
    const extensionService = strapi.plugin('graphql').service('extension');
    const customTypes = require('./extensions/users-permissions/graphql/custom-types');

    // Clear any cached schema
    if (extensionService.shadowCRUD) {
      extensionService.shadowCRUD('plugin::users-permissions.user').disableMutations();
    }

    try {
      extensionService.use(customTypes);
    } catch (e) {
      console.error('--- ERROR REGISTERING GRAPHQL EXTENSION ---', e);
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap(/* { strapi }: { strapi: Core.Strapi } */) { },
};
