const auth = require('./tools/auth');

const todocontroller = require('./../controllers/todo.ctrl');

module.exports = (router) => {
    /**
     * Get squad todo
     */
    router.get('/todo', auth.required, auth.squadMemberOrSuperAdmin, auth.loadSquad, (req, res, next) => {
        todocontroller.getSquadTodo(req, res, next);
    });
};