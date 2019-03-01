const authcontroller = require('./../controllers/auth.ctrl');
const auth = require('./tools/auth');

module.exports = (router) => {
    router.post('/signup', auth.optional, (req, res, next) => {
        authcontroller.postSignup(req, res, next);
    });
    router.post('/login', auth.optional, (req, res, next) => {
        authcontroller.postLogin(req, res, next);
    });
    router.post('/invite', auth.required, auth.squadAdmin, (req, res, next) => {
        authcontroller.postInvite(req, res, next);
    });
    router.post('/reset/request', auth.optional, (req, res, next) => {
        authcontroller.postRequestPasswordReset(req, res, next);
    });
    router.post('/reset', auth.optional, (req, res, next) => {
        authcontroller.postPasswordReset(req, res, next);
    });
};