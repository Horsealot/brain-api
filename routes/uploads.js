const auth = require('./tools/auth');

const uploadcontroller = require('./../controllers/upload.ctrl');

module.exports = (router) => {

    /**
     * Post a profile picture
     */
    router.post('/uploads/profile', auth.required, auth.loadUser, (req, res, next) => {
        uploadcontroller.postProfile(req, res, next);
    });

    /**
     * Post a picture
     */
    router.post('/uploads/picture', auth.required, auth.loadUser, (req, res, next) => {
        uploadcontroller.postPicture(req, res, next);
    });
};