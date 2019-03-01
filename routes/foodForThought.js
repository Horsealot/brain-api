const auth = require('./tools/auth');

const fftcontroller = require('./../controllers/fft.ctrl');

module.exports = (router) => {
    /**
     * Get food for thought
     */
    router.get('/food-for-thought', auth.required, (req, res, next) => {
        fftcontroller.get(req, res, next);
    });

    /**
     * Delete food for thought message
     */
    router.delete('/food-for-thought/:id', auth.required, auth.admin, (req, res, next) => {
        fftcontroller.deleteMessage(req, res, next);
    });
};