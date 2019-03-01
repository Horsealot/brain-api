const auth = require('./tools/auth');

const okrcontroller = require('./../controllers/okr.ctrl');

module.exports = (router) => {

    /**
     * Create an okr
     */
    router.post('/okrs', auth.required, auth.loadUser, auth.loadSquadId, (req, res, next) => {
        okrcontroller.postOkr(req, res, next);
    });

    /**
     * Get OKR
     */
    router.get('/okrs', auth.required, auth.loadUser, auth.squadMemberOrSuperAdmin, auth.loadSquadId, (req, res, next) => {
        okrcontroller.getOkr(req, res, next);
    });

    /**
     * Get past OKR
     */
    router.get('/okrs/past', auth.required, auth.loadUser, auth.squadMemberOrSuperAdmin, auth.loadSquadId, (req, res, next) => {
        okrcontroller.getPastOkr(req, res, next);
    });

    /**
     * Update an okr
     */
    router.post('/okrs/:id', auth.required, auth.loadUser, (req, res, next) => {
        okrcontroller.updateOkr(req, res, next);
    });

    /**
     * Delete an okr
     */
    router.delete('/okrs/:id', auth.required, auth.loadUser, (req, res, next) => {
        okrcontroller.deleteOkr(req, res, next);
    });
};