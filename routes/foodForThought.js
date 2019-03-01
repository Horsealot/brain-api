const auth = require('./tools/auth');

const fftcontroller = require('./../controllers/fft.ctrl');

module.exports = (router) => {
    /**
     * Get food for thought
     */
    router.get('/food-for-thought', auth.required, (req, res, next) => {
        fftcontroller.get(req, res, next);
    });
};