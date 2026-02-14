export default [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:', 'https://market-assets.strapi.io', 'https://strapi-ai-staging.s3.us-east-1.amazonaws.com', 'https://strapi-ai-production.s3.us-east-1.amazonaws.com', 'https://res.cloudinary.com'],
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
