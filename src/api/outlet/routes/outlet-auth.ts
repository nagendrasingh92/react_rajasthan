export default {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/outlet/login',
      handler: 'outlet-auth.login',
      config: {
        middlewares: [],
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/outlet/register',
      handler: 'outlet-auth.create',
      config: {
        middlewares: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/outlet/me',
      handler: 'outlet-auth.me',
      config: {
        middlewares: [],
        auth: {
          scope: ['outlet'],
        },
      },
    },
    {
      method: 'PUT',
      path: '/outlet/:id',
      handler: 'outlet-auth.update',
      config: {
        middlewares: [],
        auth: {
          scope: ['outlet'],
        },
      },
    },
  ],
};
