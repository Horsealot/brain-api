const users = require('./users');
const auth = require('./auth');
const uploads = require('./uploads');
const squads = require('./squads');
const tools = require('./tools');
const dashboards = require('./dashboards');

module.exports = (router) => {
    users(router);
    auth(router);
    uploads(router);
    squads(router);
    tools(router);
    dashboards(router);
};