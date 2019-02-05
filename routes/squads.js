const auth = require('./tools/auth');

const squadcontroller = require('./../controllers/squad.ctrl');

module.exports = (router) => {

    /**
     * Post a squad
     */
    router.post('/squads', auth.required, auth.admin, (req, res, next) => {
        squadcontroller.postSquad(req, res, next);
    });
};