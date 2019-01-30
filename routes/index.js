const users = require('./users');
const auth = require('./auth');
const uploads = require('./uploads');

module.exports = (router) => {
    users(router);
    auth(router);
    uploads(router);
};