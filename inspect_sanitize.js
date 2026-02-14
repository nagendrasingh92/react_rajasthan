
const { sanitize } = require('@strapi/utils');
console.log(JSON.stringify(sanitize, null, 2));
console.log('sanitize.contentAPI:', sanitize.contentAPI);
console.log('sanitize.output:', sanitize.output);
