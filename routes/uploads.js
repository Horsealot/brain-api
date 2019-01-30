const auth = require('./tools/auth');

const uploadcontroller = require('./../controllers/upload.ctrl');

module.exports = (router) => {

    /**
     * Post a picture
     */
    router.post('/uploads/picture', auth.required, auth.loadUser, (req, res, next) => {
        uploadcontroller.postPicture(req, res, next);
    });
};