const users = require('./users');
const auth = require('./auth');
const uploads = require('./uploads');
const squads = require('./squads');
const tools = require('./tools');
const dashboards = require('./dashboards');
const okrs = require('./okrs');
const goals = require('./goals');
const foodForThought = require('./foodForThought');
const howTos = require('./howTos');
const todos = require('./todos');

module.exports = (router) => {
    users(router);
    auth(router);
    uploads(router);
    squads(router);
    tools(router);
    dashboards(router);
    okrs(router);
    goals(router);
    foodForThought(router);
    howTos(router);
    todos(router);
};