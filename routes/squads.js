const auth = require('./tools/auth');

const squadcontroller = require('./../controllers/squad.ctrl');

module.exports = (router) => {

    /**
     * Post a squad
     */
    router.post('/squads', auth.required, auth.admin, (req, res, next) => {
        squadcontroller.postSquad(req, res, next);
    });

    /**
     * Update a squad
     */
    router.post('/squads/:id', auth.required, auth.loadUser, (req, res, next) => {
        squadcontroller.updateSquad(req, res, next);
    });
};