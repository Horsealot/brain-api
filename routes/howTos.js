const auth = require('./tools/auth');

const howtocontroller = require('./../controllers/howTo.ctrl');

module.exports = (router) => {

    /**
     * Create a How To
     */
    router.post('/how-to', auth.required, auth.loadUser,(req, res, next) => {
        howtocontroller.postHowTo(req, res, next);
    });

    /**
     * Delete a How To
     */
    router.delete('/how-to/:id', auth.required, auth.loadUser, (req, res, next) => {
        howtocontroller.deleteHowTo(req, res, next);
    });

    /**
     * Get user How To
     */
    router.get('/how-to', auth.required, auth.loadUser, auth.loadSquadId, (req, res, next) => {
        howtocontroller.getHowTo(req, res, next);
    });
};