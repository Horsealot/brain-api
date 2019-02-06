const auth = require('./tools/auth');

const usercontroller = require('./../controllers/user.ctrl');

module.exports = (router) => {

    /**
     * get all squads
     */
    router.get('/squads', auth.required, (req, res, next) => {
        usercontroller.getSquads(req, res, next);
    });

    /**
     * get squads members
     */
    router.get('/squads/:squadId', auth.required, auth.squadAdmin, (req, res, next) => {
        usercontroller.getSquad(req, res, next);
    });

    /**
     * get all users
     */
    router.get('/users', auth.required, auth.squadAdminOrSuperadmin, (req, res, next) => {
        usercontroller.getUsers(req, res, next);
    });

    /**
     * Add/Edit a user to a squad
     */
    router.post('/users/:id/squads', auth.required, auth.squadAdminOrSuperadmin, (req, res, next) => {
        usercontroller.postUserSquads(req, res, next);
    });

    /**
     * Remove a user from a squad
     */
    router.delete('/users/:id/squads', auth.required, auth.squadAdminOrSuperadmin, (req, res, next) => {
        usercontroller.deleteUserSquads(req, res, next);
    });

    /**
     * get a user
     */
    router.get('/users/:id', auth.required, auth.loadUser, (req, res, next) => {
        usercontroller.getUser(req, res, next);
    });

    /**
     * get a user
     */
    router.post('/users/:id', auth.required, auth.hasRightsOnUser, (req, res, next) => {
        usercontroller.postUser(req, res, next);
    });
    //
    // /**
    //  * get a user
    //  */
    // router.route('/users/:id').get(usercontroller.getUser);
    //
    // /**
    //  * Update a user
    //  */
    // router.route('/users/:id').post(usercontroller.getUser);

    // /**
    //  * get a user profile
    //  */
    // router
    //     .route('/user/profile/:id')
    //     .get(usercontroller.getUserProfile)
    //
    // /**
    //  * adds a user
    //  */
    // router
    //     .route('/user')
    //     .post(usercontroller.addUser)
    //
    // /**
    //  * follow a user
    //  */
    // router
    //     .route('/user/follow')
    //     .post(usercontroller.followUser)
};