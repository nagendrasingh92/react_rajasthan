'use strict';

module.exports = {
  typeDefs: `
    extend input UsersPermissionsRegisterInput {
      phone: String
      address: String
    }

    input OutletRegisterInput {
      name: String!
      username: String!
      password: String!
      city: String
      state: String
      address: String
      pincode: String
      totalProducts: Int
      totalQuantity: Int
      totalRevenue: Int
    }

    input OutletLoginInput {
      username: String!
      password: String!
    }

    type OutletResponse {
      success: Boolean!
      message: String!
      outlet: Outlet
    }

    type OutletLoginResponse {
      success: Boolean!
      message: String!
      jwt: String
      outlet: Outlet
    }

    type Outlet {
      id: ID!
      name: String!
      username: String!
      city: String
      state: String
      address: String
      pincode: String
      phone: String
      totalProducts: Int
      totalQuantity: Int
      totalRevenue: Int
      user_seller: UsersPermissionsUser
    }

    extend type Mutation {
      customerRegister(input: UsersPermissionsRegisterInput!): UsersPermissionsLoginPayload!
      sellerRegister(input: UsersPermissionsRegisterInput!): UsersPermissionsLoginPayload!
      outletRegister(input: OutletRegisterInput!): OutletResponse!
      outletLogin(input: OutletLoginInput!): OutletLoginResponse!
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

      async outletRegister(parent, args, context) {
        const { input } = args;
        const ctx = {
          request: {
            body: { input }
          },
          state: {},
          params: {},
          query: {},
          response: {},
          badRequest: (message) => {
            throw new Error(message);
          }
        };

        try {
          return await strapi.plugins['users-permissions'].controllers.customAuth.outletCreate(ctx);
        } catch (error) {
          throw new Error(error.message);
        }
      },

      async outletLogin(parent, args, context) {
        const { input } = args;
        const ctx = {
          request: {
            body: input // Pass input directly, not wrapped in another input object
          },
          state: {},
          params: {},
          query: {},
          response: {},
          badRequest: (message) => {
            throw new Error(message);
          }
        };

        try {
          return await strapi.plugins['users-permissions'].controllers.customAuth.outletLogin(ctx);
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
    'Mutation.outletRegister': {
      auth: false,
    },
    'Mutation.outletLogin': {
      auth: false,
    },
  },
};
