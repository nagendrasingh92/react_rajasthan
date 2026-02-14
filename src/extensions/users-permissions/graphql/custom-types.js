'use strict';

module.exports = {
  typeDefs: `
    extend input UsersPermissionsRegisterInput {
      phone: String
      address: String
    }

    extend type Mutation {
      customerRegister(input: UsersPermissionsRegisterInput!): UsersPermissionsLoginPayload!
      sellerRegister(input: UsersPermissionsRegisterInput!): UsersPermissionsLoginPayload!
    }
  `,
  resolvers: {
    Mutation: {
      async customerRegister(parent, args, context) {
        const { input } = args;
        const ctx = {
          request: {
            body: { input }
          },
          state: {},
          params: {},
          query: {},
          response: {}
        };

        try {
          return await strapi.plugins['users-permissions'].controllers.customAuth.customerRegister(ctx);
        } catch (error) {
          throw new Error(error.message);
        }
      },

      async sellerRegister(parent, args, context) {
        const { input } = args;
        const ctx = {
          request: {
            body: { input }
          },
          state: {},
          params: {},
          query: {},
          response: {}
        };

        try {
          return await strapi.plugins['users-permissions'].controllers.customAuth.sellerRegister(ctx);
        } catch (error) {
          throw new Error(error.message);
        }
      },
    },
  },
  resolversConfig: {
    'Mutation.customerRegister': {
      auth: false,
    },
    'Mutation.sellerRegister': {
      auth: false,
    },
  },
};
