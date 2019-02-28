const auth = require('./tools/auth');

const goalcontroller = require('./../controllers/goal.ctrl');

module.exports = (router) => {

    /**
     * Create a goal
     */
    router.post('/goals', auth.required, auth.loadUser, (req, res, next) => {
        goalcontroller.postGoals(req, res, next);
    });

    /**
     * Get my goals
     */
    router.get('/goals', auth.required, auth.loadUser, (req, res, next) => {
        goalcontroller.getGoals(req, res, next);
    });

    /**
     * Get user's goals
     */
    router.get('/users/:id/goals', auth.required, auth.loadUser, auth.admin, (req, res, next) => {
        goalcontroller.getUserGoals(req, res, next);
    });

    /**
     * Update an okr
     */
    router.post('/goals/:id', auth.required, auth.loadUser, (req, res, next) => {
        goalcontroller.updateGoals(req, res, next);
    });

    /**
     * Delete an okr
     */
    router.delete('/goals/:id', auth.required, auth.loadUser, (req, res, next) => {
        goalcontroller.deleteGoals(req, res, next);
    });
};