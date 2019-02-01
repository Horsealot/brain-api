const users = require('./users');
const auth = require('./auth');
const uploads = require('./uploads');
const squads = require('./squads');

module.exports = (router) => {
    users(router);
    auth(router);
    uploads(router);
    squads(router);
};